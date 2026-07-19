// User-type badges shown in the profile system. Badge names are product/brand
// names and deliberately stay in English across all UI languages; only the
// descriptions are translated (see badge* keys in i18n.ts).

export type UserBadge = 'developer' | 'patron' | 'general';

// Membership is resolved from the user's public.profiles row (is_admin drives
// the developer badge, is_patron the patron badge — set after a "support"
// in-app purchase). Both flags come through ProfileContext.
export function badgeForFlags(flags: { isAdmin: boolean; isPatron: boolean }): UserBadge {
  if (flags.isAdmin) return 'developer';
  if (flags.isPatron) return 'patron';
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
