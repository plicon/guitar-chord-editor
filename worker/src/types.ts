/**
 * API Types for FretKit Cloudflare Worker
 * 
 * These types match the D1 database schema and define the API response formats.
 */

// D1Database type — provided by Cloudflare Workers runtime
// Declared locally to avoid requiring @cloudflare/workers-types in the root project
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }
  interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: { changes: number; duration: number; last_row_id: number; served_by: string };
  }
  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

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
  frets: number; // Number of frets to display
  start_fret: number; // Starting fret position on neck
  fingers: string; // JSON array of {string, fret, finger?}
  barres: string | null; // JSON array of {fret, fromString, toString, finger?}
  muted_strings: string | null; // JSON array of string numbers
  open_strings: string | null; // JSON array of string numbers
  finger_labels: string | null; // JSON array of {string, finger}
  symbols: string | null; // Chord symbols (e.g., "M, maj" or "m7, min7")
  steps: string | null; // Scale steps (e.g., "1-3-5" or "1-3-5-7")
  notes: string | null; // Chord notes (e.g., "C-E-G")
  instructions: string | null; // Finger placement instructions
  created_at: number;
  updated_at: number;
}

export interface SongRow {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  key?: string;
  tempo?: number;
  time_signature?: string;
  sections: string; // JSON string
  strumming_pattern?: string; // JSON string
  notes?: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
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
  frets: number; // Number of frets to display (typically 4-5)
  startFret: number; // Starting fret position on neck (1 for open position)
  fingers: FingerPosition[];
  barres: Barre[];
  mutedStrings: number[];
  openStrings: number[];
  fingerLabels: FingerLabel[];
  symbols?: string; // Chord symbols (e.g., "M, maj" or "m7, min7")
  steps?: string; // Scale steps (e.g., "1-3-5" or "1-3-5-7")
  notes?: string; // Chord notes (e.g., "C-E-G")
  instructions?: string; // Finger placement instructions
  createdAt: string;
  updatedAt: string;
}

export interface FingerPosition {
  string: number; // 1-6 (1 = high E, 6 = low E)
  fret: number; // Fret number relative to startFret
  finger?: number; // 1-4 for finger number
}

export interface Barre {
  fret: number;
  fromString: number;
  toString: number;
  finger?: number;
}

export interface FingerLabel {
  string: number; // 1-6
  finger: number; // 1-4 or 0 for thumb (T)
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  sections: SongSection[];
  strummingPattern?: StrummingPattern;
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface SongSection {
  id: string;
  name: string;
  type: string;
  rows: SectionRow[];
  collapsed?: boolean;
}

export interface SectionRow {
  kind: 'chord-row' | 'tab-row';
  id: string;
  chords?: unknown[];
  measures?: unknown[];
  subtitle?: string;
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
  frets: number;
  startFret?: number;
  fingers: FingerPosition[];
  barres?: Barre[];
  mutedStrings?: number[];
  openStrings?: number[];
  fingerLabels?: FingerLabel[];
}

export interface CreateSongRequest {
  title: string;
  artist?: string;
  description?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  sections: SongSection[];
  strummingPattern?: StrummingPattern;
  notes?: string;
}

export interface UpdateSongRequest {
  title?: string;
  artist?: string;
  description?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  sections?: SongSection[];
  strummingPattern?: StrummingPattern;
  notes?: string;
}

export interface UpdateChordPresetRequest {
  name?: string;
  frets?: number;
  startFret?: number;
  fingers?: FingerPosition[];
  barres?: Barre[];
  mutedStrings?: number[];
  openStrings?: number[];
  fingerLabels?: FingerLabel[];
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
  // LLM provider configuration
  LLM_PROVIDER?: string;  // 'cloudflare' | 'openai' | 'google' | 'anthropic'
  LLM_MODEL?: string;     // Override default model for the selected provider
  OPENAI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}
