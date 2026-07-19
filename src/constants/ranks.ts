// Player ranks (Feature 3). Ranks are EARNED automatically by completing
// sight-reading exercises (see earnedRankIndex below) and can also be set by an
// admin via the admin-users Edge Function. The effective rank is the higher of
// the two — auto-progression only ever raises a rank, never lowers it, and an
// admin can set a higher floor that auto-progression won't undo.

export const RANKS = ['beginner', 'intermediate', 'advanced', 'expert', 'master'] as const;
export type Rank = typeof RANKS[number];

// English labels for the internal admin panel (not translated). User-facing
// screens use the translated rankLabel() helper (see i18n rank* keys) instead.
export const RANK_LABEL: Record<Rank, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  master: 'Master',
};

export function rankIndex(r: string | null | undefined): number {
  const i = RANKS.indexOf((r ?? 'beginner') as Rank);
  return i < 0 ? 0 : i;
}

export function rankFromIndex(i: number): Rank {
  return RANKS[Math.max(0, Math.min(RANKS.length - 1, i))];
}

// A sight-reading session counts toward rank progression only at this accuracy.
export const RANK_MIN_ACCURACY = 0.9;

// Maps a user's qualifying (≥90%) sight-reading history to an earned rank index.
// - Intermediate: at least 2 qualifying completions (levels 1–2).
// - Advanced/Expert/Master: a qualifying completion at level ≥3 / ≥5 / ≥7.
// Higher levels imply the lower ones, so the check is a simple descending ladder.
export function earnedRankIndex(input: { qualifyingCount: number; maxQualifyingLevel: number }): number {
  const { qualifyingCount, maxQualifyingLevel } = input;
  if (maxQualifyingLevel >= 7) return 4; // master
  if (maxQualifyingLevel >= 5) return 3; // expert
  if (maxQualifyingLevel >= 3) return 2; // advanced
  if (qualifyingCount >= 2) return 1;    // intermediate
  return 0;                              // beginner
}
