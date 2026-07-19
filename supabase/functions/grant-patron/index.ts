// Grant Patron badge (Feature: Support the app) — client-grant model (v1).
//
// After a user completes a "support" in-app purchase, the app calls this
// function; it verifies the caller's JWT and flips profiles.is_patron for THAT
// user only. It runs with the service-role key because profiles has no client
// UPDATE policy by design (opening one would let a user set their own
// is_admin/rank). The purchase is trusted from the client here: the Patron
// badge is purely cosmetic, so there is no material benefit to spoofing it. A
// future v2 can verify the Google Play purchase token before granting.
//
// Deploy:  npx supabase functions deploy grant-patron
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'invalid_token' }, 401);

    // Flip only the caller's own row. upsert keeps it idempotent — buying a
    // second time (another tip) just re-affirms is_patron without erroring.
    const { error } = await admin
      .from('profiles')
      .upsert(
        { id: userData.user.id, is_patron: true, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
    if (error) return json({ error: 'grant_failed', detail: error.message }, 500);

    return json({ ok: true, isPatron: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
