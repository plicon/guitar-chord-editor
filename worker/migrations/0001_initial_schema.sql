-- Initial database schema for FretKit
-- This creates all the necessary tables for charts and presets

-- Charts table: stores user-created chord charts
CREATE TABLE IF NOT EXISTS charts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  key TEXT,
  time_signature TEXT,
  tempo INTEGER,
  chords TEXT NOT NULL, -- JSON array of ChordData
  strumming_pattern TEXT, -- JSON StrummingPattern
  notes TEXT,
  created_at INTEGER NOT NULL, -- Unix timestamp in milliseconds
  updated_at INTEGER NOT NULL  -- Unix timestamp in milliseconds
);

-- Strumming presets table: predefined strumming patterns
CREATE TABLE IF NOT EXISTS strumming_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL, -- JSON StrummingPattern
  description TEXT,
  created_at INTEGER NOT NULL -- Unix timestamp in milliseconds
);

-- Chord presets table: predefined chord shapes and fingerings
CREATE TABLE IF NOT EXISTS chord_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frets INTEGER NOT NULL DEFAULT 5, -- Number of frets to display
  start_fret INTEGER NOT NULL DEFAULT 1, -- Starting fret number (1 for open position)
  fingers TEXT NOT NULL, -- JSON array of {string, fret, finger?}
  barres TEXT, -- JSON array of {fret, fromString, toString, finger?}
  muted_strings TEXT, -- JSON array of string numbers that are muted
  open_strings TEXT, -- JSON array of string numbers that are open
  finger_labels TEXT, -- JSON array of {string, finger}
  symbols TEXT, -- Chord symbols (e.g., "M, maj" or "maj7, M7")
  steps TEXT, -- Scale steps (e.g., "1-3-5" or "1-3-5-7")
  notes TEXT, -- Chord notes (e.g., "C-E-G")
  instructions TEXT, -- Finger placement instructions
  created_at INTEGER NOT NULL, -- Unix timestamp in milliseconds
  updated_at INTEGER NOT NULL  -- Unix timestamp in milliseconds
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_updated_at ON charts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_strumming_presets_name ON strumming_presets(name);
CREATE INDEX IF NOT EXISTS idx_chord_presets_name ON chord_presets(name);
