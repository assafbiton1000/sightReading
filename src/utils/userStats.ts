import { supabase, isSupabaseConfigured } from './supabase';

// Private, per-user mirror of the local practice data (points + session
// history) so it survives a reinstall / new device. Unlike leaderboard_scores
// (a public projection anyone signed-in can read), user_stats is readable only
// by its owner via RLS — see docs/LAUNCH_CHECKLIST.md §א.8 for the DDL.
const TABLE = 'user_stats';

export interface ServerStats {
  points: number;
  // Kept opaque here — HistoryContext owns the SessionRecord shape and merges it.
  records: unknown[];
}

// Pulls the signed-in user's stored stats. Returns null when Supabase isn't
// configured, the row doesn't exist yet, or the read fails — callers treat that
// as "nothing on the server", never as "wipe the local data".
export async function fetchUserStats(userId: string): Promise<ServerStats | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('points, records')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      points: typeof data.points === 'number' ? data.points : 0,
      records: Array.isArray(data.records) ? data.records : [],
    };
  } catch (_) {
    return null;
  }
}

// Upserts the signed-in user's stats. No-ops silently if Supabase isn't
// configured or the write fails — points/history always keep working locally
// regardless (HistoryContext persists to AsyncStorage too).
export async function pushUserStats(userId: string, points: number, records: unknown[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from(TABLE)
      .upsert({ user_id: userId, points, records, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch (_) {}
}
