-- ============================================================
-- JPFFS — Temporadas (Seasons)
-- Execute no Supabase SQL Editor
-- ============================================================

create table if not exists seasons (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  start_date date not null,
  end_date   date,
  is_active  boolean default false,
  created_at timestamptz default now()
);

alter table seasons enable row level security;
create policy "seasons_read"  on seasons for select using (true);
create policy "seasons_write" on seasons for all using (auth.role() = 'authenticated');

-- Link matches to a season
alter table matches add column if not exists season_id uuid references seasons(id);

-- Helper: ensure only one season is active at a time
create or replace function enforce_single_active_season()
returns trigger language plpgsql as $$
begin
  if NEW.is_active = true then
    update seasons set is_active = false where id <> NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_single_active_season on seasons;
create trigger trg_single_active_season
  after insert or update on seasons
  for each row execute function enforce_single_active_season();
