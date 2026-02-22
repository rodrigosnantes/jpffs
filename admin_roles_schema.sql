-- ─── Admin Role System ────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Ensure profiles table has role column (already exists, but just in case)
alter table profiles add column if not exists role text not null default 'user'
    check (role in ('admin', 'user'));

-- 2. Set your own account as admin (replace with your actual user ID from auth.users)
-- You can find your user ID in: Supabase Dashboard → Auth → Users
-- update profiles set role = 'admin' where id = 'YOUR_USER_UUID_HERE';

-- 3. Helper function: check if current user is admin
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id   = auth.uid()
      and role = 'admin'
  );
$$;

-- 4. RLS: only admins can INSERT / UPDATE / DELETE players
-- (adjust to match your existing RLS setup)
drop policy if exists "Admins can manage players" on players;
create policy "Admins can manage players"
    on players
    for all
    using    (is_admin())
    with check (is_admin());

drop policy if exists "Anyone can read players" on players;
create policy "Anyone can read players"
    on players
    for select
    using (true);

-- 5. RLS: only admins can update/delete matches (reading allowed for all)
drop policy if exists "Admins can manage matches" on matches;
create policy "Admins can manage matches"
    on matches
    for all
    using    (is_admin())
    with check (is_admin());

drop policy if exists "Anyone can read matches" on matches;
create policy "Anyone can read matches"
    on matches
    for select
    using (true);

-- 6. RLS: only admins can manage seasons
drop policy if exists "Admins can manage seasons" on seasons;
create policy "Admins can manage seasons"
    on seasons
    for all
    using    (is_admin())
    with check (is_admin());

drop policy if exists "Anyone can read seasons" on seasons;
create policy "Anyone can read seasons"
    on seasons
    for select
    using (true);

-- 7. RLS: profiles — users can see/edit their own; admins can see all
alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
    on profiles
    for select
    using (auth.uid() = id or is_admin());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
    on profiles
    for update
    using    (auth.uid() = id or is_admin())
    with check (auth.uid() = id or is_admin());

drop policy if exists "Admins can insert profiles" on profiles;
create policy "Admins can insert profiles"
    on profiles
    for insert
    with check (is_admin() or auth.uid() = id);

drop policy if exists "Admins can delete profiles" on profiles;
create policy "Admins can delete profiles"
    on profiles
    for delete
    using (is_admin());

