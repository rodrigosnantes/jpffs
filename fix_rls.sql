-- DROP EXISTING POLICIES (to avoid conflicts)
drop policy if exists "Users can insert players" on players;
drop policy if exists "Users can update players" on players;
drop policy if exists "Users can insert matches" on matches;
drop policy if exists "Users can update matches" on matches;
drop policy if exists "Users can insert events" on match_events;

-- CREATE PERMISSIVE POLICIES (Allow Anon/Public Access for Dev)
create policy "Enable insert for all users" on players for insert with check (true);
create policy "Enable update for all users" on players for update using (true);
create policy "Enable delete for all users" on players for delete using (true);

create policy "Enable insert for all users" on matches for insert with check (true);
create policy "Enable update for all users" on matches for update using (true);

create policy "Enable insert for all users" on match_events for insert with check (true);
create policy "Enable update for all users" on match_events for update using (true);
