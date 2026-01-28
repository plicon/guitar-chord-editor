-- Seed strumming presets
-- This migration adds common strumming patterns

-- 4/4 Patterns (subdivision 2 - eighth notes)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('basic_down_4_4', 'Basic Down (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down",null,"down",null]}', 'Down on every beat: 1, 2, 3, 4', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('old_faithful_4_4', 'Old Faithful (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down","up",null,"up","down",null]}', 'Old Faithful by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('shoot_em_up_4_4', 'Shoot ''Em Up (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down","up","down","up"]}', 'Shoot ''em up by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('old_faithful_shuffle_4_4', 'Old Faithful Shuffle (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down","up",null,"up","down",null]}', 'Old Faithful in shuffle by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('the_push_4_4', 'The Push (4/4)', '{"bars":2,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down","up",null,"up",null,"up","down",null,"down","up","down",null]}', 'The Push by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('2_bar_alternating_4_4', '2-Bar Alternating (4/4)', '{"bars":2,"timeSignature":"4/4","subdivision":2,"pattern":["down","up","down","up","down","up","down","up","down",null,"down","up",null,"up","down",null]}', 'Alternating emphasis over 2 bars', strftime('%s', 'now') * 1000);

-- 3/4 Patterns (Waltz time, subdivision 2 - eighth notes)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('basic_down_3_4', 'Basic Down (3/4)', '{"bars":1,"timeSignature":"3/4","subdivision":2,"pattern":["down",null,"down",null,"down",null]}', 'Down on every beat: 1, 2, 3', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('waltz_strum_3_4', 'Waltz Strum (3/4)', '{"bars":1,"timeSignature":"3/4","subdivision":2,"pattern":["down",null,"down","up","down","up"]}', 'Classic waltz pattern', strftime('%s', 'now') * 1000);

-- 6/8 Patterns (subdivision 3 - triplets)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('basic_down_6_8', 'Basic Down (6/8)', '{"bars":1,"timeSignature":"6/8","subdivision":3,"pattern":["down",null,null,null,null,null,null,null,null,"down",null,null,null,null,null,null,null,null]}', 'Down on beats 1 and 4', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('6_8_folk_strum', '6/8 Folk Strum', '{"bars":1,"timeSignature":"6/8","subdivision":3,"pattern":["down",null,"up",null,null,null,"down",null,"up",null,null,null,"down",null,"up",null,null,null]}', 'Common 6/8 pattern', strftime('%s', 'now') * 1000);

-- Inserted 11 strumming presets
