-- Forum comments (Feature 2).
--
-- Replaces the device-local AsyncStorage forum (src/utils/forumStore.ts) with a
-- shared, auth-backed table. One self-referencing table models both top-level
-- questions (parent_id IS NULL) and their replies (parent_id -> the post's id).
--
-- Authorization is enforced entirely by Row Level Security, not by an app
-- server: reads are open to any signed-in user, and a user can only insert or
-- delete rows they authored (auth.uid() = author_id). This is why there is no
-- "DELETE /api/comments/:id" endpoint — the delete-own policy below IS the
-- backend authorization check, and it cannot be bypassed by a crafted client.

create table if not exists public.forum_comments (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  parent_id   uuid references public.forum_comments(id) on delete cascade,
  title       text,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

-- Reply lookups by parent, and newest-first listing of top-level posts.
create index if not exists forum_comments_parent_id_idx  on public.forum_comments(parent_id);
create index if not exists forum_comments_created_at_idx  on public.forum_comments(created_at desc);

alter table public.forum_comments enable row level security;

-- Any signed-in user can read the whole forum.
create policy "forum_comments_select_authenticated"
  on public.forum_comments for select
  to authenticated
  using (true);

-- A user may only create rows authored by themselves.
create policy "forum_comments_insert_own"
  on public.forum_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Author-only deletion. Deleting a top-level post cascades to its replies via
-- the parent_id foreign key. (No UPDATE policy: comments are immutable — there
-- is no edit feature, so updates are denied by default.)
create policy "forum_comments_delete_own"
  on public.forum_comments for delete
  to authenticated
  using (auth.uid() = author_id);
