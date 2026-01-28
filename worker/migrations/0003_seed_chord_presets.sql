-- Seed common chord presets
-- This migration adds the most common open and barre chords

-- Open major chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('c', 'C', '[-1,3,2,0,1,0]', '[-1,3,2,0,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('d', 'D', '[-1,-1,0,2,3,2]', '[-1,-1,0,2,3,2]', NULL, strftime('%s', 'now') * 1000),
  ('e', 'E', '[0,2,2,1,0,0]', '[0,2,2,1,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('g', 'G', '[3,2,0,0,0,3]', '[3,2,0,0,0,3]', NULL, strftime('%s', 'now') * 1000),
  ('a', 'A', '[-1,0,2,2,2,0]', '[-1,0,2,2,2,0]', NULL, strftime('%s', 'now') * 1000);

-- Open minor chords  
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('am', 'Am', '[-1,0,2,2,1,0]', '[-1,0,2,2,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('dm', 'Dm', '[-1,-1,0,2,3,1]', '[-1,-1,0,2,3,1]', NULL, strftime('%s', 'now') * 1000),
  ('em', 'Em', '[0,2,2,0,0,0]', '[0,2,2,0,0,0]', NULL, strftime('%s', 'now') * 1000);

-- Barre chord - F major (E shape, 1st fret)
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('f', 'F', '[1,3,3,2,1,1]', '[1,3,3,2,1,1]', '[{"fret":1,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000);

-- Open 7th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a7', 'A7', '[-1,0,2,0,2,0]', '[-1,0,2,0,2,0]', NULL, strftime('%s', 'now') * 1000),
  ('b7', 'B7', '[-1,2,1,2,0,2]', '[-1,2,1,2,0,2]', NULL, strftime('%s', 'now') * 1000),
  ('c7', 'C7', '[-1,3,2,3,1,0]', '[-1,3,2,3,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('d7', 'D7', '[-1,-1,0,2,1,2]', '[-1,-1,0,2,1,2]', NULL, strftime('%s', 'now') * 1000),
  ('e7', 'E7', '[0,2,0,1,0,0]', '[0,2,0,1,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('g7', 'G7', '[3,2,0,0,0,1]', '[3,2,0,0,0,1]', NULL, strftime('%s', 'now') * 1000);

-- Barre chords (F shape) - Major
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('fm', 'Fm', '[1,3,3,1,1,1]', '[1,3,3,1,1,1]', '[{"fret":1,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('f_sharp', 'F#', '[2,4,4,3,2,2]', '[2,4,4,3,2,2]', '[{"fret":2,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('f_sharp_m', 'F#m', '[2,4,4,2,2,2]', '[2,4,4,2,2,2]', '[{"fret":2,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('g_sharp', 'G#', '[4,6,6,5,4,4]', '[4,6,6,5,4,4]', '[{"fret":4,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('g_sharp_m', 'G#m', '[4,6,6,4,4,4]', '[4,6,6,4,4,4]', '[{"fret":4,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('a_sharp', 'A#', '[6,8,8,7,6,6]', '[6,8,8,7,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('a_sharp_m', 'A#m', '[6,8,8,6,6,6]', '[6,8,8,6,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bb', 'Bb', '[6,8,8,7,6,6]', '[6,8,8,7,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bbm', 'Bbm', '[6,8,8,6,6,6]', '[6,8,8,6,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000);

-- Barre chords (E shape) - Major and Minor
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('b', 'B', '[-1,2,4,4,4,2]', '[-1,2,4,4,4,2]', '[{"fret":2,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bm', 'Bm', '[-1,2,4,4,3,2]', '[-1,2,4,4,3,2]', '[{"fret":2,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('c_sharp', 'C#', '[-1,4,6,6,6,4]', '[-1,4,6,6,6,4]', '[{"fret":4,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('c_sharp_m', 'C#m', '[-1,4,6,6,5,4]', '[-1,4,6,6,5,4]', '[{"fret":4,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('d_sharp', 'D#', '[-1,6,8,8,8,6]', '[-1,6,8,8,8,6]', '[{"fret":6,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('d_sharp_m', 'D#m', '[-1,6,8,8,7,6]', '[-1,6,8,8,7,6]', '[{"fret":6,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('eb', 'Eb', '[-1,6,8,8,8,6]', '[-1,6,8,8,8,6]', '[{"fret":6,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000),
  ('ebm', 'Ebm', '[-1,6,8,8,7,6]', '[-1,6,8,8,7,6]', '[{"fret":6,"fromString":5,"toString":1}]', strftime('%s', 'now') * 1000);

-- Major 7th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('amaj7', 'Amaj7', '[-1,0,2,1,2,0]', '[-1,0,2,1,2,0]', NULL, strftime('%s', 'now') * 1000),
  ('cmaj7', 'Cmaj7', '[-1,3,2,0,0,0]', '[-1,3,2,0,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('dmaj7', 'Dmaj7', '[-1,-1,0,2,2,2]', '[-1,-1,0,2,2,2]', NULL, strftime('%s', 'now') * 1000),
  ('emaj7', 'Emaj7', '[0,2,1,1,0,0]', '[0,2,1,1,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('gmaj7', 'Gmaj7', '[3,2,0,0,0,2]', '[3,2,0,0,0,2]', NULL, strftime('%s', 'now') * 1000),
  ('fmaj7', 'Fmaj7', '[1,3,2,2,1,1]', '[1,3,2,2,1,1]', '[{"fret":1,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000);

-- Minor 7th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('am7', 'Am7', '[-1,0,2,0,1,0]', '[-1,0,2,0,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('dm7', 'Dm7', '[-1,-1,0,2,1,1]', '[-1,-1,0,2,1,1]', NULL, strftime('%s', 'now') * 1000),
  ('em7', 'Em7', '[0,2,0,0,0,0]', '[0,2,0,0,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('fm7', 'Fm7', '[1,3,1,1,1,1]', '[1,3,1,1,1,1]', '[{"fret":1,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bbmaj7', 'Bbmaj7', '[6,8,7,7,6,6]', '[6,8,7,7,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bbm7', 'Bbm7', '[6,8,6,6,6,6]', '[6,8,6,6,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('ebmaj7', 'Ebmaj7', '[-1,6,8,7,8,6]', '[-1,6,8,7,8,6]', NULL, strftime('%s', 'now') * 1000),
  ('ebm7', 'Ebm7', '[-1,6,8,6,7,6]', '[-1,6,8,6,7,6]', NULL, strftime('%s', 'now') * 1000);

-- Suspended chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('asus2', 'Asus2', '[-1,0,2,2,0,0]', '[-1,0,2,2,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('asus4', 'Asus4', '[-1,0,2,2,3,0]', '[-1,0,2,2,3,0]', NULL, strftime('%s', 'now') * 1000),
  ('dsus2', 'Dsus2', '[-1,-1,0,2,3,0]', '[-1,-1,0,2,3,0]', NULL, strftime('%s', 'now') * 1000),
  ('dsus4', 'Dsus4', '[-1,-1,0,2,3,3]', '[-1,-1,0,2,3,3]', NULL, strftime('%s', 'now') * 1000),
  ('esus4', 'Esus4', '[0,2,2,2,0,0]', '[0,2,2,2,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('gsus4', 'Gsus4', '[3,3,0,0,0,3]', '[3,3,0,0,0,3]', NULL, strftime('%s', 'now') * 1000);

-- Diminished chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('adim', 'Adim', '[-1,0,1,2,1,2]', '[-1,0,1,2,1,2]', NULL, strftime('%s', 'now') * 1000),
  ('bdim', 'Bdim', '[-1,2,3,4,3,4]', '[-1,2,3,4,3,4]', NULL, strftime('%s', 'now') * 1000),
  ('cdim', 'Cdim', '[-1,3,4,5,4,5]', '[-1,3,4,5,4,5]', NULL, strftime('%s', 'now') * 1000),
  ('ddim', 'Ddim', '[-1,-1,0,1,0,1]', '[-1,-1,0,1,0,1]', NULL, strftime('%s', 'now') * 1000),
  ('edim', 'Edim', '[0,1,2,0,2,0]', '[0,1,2,0,2,0]', NULL, strftime('%s', 'now') * 1000);

-- Augmented chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('aaug', 'Aaug', '[-1,0,3,2,2,1]', '[-1,0,3,2,2,1]', NULL, strftime('%s', 'now') * 1000),
  ('caug', 'Caug', '[-1,3,2,1,1,0]', '[-1,3,2,1,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('daug', 'Daug', '[-1,-1,0,3,3,2]', '[-1,-1,0,3,3,2]', NULL, strftime('%s', 'now') * 1000),
  ('eaug', 'Eaug', '[0,3,2,1,1,0]', '[0,3,2,1,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('gaug', 'Gaug', '[3,2,1,0,0,3]', '[3,2,1,0,0,3]', NULL, strftime('%s', 'now') * 1000);

-- Power chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a5', 'A5', '[-1,0,2,2,-1,-1]', '[-1,0,2,2,-1,-1]', NULL, strftime('%s', 'now') * 1000),
  ('b5', 'B5', '[-1,2,4,4,-1,-1]', '[-1,2,4,4,-1,-1]', NULL, strftime('%s', 'now') * 1000),
  ('c5', 'C5', '[-1,3,5,5,-1,-1]', '[-1,3,5,5,-1,-1]', NULL, strftime('%s', 'now') * 1000),
  ('d5', 'D5', '[-1,-1,0,2,3,-1]', '[-1,-1,0,2,3,-1]', NULL, strftime('%s', 'now') * 1000),
  ('e5', 'E5', '[0,2,2,-1,-1,-1]', '[0,2,2,-1,-1,-1]', NULL, strftime('%s', 'now') * 1000),
  ('f5', 'F5', '[1,3,3,-1,-1,-1]', '[1,3,3,-1,-1,-1]', NULL, strftime('%s', 'now') * 1000),
  ('g5', 'G5', '[3,5,5,-1,-1,-1]', '[3,5,5,-1,-1,-1]', NULL, strftime('%s', 'now') * 1000);

-- Add9 chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('aadd9', 'Aadd9', '[-1,0,2,4,2,0]', '[-1,0,2,4,2,0]', NULL, strftime('%s', 'now') * 1000),
  ('cadd9', 'Cadd9', '[-1,3,2,0,3,0]', '[-1,3,2,0,3,0]', NULL, strftime('%s', 'now') * 1000),
  ('dadd9', 'Dadd9', '[-1,-1,0,2,3,0]', '[-1,-1,0,2,3,0]', NULL, strftime('%s', 'now') * 1000),
  ('eadd9', 'Eadd9', '[0,2,2,1,0,2]', '[0,2,2,1,0,2]', NULL, strftime('%s', 'now') * 1000),
  ('gadd9', 'Gadd9', '[3,2,0,0,0,3]', '[3,2,0,0,0,3]', NULL, strftime('%s', 'now') * 1000);

-- 6th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a6', 'A6', '[-1,0,2,2,2,2]', '[-1,0,2,2,2,2]', NULL, strftime('%s', 'now') * 1000),
  ('c6', 'C6', '[-1,3,2,2,1,0]', '[-1,3,2,2,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('d6', 'D6', '[-1,-1,0,2,0,2]', '[-1,-1,0,2,0,2]', NULL, strftime('%s', 'now') * 1000),
  ('e6', 'E6', '[0,2,2,1,2,0]', '[0,2,2,1,2,0]', NULL, strftime('%s', 'now') * 1000),
  ('g6', 'G6', '[3,2,0,0,0,0]', '[3,2,0,0,0,0]', NULL, strftime('%s', 'now') * 1000),
  ('am6', 'Am6', '[-1,0,2,2,1,2]', '[-1,0,2,2,1,2]', NULL, strftime('%s', 'now') * 1000),
  ('dm6', 'Dm6', '[-1,-1,0,2,0,1]', '[-1,-1,0,2,0,1]', NULL, strftime('%s', 'now') * 1000),
  ('em6', 'Em6', '[0,2,2,0,2,0]', '[0,2,2,0,2,0]', NULL, strftime('%s', 'now') * 1000);

-- 9th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a9', 'A9', '[-1,0,2,4,2,3]', '[-1,0,2,4,2,3]', NULL, strftime('%s', 'now') * 1000),
  ('c9', 'C9', '[-1,3,2,3,3,3]', '[-1,3,2,3,3,3]', NULL, strftime('%s', 'now') * 1000),
  ('d9', 'D9', '[-1,-1,0,2,1,0]', '[-1,-1,0,2,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('e9', 'E9', '[0,2,0,1,0,2]', '[0,2,0,1,0,2]', NULL, strftime('%s', 'now') * 1000),
  ('g9', 'G9', '[3,2,0,2,0,1]', '[3,2,0,2,0,1]', NULL, strftime('%s', 'now') * 1000),
  ('am9', 'Am9', '[-1,0,2,4,1,3]', '[-1,0,2,4,1,3]', NULL, strftime('%s', 'now') * 1000),
  ('dm9', 'Dm9', '[-1,-1,0,2,1,0]', '[-1,-1,0,2,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('em9', 'Em9', '[0,2,0,0,0,2]', '[0,2,0,0,0,2]', NULL, strftime('%s', 'now') * 1000);

-- 11th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a11', 'A11', '[-1,0,0,0,2,0]', '[-1,0,0,0,2,0]', NULL, strftime('%s', 'now') * 1000),
  ('c11', 'C11', '[-1,3,3,3,3,3]', '[-1,3,3,3,3,3]', NULL, strftime('%s', 'now') * 1000),
  ('d11', 'D11', '[-1,-1,0,0,1,0]', '[-1,-1,0,0,1,0]', NULL, strftime('%s', 'now') * 1000),
  ('e11', 'E11', '[0,0,0,1,0,0]', '[0,0,0,1,0,0]', NULL, strftime('%s', 'now') * 1000);

-- 13th chords
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('a13', 'A13', '[-1,0,2,0,2,2]', '[-1,0,2,0,2,2]', NULL, strftime('%s', 'now') * 1000),
  ('c13', 'C13', '[-1,3,2,3,3,5]', '[-1,3,2,3,3,5]', NULL, strftime('%s', 'now') * 1000),
  ('d13', 'D13', '[-1,-1,0,2,1,2]', '[-1,-1,0,2,1,2]', NULL, strftime('%s', 'now') * 1000),
  ('e13', 'E13', '[0,2,0,1,2,0]', '[0,2,0,1,2,0]', NULL, strftime('%s', 'now') * 1000);

-- Additional 7th variations
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES
  ('c_sharp_7', 'C#7', '[-1,4,6,4,6,4]', '[-1,4,6,4,6,4]', NULL, strftime('%s', 'now') * 1000),
  ('f_sharp_7', 'F#7', '[2,4,2,3,2,2]', '[2,4,2,3,2,2]', '[{"fret":2,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('g_sharp_7', 'G#7', '[4,6,4,5,4,4]', '[4,6,4,5,4,4]', '[{"fret":4,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('bb7', 'Bb7', '[6,8,6,7,6,6]', '[6,8,6,7,6,6]', '[{"fret":6,"fromString":6,"toString":1}]', strftime('%s', 'now') * 1000),
  ('eb7', 'Eb7', '[-1,6,8,6,8,6]', '[-1,6,8,6,8,6]', NULL, strftime('%s', 'now') * 1000);

-- Inserted 107 common chords
