# Supabase — local migrations

This folder holds SQL migrations for the SightReading backend so schema changes
live in the repo instead of being pasted by hand into the dashboard. The tables
these create are also documented (with the raw SQL) in `docs/LAUNCH_CHECKLIST.md`.

## One-time setup

`config.toml` is already committed, so **do not run `supabase init`** (it errors
on an existing `supabase/` folder). Just authorize the CLI and link the project:

```bash
npx supabase login                                   # opens the browser once
npx supabase link --project-ref yscdnxoeeijjxktkbahk # prompts for the DB password
```

The project ref (`yscdnxoeeijjxktkbahk`) is the subdomain of your project URL
(`https://<ref>.supabase.co`). `link` asks for the **database password** you set
when the project was created (Project Settings → Database can reset it).

## Applying migrations

```bash
npx supabase db push       # runs every un-applied file in migrations/ against the linked project
```

To preview what would run without applying it:

```bash
npx supabase db push --dry-run
```

## Migrations

| File | What it creates |
|------|-----------------|
| `20260719120000_forum_comments.sql` | `public.forum_comments` — the shared community forum (Feature 2). Author-only delete is enforced by RLS, not an app endpoint. |
| `20260719130000_profiles_admin.sql` | `public.profiles` — per-user `is_admin` role + assignable `rank` (Feature 3). Auto-creates a row per user via a signup trigger and bootstraps the developer account as admin. |

> Until a migration is applied, the related app features no-op silently (a
> missing table is treated as "nothing there") — nothing crashes.

## Edge Functions

The admin dashboard (Feature 3) is served by an Edge Function that runs with the
service-role key and enforces the admin check itself. Deploy it after linking:

```bash
npx supabase functions deploy admin-users
```

| Function | Purpose |
|----------|---------|
| `admin-users` | `list` all users (email, points, rank, comment counts) and `update` a user's points/rank. Rejects any caller whose `profiles.is_admin` is not true. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — no secrets to set. |

> Docker is **not** required to deploy functions to the cloud (it's only needed
> for `supabase functions serve` locally).
