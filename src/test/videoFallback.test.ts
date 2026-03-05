/**
 * Tests for generateChordChartFromVideo (Gemini video fallback)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateChordChartFromVideo } from '../../worker/src/services/chordChartGenerator';
import type { YouTubeMetadata } from '../../worker/src/services/youtube';

const mockMetadata: YouTubeMetadata = {
  videoId: 'test123',
  title: 'Guitar Tutorial - Wonderwall',
  author: 'Guitar Teacher',
  description: 'Learn to play Wonderwall by Oasis',
};

const validChartJson = JSON.stringify({
  title: 'Wonderwall',
  artist: 'Oasis',
  key: 'Em',
  sections: [
    { name: 'Verse', type: 'verse', chords: ['Em7', 'G', 'Dsus4'] },
    { name: 'Chorus', type: 'chorus', chords: ['C', 'D', 'Em'] },
  ],
  strummingPattern: 'D DU UDU',
});

describe('generateChordChartFromVideo', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends correct request to Gemini API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: validChartJson }] } }],
      }),
    });
    globalThis.fetch = mockFetch;

    await generateChordChartFromVideo('test-key', 'https://www.youtube.com/watch?v=test123', mockMetadata);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('gemini-2.5-flash');
    expect(url).toContain('key=test-key');

    const body = JSON.parse(options.body);
    expect(body.systemInstruction).toBeDefined();
    expect(body.contents[0].parts[0].fileData.fileUri).toBe('https://www.youtube.com/watch?v=test123');
    expect(body.contents[0].parts[0].fileData.mimeType).toBe('video/mp4');
    expect(body.contents[0].parts[1].text).toContain('Guitar Tutorial - Wonderwall');
  });

  it('uses custom model when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: validChartJson }] } }],
      }),
    });
    globalThis.fetch = mockFetch;

    await generateChordChartFromVideo('test-key', 'https://youtube.com/watch?v=x', mockMetadata, 'gemini-2.5-pro');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('gemini-2.5-pro');
  });

  it('parses valid Gemini response into chart', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: validChartJson }] } }],
      }),
    });

    const result = await generateChordChartFromVideo('key', 'url', mockMetadata);

    expect(result.title).toBe('Wonderwall');
    expect(result.artist).toBe('Oasis');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].chords).toEqual(['Em7', 'G', 'Dsus4']);
    expect(result.strummingPattern).toBe('D DU UDU');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    });

    await expect(
      generateChordChartFromVideo('key', 'url', mockMetadata)
    ).rejects.toThrow('Gemini video analysis failed (429)');
  });

  it('throws on empty Gemini response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ candidates: [] }),
    });

    await expect(
      generateChordChartFromVideo('key', 'url', mockMetadata)
    ).rejects.toThrow('Gemini returned empty response');
  });

  it('throws on invalid JSON in Gemini response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'not json' }] } }],
      }),
    });

    await expect(
      generateChordChartFromVideo('key', 'url', mockMetadata)
    ).rejects.toThrow('Failed to parse LLM response as JSON');
  });

  it('includes description in prompt when available', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: validChartJson }] } }],
      }),
    });
    globalThis.fetch = mockFetch;

    await generateChordChartFromVideo('key', 'url', mockMetadata);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const textPart = body.contents[0].parts[1].text;
    expect(textPart).toContain('Learn to play Wonderwall');
  });

  it('omits description from prompt when empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: validChartJson }] } }],
      }),
    });
    globalThis.fetch = mockFetch;

    await generateChordChartFromVideo('key', 'url', { ...mockMetadata, description: '' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const textPart = body.contents[0].parts[1].text;
    expect(textPart).not.toContain('Description:');
  });
});
