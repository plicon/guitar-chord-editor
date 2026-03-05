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
}

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}([?&].*)?$/;

export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url.trim());
}

export async function generateFromYouTube(url: string): Promise<YouTubeGenerateResult> {
  const apiUrl = APP_CONFIG.presets.cloudflareD1.apiUrl.replace(/\/api$/, '');

  const response = await fetch(`${apiUrl}/api/generate/from-youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.trim() }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as any).error || `Request failed (${response.status})`);
  }

  return response.json();
}
