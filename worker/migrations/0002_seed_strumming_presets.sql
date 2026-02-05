-- Seed strumming presets
-- This migration adds common strumming patterns

-- 3/4 Patterns (Waltz time, subdivision 2 - eighth notes)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('waltz_strum_3_4', 'Waltz Strum (3/4)', '{"bars":1,"timeSignature":"3/4","subdivision":2,"pattern":["down",null,"down","up","down","up"]}', 'Classic waltz pattern', strftime('%s', 'now') * 1000);

-- 4/4 Patterns (subdivision 2 - eighth notes)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('2847c142-a470-4b20-bda1-e5474845c5f4', 'Rollin'' and Tumblin'' (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":4,"pattern":["down",null,"down",null,null,"up","down","up","down",null,"down",null,null,"up","down","up"]}', 'By Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('2_bar_alternating_4_4', '2-Bar Alternating (4/4)', '{"bars":2,"timeSignature":"4/4","subdivision":2,"pattern":["down","up","down","up","down","up","down","up","down",null,"down","up",null,"up","down",null]}', 'Alternating emphasis over 2 bars', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('314dc073-b957-4aee-b183-ed671b22c1b7', 'Shoot ''Em Ups (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down","up","down","up"]}', 'By Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('78313419-4ab1-4b5d-9024-6c3d9ad63990', 'Saturday Night (4/4)', '{"bars":2,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down",null,"down",null,null,null,"down",null,"down",null,"down",null]}', 'By Herman Brood', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('basic_down_4_4', 'Basic Down (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down",null,"down",null]}', 'Down on every beat: 1, 2, 3, 4', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('d264142a-e55a-4c60-bbcd-037f91b80569', 'Basic 16ths (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":4,"pattern":["down",null,"down","up","down",null,"down",null,"down","up","down",null,"down",null,"down",null]}', 'by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('old_faithful_4_4', 'Old Faithful (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down","up",null,"up","down",null]}', 'Old Faithful by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('old_faithful_shuffle_4_4', 'Old Faithful Shuffle (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down","up",null,"up","down",null]}', 'Old Faithful in shuffle by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('shoot_em_up_4_4', 'Shoot ''Em Up (4/4)', '{"bars":1,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down","up","down","up"]}', 'Shoot ''em up by Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('the_push_4_4', 'The Push (4/4)', '{"bars":2,"timeSignature":"4/4","subdivision":2,"pattern":["down",null,"down",null,"down","up",null,"up",null,"up","down",null,"down","up","down",null]}', 'The Push by Justin Guitar', strftime('%s', 'now') * 1000);

-- 6/8 Patterns (subdivision 3 - triplets)
INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('3f52045e-a859-412d-9701-ec3a6dfddd2a', 'Tasty 6/8 shuffled (6/8)', '{"bars":1,"timeSignature":"6/8","subdivision":3,"pattern":["down",null,null,null,null,"up","down",null,null,"down",null,null,null,null,"up","down",null,null]}', 'By Justin Guitar', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('6_8_folk_strum', '6/8 Folk Strum', '{"bars":1,"timeSignature":"6/8","subdivision":3,"pattern":["down",null,"up",null,null,null,"down",null,"up",null,null,null,"down",null,"up",null,null,null]}', 'Common 6/8 pattern', strftime('%s', 'now') * 1000);

INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('d9e0fc66-e3a1-45d2-9f4a-4571e94e204d', 'Basic (6/8)', '{"bars":1,"timeSignature":"6/8","subdivision":3,"pattern":["down",null,null,"down",null,null,"down",null,null,"down",null,null,"down",null,null,"down",null,null]}', 'Mute all the string with the fretting hand and focus on the strumming and groove', strftime('%s', 'now') * 1000);

-- Inserted 14 strumming presets
