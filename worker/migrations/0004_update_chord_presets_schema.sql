-- Update chord presets schema to match frontend format
-- This migration drops the old table and creates a new one with the correct structure

-- Drop old chord presets table (data will be lost, but we'll seed it later)
DROP TABLE IF EXISTS chord_presets;

-- Create new chord presets table with frontend-compatible format
CREATE TABLE chord_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frets INTEGER NOT NULL DEFAULT 5, -- Number of frets to display
  fingers TEXT NOT NULL, -- JSON array of {string, fret, finger?}
  barres TEXT, -- JSON array of {fret, fromString, toString, finger?}
  muted_strings TEXT, -- JSON array of string numbers that are muted
  open_strings TEXT, -- JSON array of string numbers that are open
  finger_labels TEXT, -- JSON array of {string, finger}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_chord_presets_name ON chord_presets(name);
