// Per-account rank bookkeeping. Pure (storage / network injected) so it is
// unit-tested in Node (scripts/tests/accountRank.test.mjs). Wired in HistoryContext.
//
// 1. Rank floor: the highest rank index this account has reached from practice
//    on this device, persisted per user id, so the 90-day history window can
//    never lower a rank already earned and the private Profile view keeps
//    progressing for users who don't publish to the leaderboard. Never copied
//    between accounts. Local only: profiles.rank on the server is not updated
//    for opted-out users (sync-rank also writes the public board).
// 2. Rank syncer: sends a higher rank to the server (sync-rank) for opted-in
//    users. Marks a rank synced only after the server confirmed it, for the
//    same account session; one request at a time; failures stay retryable on
//    the next change (no retry loop).

import type { KeyValueStorage } from './leaderboardChoice';

const floorKey = (userId: string) => `@sightreading/rankFloor/${userId}`;

export function effectiveRankIndex(parts: { serverIndex: number | null; earnedIndex: number; floorIndex: number }): number {
  return Math.max(parts.serverIndex ?? 0, parts.earnedIndex, parts.floorIndex);
}

export function createRankFloorStore(storage: KeyValueStorage) {
  const cache = new Map<string, number>();   // absent = not loaded yet
  const loading = new Map<string, Promise<void>>();
  const chain = new Map<string, Promise<void>>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());

  function load(userId: string): Promise<void> {
    if (cache.has(userId)) return Promise.resolve();
    let p = loading.get(userId);
    if (!p) {
      p = storage.getItem(floorKey(userId))
        .then(raw => {
          let n = -1;
          try {
            const rec = raw ? JSON.parse(raw) : null;
            if (rec && rec.userId === userId && Number.isInteger(rec.index) && rec.index >= 0) n = rec.index;
          } catch { /* corrupt → no floor */ }
          cache.set(userId, Math.max(cache.get(userId) ?? -1, n));
        })
        .catch(() => { if (!cache.has(userId)) cache.set(userId, -1); })
        .finally(() => { loading.delete(userId); notify(); });
      loading.set(userId, p);
    }
    return p;
  }

  // Only ever raises; writes are serialized per account. Never throws.
  function raise(userId: string, index: number): Promise<void> {
    if (!cache.has(userId) || index <= (cache.get(userId) as number)) return Promise.resolve();
    cache.set(userId, index);
    notify();
    const next = (chain.get(userId) ?? Promise.resolve())
      .then(() => {
        const latest = cache.get(userId) as number;        // write the newest value, not this call's
        return storage.setItem(floorKey(userId), JSON.stringify({ userId, index: latest }));
      })
      .catch(() => { /* kept in memory; raised again from history on the next change */ });
    chain.set(userId, next);
    return next;
  }

  return {
    load,
    raise,
    /** undefined until loaded; -1 = no floor yet */
    get: (userId: string) => cache.get(userId),
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export function createRankSyncer(deps: {
  /** Calls sync-rank; resolves true only if the server confirmed the rank. */
  send: (rankIndex: number) => Promise<boolean>;
  /** Is this still the active, hydrated account session? Checked when firing and on response. */
  isActive: (userId: string, epoch: number) => boolean;
  /** Live leaderboard opt-in check (sync-rank also writes the public board). */
  mayPublish: (userId: string) => boolean;
}) {
  // One slot per account *session* (userId + epoch): a request still in flight
  // from an older session of the same user can neither block nor update it.
  type Slot = { userId: string; epoch: number; synced: number; inflight: boolean; wanted: number };
  let slot: Slot | null = null;

  async function fire(s: Slot): Promise<void> {
    if (slot !== s || s.inflight || s.wanted <= s.synced) return;
    // live checks right before every send (incl. the follow-up send below)
    if (!deps.isActive(s.userId, s.epoch) || !deps.mayPublish(s.userId)) return;
    const rank = s.wanted;
    s.inflight = true;
    let ok = false;
    try { ok = await deps.send(rank); } catch { ok = false; }
    s.inflight = false;
    if (!ok || slot !== s || !deps.isActive(s.userId, s.epoch)) return; // failure stays retryable
    s.synced = Math.max(s.synced, rank);
    if (s.wanted > s.synced) await fire(s);  // a higher rank arrived meanwhile (bounded by rank count)
  }

  /** Schedule a sync of `rankIndex` for this account session. Returns a cancel function. */
  function schedule(opts: { userId: string; epoch: number; rankIndex: number; delayMs: number }): () => void {
    if (!slot || slot.userId !== opts.userId || slot.epoch !== opts.epoch) {
      slot = { userId: opts.userId, epoch: opts.epoch, synced: -1, inflight: false, wanted: -1 };
    }
    const s = slot;
    s.wanted = Math.max(s.wanted, opts.rankIndex);
    if (s.wanted <= s.synced || s.inflight) return () => {};
    const id = setTimeout(() => { void fire(s); }, opts.delayMs);
    return () => clearTimeout(id);
  }

  return {
    schedule,
    syncedFor: (userId: string, epoch?: number) =>
      (slot && slot.userId === userId && (epoch === undefined || slot.epoch === epoch) ? slot.synced : -1),
  };
}

export type RankSyncer = ReturnType<typeof createRankSyncer>;

// What HistoryContext calls on every relevant change. It (re)schedules a sync
// when the account session, opt-in, rank, or the user's practice activity
// changes — so a failed sync is retried once on the next practice/ad event,
// never by polling or on plain re-renders (same inputs → no-op). Owns its
// pending timer; dispose() on unmount.
export function createRankSyncDriver(syncer: RankSyncer, delayMs: number) {
  let lastKey = '';
  let cancel: (() => void) | null = null;
  const stop = () => { cancel?.(); cancel = null; };

  return {
    update(input: { userId: string | null; epoch: number; optedIn: boolean; rankIndex: number | null; activity: number }): void {
      if (!input.userId || !input.optedIn || input.rankIndex === null) { stop(); lastKey = ''; return; }
      const key = `${input.userId}|${input.epoch}|${input.rankIndex}|${input.activity}`;
      if (key === lastKey) return;
      lastKey = key;
      stop();
      cancel = syncer.schedule({ userId: input.userId, epoch: input.epoch, rankIndex: input.rankIndex, delayMs });
    },
    dispose: stop,
  };
}
