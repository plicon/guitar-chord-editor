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
  frets: number; // Number of frets to display
  fingers: string; // JSON array of {string, fret, finger?}
  barres: string | null; // JSON array of {fret, fromString, toString, finger?}
  muted_strings: string | null; // JSON array of string numbers
  open_strings: string | null; // JSON array of string numbers
  finger_labels: string | null; // JSON array of {string, finger}
  created_at: number;
  updated_at: number;
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
  fingers: FingerPosition[];
  barres: Barre[];
  mutedStrings: number[];
  openStrings: number[];
  fingerLabels: FingerLabel[];
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
  fingers: FingerPosition[];
  barres?: Barre[];
  mutedStrings?: number[];
  openStrings?: number[];
  fingerLabels?: FingerLabel[];
}

export interface UpdateChordPresetRequest {
  name?: string;
  frets?: number;
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
}
