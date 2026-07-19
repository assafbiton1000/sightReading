import { supabase, isSupabaseConfigured } from './supabase';

// Client wrapper for the admin-only `forum-moderate` Edge Function. Like admin.ts,
// nothing here is trusted for authorization — the function re-checks
// profiles.is_admin on every request; this is purely the moderator UI's data layer.

export interface PendingComment {
  id: string;
  authorId: string;
  authorName: string;
  parentId: string | null; // null = top-level post, otherwise a reply to that post id
  title: string | null;
  body: string;
  createdAt: string;
}

const FUNCTION = 'forum-moderate';

export async function fetchPendingComments(): Promise<PendingComment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action: 'list_pending' } });
  if (error) throw error;
  return (data?.pending ?? []) as PendingComment[];
}

/** Approves a comment (status → 'approved'); returns the refreshed pending list. */
export async function approveComment(id: string): Promise<PendingComment[]> {
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action: 'approve', id } });
  if (error) throw error;
  return (data?.pending ?? []) as PendingComment[];
}

/** Permanently deletes a comment; returns the refreshed pending list. */
export async function deletePendingComment(id: string): Promise<PendingComment[]> {
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action: 'delete', id } });
  if (error) throw error;
  return (data?.pending ?? []) as PendingComment[];
}
