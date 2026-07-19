-- Show each player's rank + badge on the public leaderboard.
--
-- leaderboard_scores is the only cross-user-readable projection (profiles is
-- read-your-own-row only), so the rank and badge that everyone should see live
-- here as denormalised columns. Writers:
--   • points / display_name — client write-through (HistoryContext)
--   • rank                  — sync-rank Edge Function (earned) + admin-users
--   • badge                 — verify-purchase (patron) + admin-users
-- All use partial upserts (on conflict user_id, only their columns), so no
-- writer clobbers another's column.

alter table public.leaderboard_scores
  add column if not exists rank text not null default 'beginner';

alter table public.leaderboard_scores
  add column if not exists badge text not null default 'general';
