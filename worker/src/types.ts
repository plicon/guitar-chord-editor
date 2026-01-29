/**
 * API Types for FretKit Cloudflare Worker
 * 
 * These types match the D1 database schema and define the API response formats.
 */

// Import Cloudflare Workers types
import type { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Database Types (D1 schema)
// ============================================================================

export interface ChordChartRow {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  time_signature?: string;
  tempo?: number;
  chords: string; // JSON string
  strumming_pattern?: string; // JSON string
  notes?: string;
  created_at: number; // Unix timestamp in milliseconds
  updated_at: number; // Unix timestamp in milliseconds
}

export interface StrummingPresetRow {
  id: string;
  name: string;
  pattern: string; // JSON string
  description?: string;
  created_at: number;
}

export interface ChordPresetRow {
  id: string;
  name: string;
  frets: string; // JSON array of fret positions like [-1, 3, 2, 0, 1, 0]
  fingers: string; // JSON array of finger numbers like [-1, 3, 2, 0, 1, 0]
  barre_info: string | null; // JSON object with {fret, fromString, toString} or NULL
  created_at: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ChordChart {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  timeSignature?: string;
  tempo?: number;
  chords: ChordData[];
  strummingPattern?: StrummingPattern;
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ChordData {
  id: string;
  name: string;
  positions: number[];
  fingering: number[];
  barres: number[];
  capo?: number;
  baseFret: number;
  frets: number;
  midi?: number[];
  suffixVariations?: string[];
}

export interface StrummingPattern {
  id: string;
  name: string;
  pattern: Beat[];
  description?: string;
}

export interface Beat {
  direction: 'down' | 'up';
  isMuted?: boolean;
}

export interface StrummingPreset {
  id: string;
  name: string;
  pattern: Beat[];
  description?: string;
  createdAt: string;
}

export interface ChordPreset {
  id: string;
  name: string;
  frets: (number | 'x' | null)[];  // Array like [0, 2, 2, 1, 0, 0] or 'x' for muted, null for not played
  fingers: (number | null)[]; // Array of finger numbers
  barreInfo?: {
    fret: number;
    fromString: number;
    toString: number;
  } | null;
  createdAt: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateChartRequest {
  title: string;
  artist?: string;
  key?: string;
  timeSignature?: string;
  tempo?: number;
  chords: ChordData[];
  strummingPattern?: StrummingPattern;
  notes?: string;
}

export interface UpdateChartRequest {
  title?: string;
  artist?: string;
  key?: string;
  timeSignature?: string;
  tempo?: number;
  chords?: ChordData[];
  strummingPattern?: StrummingPattern;
  notes?: string;
}

export interface CreateChordPresetRequest {
  name: string;
  frets: (number | 'x' | null)[];
  fingers: (number | null)[];
  barreInfo?: {
    fret: number;
    fromString: number;
    toString: number;
  } | null;
}

export interface UpdateChordPresetRequest {
  name?: string;
  frets?: (number | 'x' | null)[];
  fingers?: (number | null)[];
  barreInfo?: {
    fret: number;
    fromString: number;
    toString: number;
  } | null;
}

export interface CreateStrummingPresetRequest {
  name: string;
  pattern: Beat[];
  description?: string;
}

export interface UpdateStrummingPresetRequest {
  name?: string;
  pattern?: Beat[];
  description?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

// ============================================================================
// Environment Bindings
// ============================================================================

export interface Env {
  DB: D1Database;
  ENVIRONMENT: 'production' | 'staging' | 'development';
}
