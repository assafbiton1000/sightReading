-- Security fix: clients could self-assign rank/badge on the public leaderboard.
--
-- The row-level "update only your own score" policy covered the whole row, so
-- after rank + badge were added (20260719160000) any signed-in user could
-- PATCH their own row to badge='developer' / rank='master' with the anon key.
-- Column-level privileges close it: the client may only write the columns
-- pushLeaderboardScore() sends. rank/badge stay writable by the service-role
-- Edge Functions only (service_role keeps its own grants; RLS still applies).
-- user_id is in the UPDATE grant because PostgREST upserts SET every payload
-- column, including the conflict key; the RLS with-check pins it to auth.uid().

revoke insert, update on public.leaderboard_scores from anon, authenticated;
grant insert (user_id, display_name, points, updated_at) on public.leaderboard_scores to authenticated;
grant update (user_id, display_name, points, updated_at) on public.leaderboard_scores to authenticated;

-- Security fix: one Google Play purchase token could grant Patron to many
-- accounts. verify-purchase records each token here and refuses a token
-- already claimed by a different user. No policies: service-role only.
create table if not exists public.used_purchase_tokens (
  purchase_token text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  product_id     text not null,
  created_at     timestamptz not null default now()
);

alter table public.used_purchase_tokens enable row level security;
