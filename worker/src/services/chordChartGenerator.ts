/**
 * Chord Chart Generation Service
 * 
 * Uses an LLM to parse a YouTube tutorial transcript into structured chord data.
 */

import type { LLMProvider } from '../llm';
import { CHORD_CHART_SYSTEM_PROMPT } from './chordChartPrompt';
import type { TranscriptResult } from './youtube';

export interface GeneratedChordChart {
  title: string;
  artist?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  sections: {
    name: string;
    type: string;
    chords: string[];
  }[];
  strummingPattern?: string;
  notes?: string;
}

/**
 * Generate a chord chart from a YouTube transcript using the configured LLM
 */
export async function generateChordChart(
  llm: LLMProvider,
  transcript: TranscriptResult
): Promise<GeneratedChordChart> {
  const userPrompt = buildUserPrompt(transcript);

  const response = await llm.complete({
    messages: [
      { role: 'system', content: CHORD_CHART_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    maxTokens: 4096,
  });

  return parseResponse(response.content);
}

function buildUserPrompt(transcript: TranscriptResult): string {
  const parts: string[] = [];

  parts.push(`Video: "${transcript.metadata.title}" by ${transcript.metadata.author}`);

  if (transcript.metadata.description) {
    // Include first 500 chars of description for context
    const desc = transcript.metadata.description.slice(0, 500);
    parts.push(`\nVideo description:\n${desc}`);
  }

  // Include transcript with timestamps for section detection
  parts.push(`\nTranscript:`);

  // Group into ~30 second chunks for readability
  let currentChunk = '';
  let chunkStart = 0;

  for (const seg of transcript.segments) {
    if (seg.start - chunkStart > 30 && currentChunk) {
      const timestamp = formatTime(chunkStart);
      parts.push(`[${timestamp}] ${currentChunk.trim()}`);
      currentChunk = '';
      chunkStart = seg.start;
    }
    currentChunk += ' ' + seg.text;
  }

  if (currentChunk.trim()) {
    parts.push(`[${formatTime(chunkStart)}] ${currentChunk.trim()}`);
  }

  return parts.join('\n');
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseResponse(content: string): GeneratedChordChart {
  // Strip markdown code fences if the LLM wrapped them anyway
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate minimum structure
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Response missing "sections" array');
    }

    return {
      title: parsed.title || 'Untitled',
      artist: parsed.artist,
      key: parsed.key,
      tempo: parsed.tempo ? Number(parsed.tempo) : undefined,
      timeSignature: parsed.timeSignature,
      sections: parsed.sections.map((s: { name?: string; type?: string; chords?: unknown }) => ({
        name: s.name || 'Section',
        type: s.type || 'custom',
        chords: Array.isArray(s.chords) ? s.chords.map(String) : [],
      })),
      strummingPattern: parsed.strummingPattern,
      notes: parsed.notes,
    };
  } catch (e) {
    throw new Error(
      `Failed to parse LLM response as JSON: ${e instanceof Error ? e.message : e}\n\nRaw response:\n${content.slice(0, 500)}`
    );
  }
}
