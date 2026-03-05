/**
 * Tests for the /api/generate route handler
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('../../worker/src/services/youtube', () => ({
  extractVideoId: vi.fn(),
  extractTranscript: vi.fn(),
  fetchVideoMetadata: vi.fn(),
}));

vi.mock('../../worker/src/llm', () => ({
  createLLMProvider: vi.fn(),
}));

vi.mock('../../worker/src/services/chordChartGenerator', () => ({
  generateChordChart: vi.fn(),
  generateChordChartFromVideo: vi.fn(),
}));

import { handleGenerate } from '../../worker/src/routes/generate';
import { extractVideoId, extractTranscript, fetchVideoMetadata } from '../../worker/src/services/youtube';
import { createLLMProvider } from '../../worker/src/llm';
import { generateChordChart, generateChordChartFromVideo } from '../../worker/src/services/chordChartGenerator';
import type { Env } from '../../worker/src/types';

function createRequest(method: string, body?: Record<string, unknown>): Request {
  return new Request('https://test.com/api/generate/from-youtube', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const mockEnv = {
  DB: {} as unknown,
  ENVIRONMENT: 'development' as const,
  LLM_PROVIDER: 'openai',
  OPENAI_API_KEY: 'sk-test',
} as Env;

const mockEnvWithGoogle = {
  ...mockEnv,
  GOOGLE_AI_API_KEY: 'test-google-key',
} as Env;

describe('handleGenerate - POST /api/generate/from-youtube', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when url is missing', async () => {
    const req = createRequest('POST', {});
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('url');
  });

  it('returns 400 for invalid YouTube URL', async () => {
    vi.mocked(extractVideoId).mockReturnValue(null);
    const req = createRequest('POST', { url: 'not-a-url' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('Invalid YouTube URL');
  });

  it('returns 422 when transcript fails and no GOOGLE_AI_API_KEY', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockRejectedValue(new Error('No captions available'));

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(422);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('No captions available');
    expect(body.error).toContain('GOOGLE_AI_API_KEY');
  });

  it('falls back to Gemini video analysis when no captions but GOOGLE_AI_API_KEY set', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockRejectedValue(new Error('No captions available'));
    vi.mocked(fetchVideoMetadata).mockResolvedValue({
      videoId: 'abc12345678', title: 'Test Video', author: 'Author', description: '',
    });
    vi.mocked(generateChordChartFromVideo).mockResolvedValue({
      title: 'Test Video',
      sections: [{ name: 'Verse', type: 'verse', chords: ['G', 'D'] }],
    });

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnvWithGoogle, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(200);

    const body = await res.json() as { chart: { title: string }; provider: string; analysisMethod: string };
    expect(body.chart.title).toBe('Test Video');
    expect(body.provider).toBe('google');
    expect(body.analysisMethod).toBe('video');
    expect(generateChordChartFromVideo).toHaveBeenCalledWith(
      'test-google-key',
      'https://www.youtube.com/watch?v=abc12345678',
      expect.objectContaining({ videoId: 'abc12345678' }),
      undefined,
    );
  });

  it('returns 500 when Gemini video fallback fails', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockRejectedValue(new Error('No captions available'));
    vi.mocked(fetchVideoMetadata).mockResolvedValue({
      videoId: 'abc12345678', title: 'Test', author: 'Author', description: '',
    });
    vi.mocked(generateChordChartFromVideo).mockRejectedValue(
      new Error('Gemini video analysis failed (429): Rate limited')
    );

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnvWithGoogle, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(500);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('Video analysis failed');
  });

  it('returns 500 when LLM chart generation fails', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockResolvedValue({
      metadata: { videoId: 'abc12345678', title: 'Test', author: 'Auth', description: '' },
      segments: [{ text: 'Hello', start: 0, duration: 1 }],
      fullText: 'Hello',
    });
    const mockProvider = { name: 'openai' as const, defaultModel: 'gpt-4o-mini', complete: vi.fn() };
    vi.mocked(createLLMProvider).mockReturnValue(mockProvider);
    vi.mocked(generateChordChart).mockRejectedValue(new Error('Failed to parse LLM response'));

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(500);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('LLM generation failed');
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('https://test.com/api/generate/from-youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns 500 when LLM provider fails to initialize', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockResolvedValue({
      metadata: { videoId: 'abc12345678', title: 'Test', author: 'Auth', description: '' },
      segments: [{ text: 'Hello', start: 0, duration: 1 }],
      fullText: 'Hello',
    });
    vi.mocked(createLLMProvider).mockImplementation(() => {
      throw new Error('OPENAI_API_KEY secret not configured');
    });

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(500);
  });

  it('returns 200 with chart on success', async () => {
    vi.mocked(extractVideoId).mockReturnValue('abc12345678');
    vi.mocked(extractTranscript).mockResolvedValue({
      metadata: { videoId: 'abc12345678', title: 'Test Song', author: 'Author', description: '' },
      segments: [{ text: 'Play Am then C', start: 0, duration: 2 }],
      fullText: 'Play Am then C',
    });
    const mockProvider = { name: 'openai' as const, defaultModel: 'gpt-4o-mini', complete: vi.fn() };
    vi.mocked(createLLMProvider).mockReturnValue(mockProvider);
    vi.mocked(generateChordChart).mockResolvedValue({
      title: 'Test Song',
      sections: [{ name: 'Verse', type: 'verse', chords: ['Am', 'C'] }],
    });

    const req = createRequest('POST', { url: 'https://youtube.com/watch?v=abc12345678' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'from-youtube']);
    expect(res.status).toBe(200);

    const body = await res.json() as { chart: { title: string; sections: Array<{ chords: string[] }> }; provider: string; model: string };
    expect(body.chart.title).toBe('Test Song');
    expect(body.chart.sections[0].chords).toEqual(['Am', 'C']);
    expect(body.provider).toBe('openai');
    expect(body.model).toBe('gpt-4o-mini');
  });
});

describe('handleGenerate - GET /api/generate/providers', () => {
  it('returns available providers', async () => {
    const req = new Request('https://test.com/api/generate/providers', { method: 'GET' });
    const res = await handleGenerate(req, mockEnv, ['api', 'generate', 'providers']);
    expect(res.status).toBe(200);

    const body = await res.json() as { current: { provider: string }; available: Array<{ id: string }> };
    expect(body.current.provider).toBe('openai');
    expect(body.available).toHaveLength(4);
    expect(body.available.map((p) => p.id)).toEqual([
      'cloudflare', 'openai', 'google', 'anthropic',
    ]);
  });
});
