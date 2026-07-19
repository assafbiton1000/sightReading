// Admin-assignable ranks (Feature 3). Kept in sync with the same list in the
// admin-users Edge Function, which validates rank on write. Ranks are a manual,
// admin-only status — separate from practice levels (1-5) and profile badges.

export const RANKS = ['beginner', 'intermediate', 'advanced', 'expert', 'master'] as const;
export type Rank = typeof RANKS[number];

// English labels: the admin panel is an internal developer tool and is not
// translated across the app's UI languages.
export const RANK_LABEL: Record<Rank, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  master: 'Master',
};
