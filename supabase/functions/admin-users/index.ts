// Admin API (Feature 3) — the only path by which an admin reads every user and
// edits another user's points/rank. Runs with the service-role key (bypasses
// RLS), so it MUST authorize every request itself: it verifies the caller's JWT
// and confirms profiles.is_admin server-side before doing anything. This is the
// `isAdmin` middleware from the spec, implemented as an in-function guard.
//
// Actions (POST body): { action: 'list' } and
//                      { action: 'update', userId, points?, rank? }.
//
// Deploy:  npx supabase functions deploy admin-users
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!jwt) return json({ error: 'missing_token' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // --- isAdmin guard: verify the token, then require an admin profile. ---
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'invalid_token' }, 401);
    const { data: caller } = await admin
      .from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
    if (!caller?.is_admin) return json({ error: 'forbidden' }, 403);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action ?? 'list';

    if (action === 'list') {
      return json({ users: await listUsers(admin) });
    }

    if (action === 'update') {
      const { userId, points, rank } = body;
      if (!userId) return json({ error: 'userId_required' }, 400);
      if (rank !== undefined && !RANKS.includes(rank)) return json({ error: 'invalid_rank' }, 400);
      await updateUser(admin, userId, { points, rank });
      return json({ ok: true, users: await listUsers(admin) });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

interface AdminUserRow {
  id: string; email: string; name: string;
  points: number; rank: string; isAdmin: boolean;
  comments: number; joinedAt: string;
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

async function listUsers(admin: SupabaseClient): Promise<AdminUserRow[]> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = list?.users ?? [];

  const [{ data: stats }, { data: profiles }, { data: comments }] = await Promise.all([
    admin.from('user_stats').select('user_id, points'),
    admin.from('profiles').select('id, rank, is_admin'),
    admin.from('forum_comments').select('author_id'),
  ]);

  const pointsById = new Map<string, number>((stats ?? []).map((r) => [r.user_id, Number(r.points) || 0]));
  const profById = new Map<string, { rank: string; is_admin: boolean }>((profiles ?? []).map((r) => [r.id, r]));
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) commentCount.set(c.author_id, (commentCount.get(c.author_id) ?? 0) + 1);

  return users
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name: displayName(u),
      points: pointsById.get(u.id) ?? 0,
      rank: profById.get(u.id)?.rank ?? 'beginner',
      isAdmin: !!profById.get(u.id)?.is_admin,
      comments: commentCount.get(u.id) ?? 0,
      joinedAt: u.created_at,
    }))
    .sort((a, b) => b.points - a.points);
}

async function updateUser(
  admin: SupabaseClient,
  userId: string,
  patch: { points?: number; rank?: string },
): Promise<void> {
  const now = new Date().toISOString();

  if (patch.points !== undefined && patch.points !== null) {
    const points = Math.max(0, Math.round(Number(patch.points)));
    // leaderboard_scores needs a display name; reuse the account's.
    const { data: got } = await admin.auth.admin.getUserById(userId);
    const name = got?.user ? displayName(got.user) : 'User';
    // user_stats upsert only touches points/updated_at → the user's `records`
    // jsonb is preserved on update (and defaults to '[]' on a fresh insert).
    await admin.from('user_stats').upsert({ user_id: userId, points, updated_at: now }, { onConflict: 'user_id' });
    await admin.from('leaderboard_scores').upsert(
      { user_id: userId, display_name: name, points, updated_at: now },
      { onConflict: 'user_id' },
    );
  }

  if (patch.rank !== undefined) {
    await admin.from('profiles').upsert({ id: userId, rank: patch.rank, updated_at: now }, { onConflict: 'id' });
  }
}
