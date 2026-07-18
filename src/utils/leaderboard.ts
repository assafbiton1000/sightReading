import { supabase, isSupabaseConfigured } from './supabase';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
}

const TABLE = 'leaderboard_scores';

// Upserts the signed-in user's running point total. No-ops silently if
// Supabase isn't configured yet or the write fails (e.g. table not created
// yet) — points always keep working locally regardless (HistoryContext).
export async function pushLeaderboardScore(userId: string, displayName: string, points: number): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from(TABLE)
      .upsert({ user_id: userId, display_name: displayName, points, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch (_) {}
}

// Top 100 — every signed-in user is ranked by points (HistoryContext mirrors
// each user's total to the board automatically).
export async function fetchLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, display_name, points')
    .order('points', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(row => ({ userId: row.user_id, displayName: row.display_name, points: row.points }));
}
