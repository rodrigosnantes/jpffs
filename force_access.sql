-- FORCE ACCESS SCRIPT (Run this to fix 401/42501 errors)

-- 1. Disable RLS on all tables (Ensures no policies are checked)
alter table public.matches disable row level security;
alter table public.players disable row level security;
alter table public.match_events disable row level security;
alter table public.profiles disable row level security;

-- 2. Grant permissions to 'anon' (public users)
grant all on table public.matches to anon;
grant all on table public.players to anon;
grant all on table public.match_events to anon;
grant all on table public.profiles to anon;

-- 3. Grant permissions to 'authenticated' (logged in users)
grant all on table public.matches to authenticated;
grant all on table public.players to authenticated;
grant all on table public.match_events to authenticated;
grant all on table public.profiles to authenticated;

-- 4. Grant usage on sequences (just in case)
grant usage, select on all sequences in schema public to anon;
grant usage, select on all sequences in schema public to authenticated;
