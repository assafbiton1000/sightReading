-- Forum moderation. Every post/reply starts as 'pending' and only appears on
-- the public forum once an admin approves it (or is deleted).
--
-- Public reads (RLS) see approved comments plus their own (so an author can
-- still find a post that's awaiting approval). Admin moderation reads pending
-- rows and approves/deletes them through the service-role forum-moderate
-- Edge Function — never through the client.

alter table public.forum_comments
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved'));

-- Existing comments predate moderation and were already public → approve them.
update public.forum_comments set status = 'approved' where status = 'pending';

drop policy if exists "forum_comments_select_authenticated" on public.forum_comments;
create policy "forum_comments_select_approved_or_own"
  on public.forum_comments for select
  to authenticated
  using (status = 'approved' or auth.uid() = author_id);

-- Insert stays author-only AND is forced to 'pending', so a crafted client
-- can't publish pre-approved.
drop policy if exists "forum_comments_insert_own" on public.forum_comments;
create policy "forum_comments_insert_own_pending"
  on public.forum_comments for insert
  to authenticated
  with check (auth.uid() = author_id and status = 'pending');
