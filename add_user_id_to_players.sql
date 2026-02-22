-- ─── Link players to auth users ──────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Remove the role column from players (roles belong in profiles, not players)
alter table players drop column if exists role;

-- 2. Add user_id FK to players table (nullable so existing players aren't broken)
alter table players
    add column if not exists user_id uuid references profiles(id) on delete set null;

-- 2. Create index for lookups by user_id
create index if not exists players_user_id_idx on players(user_id);

-- 3. RLS: each user can see their own player record (already covered by general select policy)
--    Admins can manage all players (already covered by existing admin policy)
--    No additional policies needed — existing admin_roles_schema.sql policies cover this.
