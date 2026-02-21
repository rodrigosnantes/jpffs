-- 1. Add profile_id to players table
alter table public.players 
add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- 2. Create Trigger Function to handle New User Sign Up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  -- Insert into profiles
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', 'user')
  returning id into new_profile_id;

  -- Insert into players (Auto-create player for the user)
  -- Default position 'Line' and level 3 (Average)
  insert into public.players (profile_id, name, position, level)
  values (
    new_profile_id, 
    coalesce(new.raw_user_meta_data ->> 'name', 'Sem Nome'), 
    coalesce(new.raw_user_meta_data ->> 'position', 'Line'), -- Get position from metadata or default
    3
  );

  return new;
end;
$$;

-- 3. Create Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Fix permissions again (just in case they were reset)
grant all on table public.players to anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;
