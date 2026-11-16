// Ties the signed-in account's server flags (admin, patron, rank) to the auth
// session they were loaded for. Pure, unit-tested in Node
// (scripts/tests/accountSession.test.mjs). Used by ProfileContext.
//
// - Every change of signed-in user id (including sign-out and signing back in
//   as the same user) starts a new epoch and clears the flags.
// - A request captures a token {uid, epoch}; its response is applied only if
//   that token is still current — a late reply from a previous session (even
//   for the same uid) is dropped.
// - Readers get flags only for the user they ask about and only once loaded
//   for the current session; otherwise null (loading), never another account's.

export interface AccountFlags {
  isAdmin: boolean;
  isPatron: boolean;
  rank: string | null;
}
export interface SessionToken { uid: string; epoch: number }
export interface SessionSnapshot { uid: string | null; epoch: number; flags: AccountFlags | null }

const EMPTY: AccountFlags = { isAdmin: false, isPatron: false, rank: null };

export function createAccountSession() {
  let snap: SessionSnapshot = { uid: null, epoch: 0, flags: null };
  const listeners = new Set<() => void>();
  const set = (next: SessionSnapshot) => { snap = next; listeners.forEach(l => l()); };

  return {
    /** Call when the signed-in user id changes (null = signed out). */
    setUser(uid: string | null) {
      if (uid === snap.uid) return;
      set({ uid, epoch: snap.epoch + 1, flags: null });
    },
    /** Token for a request made now; null when signed out. */
    token(): SessionToken | null {
      return snap.uid ? { uid: snap.uid, epoch: snap.epoch } : null;
    },
    isCurrent(t: SessionToken | null): boolean {
      return !!t && t.uid === snap.uid && t.epoch === snap.epoch;
    },
    /** Apply a server result for the session it was requested in. Returns false if stale. */
    apply(t: SessionToken | null, patch: Partial<AccountFlags>): boolean {
      if (!t || t.uid !== snap.uid || t.epoch !== snap.epoch) return false;
      set({ ...snap, flags: { ...(snap.flags ?? EMPTY), ...patch } });
      return true;
    },
    getSnapshot: () => snap,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

/** Flags of `uid` from a snapshot, or null while not loaded / belonging to another account. */
export function flagsFor(s: SessionSnapshot, uid: string | null): AccountFlags | null {
  return uid && s.uid === uid ? s.flags : null;
}
