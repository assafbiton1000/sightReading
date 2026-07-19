// Sync a player's earned rank (Feature 3). The client reports the rank it earned
// from local sight-reading practice; this stores the HIGHER of that and the
// current stored rank — so auto-progression only ever raises a rank and never
// lowers an admin-set higher one. Runs with the service-role key (profiles is
// not client-writable) and mirrors the effective rank onto the public
// leaderboard_scores projection so everyone can see it.
//
// This is client-trusted (v1): the earned rank is derived from device-local
// practice history, which can't be re-verified server-side, and a rank is a
// cosmetic status. Keep RANKS in sync with src/constants/ranks.ts.
//
// Deploy:  npx supabase functions deploy sync-rank

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RANKS = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  return (
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (user.email ? user.email.split('@')[0] : '') ||
    'User'
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!jwt) return json({ error: 'missing_token' }, 401);

    const body = await req.json().catch(() => ({}));
    const earnedIdx = Math.max(0, Math.min(RANKS.length - 1, Number(body.rankIndex) || 0));

    const admin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'invalid_token' }, 401);
    const uid = userData.user.id;

    // Effective rank = the higher of the earned rank and whatever is stored
    // (which may be an admin-set floor).
    const { data: prof } = await admin.from('profiles').select('rank').eq('id', uid).maybeSingle();
    const storedIdx = Math.max(0, RANKS.indexOf(typeof prof?.rank === 'string' ? prof.rank : 'beginner'));
    const nextRank = RANKS[Math.max(earnedIdx, storedIdx)];

    const now = new Date().toISOString();
    await admin.from('profiles').upsert({ id: uid, rank: nextRank, updated_at: now }, { onConflict: 'id' });
    // Mirror onto the public leaderboard row (partial upsert keeps points intact).
    await admin.from('leaderboard_scores').upsert(
      { user_id: uid, display_name: displayName(userData.user), rank: nextRank, updated_at: now },
      { onConflict: 'user_id' },
    );

    return json({ ok: true, rank: nextRank });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
