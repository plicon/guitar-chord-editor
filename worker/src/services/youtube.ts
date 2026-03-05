/**
 * YouTube Transcript Extraction Service
 * 
 * Extracts captions/transcripts from YouTube videos without requiring an API key.
 * Uses YouTube's innertube API to fetch available caption tracks.
 */

export interface TranscriptSegment {
  text: string;
  start: number; // seconds
  duration: number; // seconds
}

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  author: string;
  description: string;
}

export interface TranscriptResult {
  metadata: YouTubeMetadata;
  segments: TranscriptSegment[];
  fullText: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Might be a raw video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

// Innertube API client context
const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20240313.00.00',
  hl: 'en',
  gl: 'US',
};

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
}

interface InnertubeResponse {
  videoDetails?: {
    videoId?: string;
    title?: string;
    author?: string;
    shortDescription?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
}

/**
 * Fetch video data using YouTube's innertube player API (more reliable than HTML scraping)
 */
async function fetchVideoData(videoId: string): Promise<{
  metadata: YouTubeMetadata;
  captionsUrl: string;
}> {
  const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: INNERTUBE_CLIENT,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube innertube API returned ${response.status}`);
  }

  const data: InnertubeResponse = await response.json();

  // Check playability
  if (data.playabilityStatus?.status === 'ERROR') {
    throw new Error(data.playabilityStatus.reason || 'Video is unavailable');
  }

  const videoDetails = data.videoDetails || {};
  const metadata: YouTubeMetadata = {
    videoId,
    title: videoDetails.title || '',
    author: videoDetails.author || '',
    description: (videoDetails.shortDescription || '').slice(0, 2000),
  };

  // Find caption tracks
  const captions = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captions || captions.length === 0) {
    throw new Error(
      'No captions available for this video. The video needs auto-generated or manual captions.'
    );
  }

  // Prefer English, fall back to first available
  const englishTrack = captions.find(
    (t) => t.languageCode === 'en' || t.languageCode?.startsWith('en')
  );
  const track = englishTrack || captions[0];

  return {
    metadata,
    captionsUrl: track.baseUrl,
  };
}

/**
 * Fetch and parse the caption XML
 */
async function fetchCaptions(captionsUrl: string): Promise<TranscriptSegment[]> {
  const response = await fetch(captionsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch captions: ${response.status}`);
  }

  const xml = await response.text();
  const segments: TranscriptSegment[] = [];

  // Parse <text start="..." dur="...">content</text> elements
  const textRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    // Decode HTML entities
    const text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, '') // strip any nested HTML tags
      .trim();

    if (text) {
      segments.push({ text, start, duration });
    }
  }

  return segments;
}

/**
 * Extract transcript from a YouTube video URL
 */
export async function extractTranscript(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error(`Invalid YouTube URL: ${youtubeUrl}`);
  }

  const { metadata, captionsUrl } = await fetchVideoData(videoId);
  const segments = await fetchCaptions(captionsUrl);

  if (segments.length === 0) {
    throw new Error('Transcript was empty — the captions may not contain text.');
  }

  const fullText = segments.map((s) => s.text).join(' ');

  return { metadata, segments, fullText };
}

/**
 * Fetch just the video metadata (without requiring captions).
 * Used when we need metadata for the Gemini video fallback.
 */
export async function fetchVideoMetadata(videoId: string): Promise<YouTubeMetadata> {
  const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      videoId,
      context: { client: INNERTUBE_CLIENT },
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube innertube API returned ${response.status}`);
  }

  const data: InnertubeResponse = await response.json();
  const videoDetails = data.videoDetails || {};

  return {
    videoId,
    title: videoDetails.title || '',
    author: videoDetails.author || '',
    description: (videoDetails.shortDescription || '').slice(0, 2000),
  };
}
