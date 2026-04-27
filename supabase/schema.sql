-- ============================================================================
-- class-map: Supabase schema
-- ----------------------------------------------------------------------------
-- Paste this entire file into the Supabase dashboard's SQL Editor and click
-- "Run". Safe to re-run: every statement is idempotent.
--
-- This sets up:
--   1. The `people` table (one row per submission)
--   2. Realtime so the map updates live for all viewers
--   3. Row-level security with PUBLIC read/insert/update (no delete)
--      ⚠️ This means anyone with the link can edit any entry. See README
--      for how to add real auth if you need it.
--   4. The `photos` storage bucket with public read + public upload.
-- ============================================================================

-- 1. People table -------------------------------------------------------------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  group_value text,                                   -- e.g. 'A', 'Team 1'; null when grouping is disabled
  locations   jsonb not null default '[]'::jsonb,     -- array of { city, state, country, zip, latitude, longitude }
  photo_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists people_created_at_idx on public.people (created_at desc);

-- 2. Realtime -----------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'people'
  ) then
    alter publication supabase_realtime add table public.people;
  end if;
end $$;

-- 3. Row-level security -------------------------------------------------------
alter table public.people enable row level security;

drop policy if exists "public read"   on public.people;
drop policy if exists "public insert" on public.people;
drop policy if exists "public update" on public.people;

create policy "public read"   on public.people for select using (true);
create policy "public insert" on public.people for insert with check (true);
create policy "public update" on public.people for update using (true);
-- Intentionally no DELETE policy — public deletes are blocked.

-- 4. Storage bucket for photos -----------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public read photos"   on storage.objects;
drop policy if exists "public upload photos" on storage.objects;

create policy "public read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "public upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');
