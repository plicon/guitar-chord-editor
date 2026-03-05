/**
 * Generate API routes
 * 
 * POST /api/generate/from-youtube
 * Body: { "url": "https://youtube.com/watch?v=..." }
 * 
 * Extracts transcript from a YouTube tutorial video and uses the configured
 * LLM provider to generate a structured chord chart.
 */

import type { Env } from '../types';
import { createLLMProvider } from '../llm';
import { extractTranscript, extractVideoId } from '../services/youtube';
import { generateChordChart } from '../services/chordChartGenerator';
import {
  jsonResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../utils/responses';

export async function handleGenerate(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  // POST /api/generate/from-youtube
  if (pathParts[2] === 'from-youtube' && request.method === 'POST') {
    return handleFromYouTube(request, env);
  }

  // GET /api/generate/providers — list available providers & current config
  if (pathParts[2] === 'providers' && request.method === 'GET') {
    return handleListProviders(env);
  }

  return methodNotAllowedResponse(['POST', 'GET']);
}

async function handleFromYouTube(request: Request, env: Env): Promise<Response> {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!body.url) {
    return errorResponse('Missing required field: url', 400);
  }

  const videoId = extractVideoId(body.url);
  if (!videoId) {
    return errorResponse('Invalid YouTube URL', 400);
  }

  // 1. Extract transcript
  let transcript;
  try {
    transcript = await extractTranscript(body.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to extract transcript';
    return errorResponse(msg, 422);
  }

  // 2. Generate chord chart via LLM
  let llm;
  try {
    llm = createLLMProvider(env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'LLM provider not configured';
    return errorResponse(msg, 500);
  }

  let chart;
  try {
    chart = await generateChordChart(llm, transcript);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate chord chart';
    return errorResponse(`LLM generation failed: ${msg}`, 500);
  }

  return jsonResponse({
    metadata: transcript.metadata,
    transcriptLength: transcript.segments.length,
    chart,
    provider: llm.name,
    model: llm.defaultModel,
  }, 200);
}

function handleListProviders(env: Env): Response {
  const current = env.LLM_PROVIDER || 'cloudflare';
  const model = env.LLM_MODEL || '(default)';

  return jsonResponse({
    current: { provider: current, model },
    available: [
      {
        id: 'cloudflare',
        name: 'Cloudflare Workers AI',
        requiresSecret: false,
        setup: 'Add [ai] binding = "AI" to wrangler.toml',
        defaultModel: '@cf/meta/llama-3.1-8b-instruct',
      },
      {
        id: 'openai',
        name: 'OpenAI',
        requiresSecret: true,
        secretName: 'OPENAI_API_KEY',
        setup: 'wrangler secret put OPENAI_API_KEY',
        keyUrl: 'https://platform.openai.com/api-keys',
        defaultModel: 'gpt-4o-mini',
      },
      {
        id: 'google',
        name: 'Google Gemini',
        requiresSecret: true,
        secretName: 'GOOGLE_AI_API_KEY',
        setup: 'wrangler secret put GOOGLE_AI_API_KEY',
        keyUrl: 'https://aistudio.google.com/apikey',
        defaultModel: 'gemini-2.5-flash',
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        requiresSecret: true,
        secretName: 'ANTHROPIC_API_KEY',
        setup: 'wrangler secret put ANTHROPIC_API_KEY',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        defaultModel: 'claude-sonnet-4-20250514',
      },
    ],
  });
}
