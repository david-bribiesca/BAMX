-- =============================================================================
-- BAMX Guadalajara — database schema for the demo slice.
-- Run this whole file in the Supabase dashboard:  SQL Editor > New query > Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) PROFILES  (one row per auth user, carries the role)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'donor'
             check (role in ('donor', 'beneficiary', 'staff')),
  created_at timestamptz not null default now()
);

-- When a user signs up, copy full_name + role from the signup metadata into
-- profiles. Runs as SECURITY DEFINER so it can insert regardless of RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'donor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2) CAMPAIGNS  (read-only for donors; managed by staff)
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  location_name text,
  goal_meals    integer,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3) DONATIONS  (each donor sees only their own)
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id          uuid primary key default gen_random_uuid(),
  donor_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  kind        text not null check (kind in ('especie', 'dinero')),
  items       text not null default '',
  quantity    numeric not null default 0,
  status      text not null default 'pendiente'
              check (status in ('pendiente', 'en_camino', 'entregada')),
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles  enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;

-- profiles: a user can read and update only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- campaigns: any signed-in user can read active campaigns.
drop policy if exists "campaigns_select_active" on public.campaigns;
create policy "campaigns_select_active" on public.campaigns
  for select to authenticated using (is_active = true);

-- donations: a donor can read and create only their own donations.
drop policy if exists "donations_select_own" on public.donations;
create policy "donations_select_own" on public.donations
  for select using (auth.uid() = donor_id);

drop policy if exists "donations_insert_own" on public.donations;
create policy "donations_insert_own" on public.donations
  for insert with check (auth.uid() = donor_id);

-- =============================================================================
-- SEED DATA — a few active campaigns so the home screen has something to show.
-- =============================================================================
insert into public.campaigns (name, description, location_name, goal_meals)
select * from (values
  ('Despensas Navideñas',  'Arma despensas para familias esta temporada.', 'Centro, Guadalajara', 500),
  ('Colecta de Leche',     'Leche en polvo y líquida para niños.',         'Zapopan',             300),
  ('Rescate de Alimentos', 'Frutas y verduras rescatadas cada semana.',    'Mercado de Abastos',  800)
) as v(name, description, location_name, goal_meals)
where not exists (select 1 from public.campaigns);
