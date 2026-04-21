-- AI persona fields used by the Founder Ghostwriter prompt (Phase 6)
alter table user_profiles
  add column if not exists founder_bio text,
  add column if not exists tone_of_voice text default 'Authentic',
  add column if not exists default_hashtags text;
