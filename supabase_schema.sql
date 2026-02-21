-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'user',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PLAYERS
create table players (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  position text not null check (position in ('Goalkeeper', 'Line')),
  level int not null default 3,
  attributes jsonb default '{}'::jsonb, -- { attack: 50, defense: 50, ... }
  stats jsonb default '{"goals": 0, "assists": 0, "wins": 0, "draws": 0, "losses": 0, "matches_played": 0, "yellow_cards": 0, "red_cards": 0}'::jsonb,
  role text default 'User', -- Admin or User content role
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MATCHES
create table matches (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  team_a_score int default 0,
  team_b_score int default 0,
  team_a_players jsonb default '[]'::jsonb, -- Array of player IDs
  team_b_players jsonb default '[]'::jsonb, -- Array of player IDs
  duration int default 600, -- 10 minutes in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MATCH EVENTS
create table match_events (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  player_id uuid references players(id) on delete set null,
  type text not null check (type in ('Goal', 'OwnGoal', 'YellowCard', 'RedCard')),
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  assist_id uuid references players(id) on delete set null, -- Optional assist
  team text check (team in ('A', 'B')) -- Which team scored/got carded
);

-- RLS POLICIES (Simple version for MVP)
alter table profiles enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;

-- Allow read access to everyone
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Players are viewable by everyone." on players for select using (true);
create policy "Matches are viewable by everyone." on matches for select using (true);
create policy "Events are viewable by everyone." on match_events for select using (true);

-- Allow authenticated users to insert/update (You might want to restrict this to admins later)
create policy "Users can insert players" on players for insert with check (auth.role() = 'authenticated');
create policy "Users can update players" on players for update using (auth.role() = 'authenticated');

create policy "Users can insert matches" on matches for insert with check (auth.role() = 'authenticated');
create policy "Users can update matches" on matches for update using (auth.role() = 'authenticated');

create policy "Users can insert events" on match_events for insert with check (auth.role() = 'authenticated');
