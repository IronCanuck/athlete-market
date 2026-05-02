-- Seed default categories for Athlete Market
insert into public.categories (slug, name, description, icon, position) values
  ('social-media',     'Social Media Promotions', 'Posts, stories, reels, and shoutouts on the athlete''s channels.',           'Instagram',  1),
  ('personal-coaching','Personal Coaching & Lessons', 'One-on-one or group coaching sessions in your sport.',                     'Dumbbell',   2),
  ('appearances',      'Event Appearances',      'Camps, signings, charity events, and meet-and-greets.',                       'CalendarHeart', 3),
  ('cameo-videos',     'Personalized Videos',    'Custom shoutouts, birthday wishes, and pump-up videos.',                       'Video',      4),
  ('autographs',       'Autographs & Memorabilia', 'Signed gear, photos, and game-used items shipped to your door.',             'PenLine',    5),
  ('brand-deals',      'Brand Partnerships',     'Long-form NIL collaborations with brands and local businesses.',               'Handshake',  6),
  ('content-creation', 'Custom Content Shoots',  'High-quality photo and video content featuring the athlete with your brand.',  'Camera',     7),
  ('tutoring',         'Tutoring & Mentorship',  'Academic tutoring, recruiting advice, and mentorship sessions.',                'GraduationCap', 8),
  ('speaking',         'Speaking Engagements',   'Motivational talks, school visits, and team-building sessions.',                'Mic',        9)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  position = excluded.position;
