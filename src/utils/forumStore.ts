import { supabase, isSupabaseConfigured } from './supabase';

// Shared, auth-backed community forum. Backed by a single self-referencing
// Supabase table (public.forum_comments): top-level posts have parent_id = null,
// replies point at their post. Authorization lives in RLS — any signed-in user
// can read, but a row can only be created or deleted by its author
// (auth.uid() = author_id). See supabase/migrations for the schema/policies.
//
// Moderation: new comments are saved as status 'pending' and only appear on the
// public forum once an admin approves them (status 'approved') — see the
// forum-moderate Edge Function / ForumModerationScreen. loadPosts therefore
// fetches only approved rows.
//
// Every function no-ops gracefully when Supabase isn't configured yet (or the
// table hasn't been created): reads return [], writes just refetch. The UI then
// shows an empty forum instead of crashing.

export interface ForumReply {
  id: string;
  authorId: string;
  author: string;
  body: string;
  createdAt: number;
}

export interface ForumPost {
  id: string;
  authorId: string;
  author: string;
  title: string;
  body: string;
  createdAt: number;
  replies: ForumReply[];
}

interface CommentRow {
  id: string;
  author_id: string;
  author_name: string;
  parent_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
}

const TABLE = 'forum_comments';
const SELECT = 'id, author_id, author_name, parent_id, title, body, created_at';

function toReply(r: CommentRow): ForumReply {
  return { id: r.id, authorId: r.author_id, author: r.author_name, body: r.body, createdAt: Date.parse(r.created_at) };
}

/** All posts, newest first, each with its replies (oldest first). */
export async function loadPosts(): Promise<ForumPost[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  const rows = data as CommentRow[];

  // Bucket replies under their parent in a single pass (rows are already
  // oldest-first, so each bucket ends up chronological).
  const repliesByParent = new Map<string, ForumReply[]>();
  for (const r of rows) {
    if (!r.parent_id) continue;
    const list = repliesByParent.get(r.parent_id);
    if (list) list.push(toReply(r));
    else repliesByParent.set(r.parent_id, [toReply(r)]);
  }

  const posts: ForumPost[] = [];
  for (const r of rows) {
    if (r.parent_id) continue;
    posts.push({
      id: r.id,
      authorId: r.author_id,
      author: r.author_name,
      title: r.title ?? '',
      body: r.body,
      createdAt: Date.parse(r.created_at),
      replies: repliesByParent.get(r.id) ?? [],
    });
  }
  posts.sort((a, b) => b.createdAt - a.createdAt); // newest post first
  return posts;
}

export async function addPost(input: { authorId: string; authorName: string; title: string; body: string }): Promise<ForumPost[]> {
  if (isSupabaseConfigured) {
    await supabase.from(TABLE).insert({
      author_id: input.authorId,
      author_name: input.authorName,
      parent_id: null,
      title: input.title,
      body: input.body,
    });
  }
  return loadPosts();
}

export async function addReply(postId: string, input: { authorId: string; authorName: string; body: string }): Promise<ForumPost[]> {
  if (isSupabaseConfigured) {
    await supabase.from(TABLE).insert({
      author_id: input.authorId,
      author_name: input.authorName,
      parent_id: postId,
      body: input.body,
    });
  }
  return loadPosts();
}

/** Deletes a post or reply. RLS only permits it when auth.uid() = author_id;
 *  deleting a post cascades to its replies via the parent_id foreign key. */
export async function deleteComment(id: string): Promise<ForumPost[]> {
  if (isSupabaseConfigured) {
    await supabase.from(TABLE).delete().eq('id', id);
  }
  return loadPosts();
}
