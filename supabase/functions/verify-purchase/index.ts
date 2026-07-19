// Verify a Google Play "support" purchase, then grant the Music Patron badge.
//
// Replaces the client-grant grant-patron function: instead of trusting the
// client, this asks the Google Play Developer API whether the purchase token is
// real and in the "purchased" state before flipping profiles.is_patron. Runs
// with the service-role key (profiles has no client-writable policy).
//
// Required secrets (set once):
//   npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_B64="$(base64 -w0 google-service-account.json)"
// The service account (freepace-piano@sightreading-502217…) must have Play
// Console permission to *view financial data / orders*, and the "Google Play
// Android Developer API" must be enabled in its GCP project.
//
// Deploy:  npx supabase functions deploy verify-purchase
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANDROID_PACKAGE = 'com.freepacepiano.app';

// Only these products grant Patron — never trust an arbitrary productId from the
// client. Keep in sync with src/utils/iap.ts SUPPORT_PRODUCT_IDS.
const ALLOWED_PRODUCTS = new Set([
  'support_tier_1',
  'support_tier_2',
  'support_tier_3',
  'support_tier_4',
  'support_tier_5',
]);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

// --- base64url helpers for the OAuth JWT ---
function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

// Mints a short-lived Google OAuth access token for the androidpublisher scope
// via the service account's signed JWT (RS256), per Google's server-to-server
// OAuth flow.
async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`token: ${res.status} ${JSON.stringify(data)}`);
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!jwt) return json({ error: 'missing_token' }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId ?? '');
    const purchaseToken = String(body.purchaseToken ?? '');
    if (!ALLOWED_PRODUCTS.has(productId)) return json({ error: 'unknown_product' }, 400);
    if (!purchaseToken) return json({ error: 'missing_purchase_token' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'invalid_token' }, 401);

    const b64 = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_B64');
    if (!b64) return json({ error: 'server_not_configured' }, 500);
    const sa = JSON.parse(atob(b64));

    // Ask Google whether this purchase token is real and paid for.
    const accessToken = await getAccessToken(sa);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE}` +
      `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const vr = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const purchase = await vr.json();
    if (!vr.ok) return json({ error: 'verify_failed', detail: purchase }, 402);
    // purchaseState: 0 = purchased, 1 = canceled, 2 = pending.
    if (purchase.purchaseState !== 0) return json({ error: 'not_purchased', state: purchase.purchaseState }, 402);

    const now = new Date().toISOString();
    const { error } = await admin
      .from('profiles')
      .upsert({ id: userData.user.id, is_patron: true, updated_at: now }, { onConflict: 'id' });
    if (error) return json({ error: 'grant_failed', detail: error.message }, 500);

    // Mirror the badge onto the public leaderboard row. An admin outranks a
    // patron, so keep 'developer' if the account is also an admin.
    const { data: prof } = await admin
      .from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
    const badge = prof?.is_admin ? 'developer' : 'patron';
    const u = userData.user;
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (typeof meta.name === 'string' && meta.name) ||
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (u.email ? u.email.split('@')[0] : '') ||
      'User';
    await admin.from('leaderboard_scores').upsert(
      { user_id: u.id, display_name: name, badge, updated_at: now },
      { onConflict: 'user_id' },
    );

    return json({ ok: true, isPatron: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
