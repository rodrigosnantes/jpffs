-- ============================================================
-- JPFFS — Attendance (Presença por Partida)
-- Execute no Supabase SQL Editor
-- ============================================================

create table if not exists attendance (
  id         uuid default uuid_generate_v4() primary key,
  player_id  uuid references players(id) on delete cascade not null,
  date       date not null,
  confirmed  boolean default true,
  created_at timestamptz default now(),
  unique (player_id, date)
);

alter table attendance enable row level security;

create policy "attendance_read"
  on attendance for select using (true);

create policy "attendance_write"
  on attendance for all using (auth.role() = 'authenticated');
