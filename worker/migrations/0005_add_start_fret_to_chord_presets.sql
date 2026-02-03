-- Add startFret column to chord_presets table
-- This field indicates where on the guitar neck the chord diagram starts

ALTER TABLE chord_presets ADD COLUMN start_fret INTEGER NOT NULL DEFAULT 1;
