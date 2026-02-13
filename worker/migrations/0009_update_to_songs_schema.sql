-- Migration to update charts table to songs table with section-based structure
-- This migration renames the charts table to songs and updates the schema
-- to match the frontend Song type with sections

-- Drop the old charts table (safe since no data exists)
DROP TABLE IF EXISTS charts;

-- Create new songs table with section-based structure
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  description TEXT,
  key TEXT,
  tempo INTEGER,
  time_signature TEXT,
  sections TEXT NOT NULL, -- JSON array of SongSection objects
  strumming_pattern TEXT, -- JSON StrummingPattern
  notes TEXT,
  created_at TEXT NOT NULL, -- ISO 8601 timestamp
  updated_at TEXT NOT NULL  -- ISO 8601 timestamp
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_updated_at ON songs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
