-- Feature 3: user profiles with an admin role + an assignable rank.
--
-- Points stay where they already live (user_stats / leaderboard_scores); this
-- table only adds two things: an is_admin flag for role-based access control,
-- and a manually-assignable rank. Admin reads/writes of OTHER users go through
-- the `admin-users` Edge Function using the service-role key — never the client.
-- The only client-facing policy here is "read your own row", so a user can see
-- their own admin flag/rank but can never grant themselves admin.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  is_admin   boolean not null default false,
  rank       text not null default 'beginner',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user may read only their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);
-- (No client insert/update/delete policies on purpose: the signup trigger below
--  creates rows, and admin edits use the service role. Privilege escalation via
--  the client is therefore impossible.)

-- Auto-create a profile row for every new user (security definer bypasses RLS).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill rows for users who already existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Bootstrap the developer account as the first admin. Change/add emails here if
-- you need another admin, or flip is_admin manually in the SQL editor later.
update public.profiles p
set is_admin = true, updated_at = now()
from auth.users u
where u.id = p.id and lower(u.email) = 'assafbiton@gmail.com';
