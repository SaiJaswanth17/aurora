-- Insert Aurora Bot Profile with a VALID UUID
INSERT INTO profiles (id, username, status, avatar_url)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Aurora',
  'online',
  'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg'
) ON CONFLICT (id) DO NOTHING;
