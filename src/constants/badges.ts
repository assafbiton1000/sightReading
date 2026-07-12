// User-type badges shown in the profile system. Badge names are product/brand
// names and deliberately stay in English across all UI languages; only the
// descriptions are translated (see badge* keys in i18n.ts).

export type UserBadge = 'developer' | 'patron' | 'general';

// With no server, membership is derived from the sign-in email. Add donor
// emails to PATRON_EMAILS as they come in; a future backend replaces this
// lookup with real account roles.
export const DEVELOPER_EMAILS = ['assafbiton@gmail.com'];
export const PATRON_EMAILS: string[] = [];

export function badgeForEmail(email: string): UserBadge {
  const normalized = email.trim().toLowerCase();
  if (DEVELOPER_EMAILS.includes(normalized)) return 'developer';
  if (PATRON_EMAILS.includes(normalized)) return 'patron';
  return 'general';
}

export interface BadgeMeta {
  name: string;
  icon: 'code' | 'award' | 'heart';
  color: string;
  bg: string;
}

export const BADGE_META: Record<UserBadge, BadgeMeta> = {
  developer: { name: 'Code Composer', icon: 'code',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  patron:    { name: 'Music Patron',  icon: 'award', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  general:   { name: 'Music Lover',   icon: 'heart', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
};

export const ALL_BADGES: UserBadge[] = ['developer', 'patron', 'general'];
