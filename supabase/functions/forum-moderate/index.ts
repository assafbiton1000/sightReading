// Forum moderation API (admin only). The public client can only read approved
// comments (RLS); moderating pending ones requires the service-role key, so it
// happens here behind an is_admin guard — mirroring the admin-users function.
//
// Actions (POST body):
//   { action: 'list_pending' }        → every comment with status = 'pending'
//   { action: 'approve', id }         → set that comment's status to 'approved'
//   { action: 'delete',  id }         → delete it permanently (cascades to replies)
//
// Deploy:  npx supabase functions deploy forum-moderate

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

async function listPending(admin: SupabaseClient) {
  const { data } = await admin
    .from('forum_comments')
    .select('id, author_id, author_name, parent_id, title, body, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    parentId: r.parent_id,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  }));
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

    // --- isAdmin guard ---
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'invalid_token' }, 401);
    const { data: caller } = await admin
      .from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
    if (!caller?.is_admin) return json({ error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'list_pending';

    if (action === 'list_pending') {
      return json({ pending: await listPending(admin) });
    }

    if (action === 'approve') {
      if (!body.id) return json({ error: 'id_required' }, 400);
      await admin.from('forum_comments').update({ status: 'approved' }).eq('id', body.id);
      return json({ ok: true, pending: await listPending(admin) });
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'id_required' }, 400);
      await admin.from('forum_comments').delete().eq('id', body.id);
      return json({ ok: true, pending: await listPending(admin) });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
