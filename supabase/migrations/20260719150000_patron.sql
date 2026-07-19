-- Patron badge via in-app purchase (Feature: Support the app).
--
-- Adds an is_patron flag to profiles, set when a user completes a "support"
-- Google Play in-app purchase. Client-grant model (v1): the app calls the
-- `grant-patron` Edge Function after a successful store purchase, and that
-- function (service role) flips this flag. The badge is cosmetic, so we do not
-- verify the purchase token server-side yet — see supabase/functions/grant-patron.
--
-- No client UPDATE policy is added to profiles on purpose: opening UPDATE would
-- also let a user set their own is_admin/rank. All writes stay service-role only.

alter table public.profiles
  add column if not exists is_patron boolean not null default false;
