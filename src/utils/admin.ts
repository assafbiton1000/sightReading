import { supabase, isSupabaseConfigured } from './supabase';

// Client wrapper for the `admin-users` Edge Function. Every call goes through
// supabase.functions.invoke, which automatically attaches the signed-in user's
// access token — that token is how the function identifies the caller and
// enforces the admin-only guard server-side. Nothing here is trusted for
// authorization; the function re-checks profiles.is_admin on every request.

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  points: number;
  rank: string;
  isAdmin: boolean;
  comments: number;
  joinedAt: string;
}

const FUNCTION = 'admin-users';

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action: 'list' } });
  if (error) throw error;
  return (data?.users ?? []) as AdminUser[];
}

/** Updates a target user's points and/or rank; returns the refreshed full list. */
export async function updateAdminUser(input: { userId: string; points?: number; rank?: string }): Promise<AdminUser[]> {
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action: 'update', ...input } });
  if (error) throw error;
  return (data?.users ?? []) as AdminUser[];
}
