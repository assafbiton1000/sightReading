-- Points backend: leaderboard_scores (public projection) + user_stats (private
-- per-user mirror of points/history). These two tables were previously created
-- by hand in the SQL editor (see docs/LAUNCH_CHECKLIST.md §א.7 / §א.8); this
-- migration captures them as reproducible schema so a fresh project — or the
-- admin-users Edge Function, which upserts both — can rely on them existing.
--
-- Written to be safe to run whether or not the tables already exist:
-- `create table if not exists` is a no-op on an existing table, and every
-- policy is dropped-if-exists before being (re)created, so re-applying can
-- never error on a duplicate-policy.

-- === leaderboard_scores: public, readable by any signed-in user ===========
create table if not exists public.leaderboard_scores (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  points       numeric not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.leaderboard_scores enable row level security;

drop policy if exists "Anyone signed in can read the leaderboard" on public.leaderboard_scores;
create policy "Anyone signed in can read the leaderboard"
  on public.leaderboard_scores for select
  to authenticated
  using (true);

drop policy if exists "Users can insert only their own score" on public.leaderboard_scores;
create policy "Users can insert only their own score"
  on public.leaderboard_scores for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update only their own score" on public.leaderboard_scores;
create policy "Users can update only their own score"
  on public.leaderboard_scores for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- === user_stats: private per-user mirror, owner-only via RLS ===============
create table if not exists public.user_stats (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  points     numeric not null default 0,
  records    jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists "Users can read only their own stats" on public.user_stats;
create policy "Users can read only their own stats"
  on public.user_stats for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert only their own stats" on public.user_stats;
create policy "Users can insert only their own stats"
  on public.user_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update only their own stats" on public.user_stats;
create policy "Users can update only their own stats"
  on public.user_stats for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
