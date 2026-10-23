alter table public.donations
  add column if not exists stripe_session_id text unique;
