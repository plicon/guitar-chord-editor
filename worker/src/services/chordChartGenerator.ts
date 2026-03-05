/**
 * Chord Chart Generation Service
 * 
 * Uses an LLM to parse a YouTube tutorial transcript into structured chord data.
 * Falls back to Gemini video analysis when transcripts aren't available.
 */

import type { LLMProvider } from '../llm';
import { CHORD_CHART_SYSTEM_PROMPT } from './chordChartPrompt';
import type { TranscriptResult, YouTubeMetadata } from './youtube';

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
    tab?: string[];
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
    maxTokens: 8192,
  });

  return parseResponse(response.content);
}

/**
 * Generate a chord chart by sending the YouTube video URL directly to Gemini
 * for multimodal analysis (audio + visual). Used when captions aren't available.
 */
export async function generateChordChartFromVideo(
  googleApiKey: string,
  videoUrl: string,
  metadata: YouTubeMetadata,
  model?: string
): Promise<GeneratedChordChart> {
  const geminiModel = model || 'gemini-2.5-flash';

  const userPrompt = [
    `Analyze this YouTube guitar tutorial video and extract all chord information.`,
    `Video: "${metadata.title}" by ${metadata.author}`,
    metadata.description ? `\nDescription:\n${metadata.description.slice(0, 500)}` : '',
    `\nListen to the audio carefully. Identify:`,
    `- All chords mentioned or played`,
    `- Song sections (intro, verse, chorus, bridge, etc.)`,
    `- Strumming patterns if demonstrated`,
    `- Key, tempo, and time signature if apparent`,
  ].filter(Boolean).join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CHORD_CHART_SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: videoUrl,
                  mimeType: 'video/mp4',
                },
              },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini video analysis failed (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!text) {
    throw new Error('Gemini returned empty response for video analysis');
  }

  return parseResponse(text);
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
    return validateParsed(parsed, content);
  } catch (e) {
    // Attempt to repair truncated JSON by closing open structures
    const repaired = tryRepairTruncatedJson(cleaned);
    if (repaired) {
      try {
        const parsed = JSON.parse(repaired);
        return validateParsed(parsed, content);
      } catch {
        // Fall through to original error
      }
    }

    throw new Error(
      `Failed to parse LLM response as JSON: ${e instanceof Error ? e.message : e}\n\nRaw response:\n${content.slice(0, 500)}`
    );
  }
}

function validateParsed(parsed: Record<string, unknown>, rawContent: string): GeneratedChordChart {
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Response missing "sections" array');
  }

  return {
    title: (parsed.title as string) || 'Untitled',
    artist: parsed.artist as string | undefined,
    key: parsed.key as string | undefined,
    tempo: parsed.tempo ? Number(parsed.tempo) : undefined,
    timeSignature: parsed.timeSignature as string | undefined,
    sections: (parsed.sections as Array<{ name?: string; type?: string; chords?: unknown; tab?: unknown }>).map(s => ({
      name: s.name || 'Section',
      type: s.type || 'custom',
      chords: Array.isArray(s.chords) ? s.chords.map(String) : [],
      ...(Array.isArray(s.tab) ? { tab: s.tab.map(String) } : {}),
    })),
    strummingPattern: parsed.strummingPattern as string | undefined,
    notes: parsed.notes as string | undefined,
  };
}

/**
 * Try to repair truncated JSON by closing open brackets/braces and strings.
 */
function tryRepairTruncatedJson(json: string): string | null {
  // Only attempt repair if it looks like truncated JSON
  if (!json.startsWith('{') && !json.startsWith('[')) return null;

  let repaired = json;

  // Close any unterminated string (odd number of unescaped quotes)
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  // Build closing sequence based on open brackets
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  // Close all open structures
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  return repaired;
}
