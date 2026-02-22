-- ─── Link players to auth users ──────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Remove the role column from players (roles belong in profiles, not players)
alter table players drop column if exists role;

-- 2. Add profile_id FK to players table (nullable so existing players aren't broken)
alter table players
    add column if not exists profile_id uuid references profiles(id) on delete set null;

-- 3. Unique constraint: one user → one player
alter table players
    drop constraint if exists players_profile_id_unique;
alter table players
    add constraint players_profile_id_unique unique (profile_id);

-- 4. Create index for lookups by profile_id
create index if not exists players_profile_id_idx on players(profile_id);

-- NOTE: existing duplicate profile_ids must be resolved before running step 3.
-- To find duplicates:
--   select profile_id, count(*) from players group by profile_id having count(*) > 1;
-- To remove extras (keep the first):
--   delete from players where id not in (select min(id) from players group by profile_id);
