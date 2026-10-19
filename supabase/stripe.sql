-- =============================================================================
-- BAMX — Stripe money donations.
-- Run in Supabase: SQL Editor > New query > Run. Safe to re-run.
-- Adds a column so a paid Checkout session is only ever recorded once.
-- =============================================================================
alter table public.donations
  add column if not exists stripe_session_id text unique;
