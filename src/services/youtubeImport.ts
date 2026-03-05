/**
 * YouTube Import API client
 * 
 * Calls the worker's /api/generate/from-youtube endpoint
 */

import { APP_CONFIG } from '@/config/appConfig';

export interface GeneratedSection {
  name: string;
  type: string;
  chords: string[];
  tab?: string[];
}

export interface YouTubeGenerateResult {
  metadata: {
    videoId: string;
    title: string;
    author: string;
    description: string;
  };
  transcriptLength: number;
  chart: {
    title: string;
    artist?: string;
    key?: string;
    tempo?: number;
    timeSignature?: string;
    sections: GeneratedSection[];
    strummingPattern?: string;
    notes?: string;
  };
  provider: string;
  model: string;
  /** The original YouTube URL used for import */
  sourceUrl?: string;
}

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}([?&].*)?$/;

export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url.trim());
}

export async function generateFromYouTube(url: string): Promise<YouTubeGenerateResult> {
  const apiUrl = APP_CONFIG.presets.cloudflareD1.apiUrl.replace(/\/api$/, '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/generate/from-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — the AI analysis took too long. Try again or use a shorter video.');
    }
    throw new Error('Network error — the connection was lost. The server may have timed out processing the video.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const errorBody = error as Record<string, unknown>;
    throw new Error((errorBody.error as string) || `Request failed (${response.status})`);
  }

  return response.json();
}
