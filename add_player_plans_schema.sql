-- ─── Planos de Sócios ──────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Create the plan enum type (optional but good practice, though we'll use text with check constraint for simplicity)
-- 2. Add the plan column to the players table
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Amateur' NOT NULL;

-- 3. Add CHECK constraint to ensure only valid plans are used
ALTER TABLE players
    DROP CONSTRAINT IF EXISTS players_plan_check;
    
ALTER TABLE players
    ADD CONSTRAINT players_plan_check CHECK (plan IN ('Legendary', 'Pro', 'Amateur'));

-- 4. Create an index for faster filtering by plan (optional but useful if we filter lists by plan)
CREATE INDEX IF NOT EXISTS players_plan_idx ON players(plan);
