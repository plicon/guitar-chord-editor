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
  frets TEXT NOT NULL, -- JSON array of fret positions [-1=muted, 0=open, 1-24=fret numbers]
  fingers TEXT NOT NULL, -- JSON array of finger numbers [0=none, 1-4=finger, -1=muted/not played]
  barre_info TEXT, -- JSON object {fret, fromString, toString} for barre chords, NULL if no barre
  created_at INTEGER NOT NULL -- Unix timestamp in milliseconds
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_updated_at ON charts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_strumming_presets_name ON strumming_presets(name);
CREATE INDEX IF NOT EXISTS idx_chord_presets_name ON chord_presets(name);
