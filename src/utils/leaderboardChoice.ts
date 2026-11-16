// Per-account, on-device choice about publishing to the public leaderboard.
// Pure (storage injected) so it is unit-tested in Node
// (scripts/tests/leaderboardChoice.test.mjs). Wiring + hook: ./leaderboardConsent.ts.
//
// - Stored per user id; a record for another account is never reused.
// - Bumping LB_DISCLOSURE_VERSION re-asks everyone (the disclosure text changed).
// - Local only: a new device / reinstall asks again. Not synced to the server.
// - "Unset" (null) publishes nothing, same as "out".

export const LB_DISCLOSURE_VERSION = 2; // v2: narrowed scope + email wording
export type LbChoice = 'in' | 'out';
export type SaveStatus = 'saving' | 'saved' | 'failed';
export type SaveResult = 'saved' | 'failed' | 'superseded';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const keyFor = (userId: string) => `@sightreading/leaderboardChoice/${userId}`;

export function createLeaderboardChoiceStore(storage: KeyValueStorage) {
  // undefined = not loaded yet, null = loaded with no valid choice
  const cache = new Map<string, LbChoice | null>();
  const loading = new Map<string, Promise<void>>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());

  function load(userId: string): Promise<void> {
    if (cache.has(userId)) return Promise.resolve();
    let p = loading.get(userId);
    if (!p) {
      p = storage.getItem(keyFor(userId))
        .then(raw => {
          let choice: LbChoice | null = null;
          try {
            const rec = raw ? JSON.parse(raw) : null;
            if (rec && rec.userId === userId && rec.version === LB_DISCLOSURE_VERSION && (rec.choice === 'in' || rec.choice === 'out')) {
              choice = rec.choice;
            }
          } catch { /* corrupt → ask again */ }
          if (!cache.has(userId)) cache.set(userId, choice); // a set() during the read wins
        })
        .catch(() => { if (!cache.has(userId)) cache.set(userId, null); })
        .finally(() => { loading.delete(userId); notify(); });
      loading.set(userId, p);
    }
    return p;
  }

  // The choice takes effect in memory immediately (an opt-out stops publishing
  // at once, even if saving fails). Writes are serialized per account and a
  // queued write that has been superseded is skipped, so the newest choice is
  // the one left on disk. If the newest write fails, status is 'failed': the
  // choice only holds for this launch, and after a restart whatever was saved
  // before (e.g. an older 'in') loads again. The UI must say so and offer retry.
  const status = new Map<string, SaveStatus>();
  const seq = new Map<string, number>();
  const chain = new Map<string, Promise<unknown>>();

  function setChoice(userId: string, choice: LbChoice): Promise<SaveResult> {
    cache.set(userId, choice);
    const mine = (seq.get(userId) ?? 0) + 1;
    seq.set(userId, mine);
    status.set(userId, 'saving');
    notify();
    const run = (chain.get(userId) ?? Promise.resolve())
      .then(async (): Promise<SaveResult> => {
        if (seq.get(userId) !== mine) return 'superseded';
        await storage.setItem(keyFor(userId), JSON.stringify({ userId, choice, version: LB_DISCLOSURE_VERSION, at: Date.now() }));
        return 'saved';
      })
      .catch((): SaveResult => 'failed')
      .then(result => {
        if (seq.get(userId) === mine && result !== 'superseded') { status.set(userId, result); notify(); }
        return seq.get(userId) === mine ? result : 'superseded';
      });
    chain.set(userId, run);
    return run;
  }

  /** One user-initiated retry of the current in-memory choice after a failed save. */
  function retrySave(userId: string): Promise<SaveResult> {
    const choice = cache.get(userId);
    if (status.get(userId) !== 'failed' || (choice !== 'in' && choice !== 'out')) return Promise.resolve('superseded');
    return setChoice(userId, choice);
  }

  return {
    load,
    setChoice,
    retrySave,
    get: (userId: string): LbChoice | null | undefined => cache.get(userId),
    /** undefined = nothing chosen in this launch (value came from disk or is unset). */
    saveStatus: (userId: string): SaveStatus | undefined => status.get(userId),
    isOptedIn: (userId: string) => cache.get(userId) === 'in',
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export type LeaderboardChoiceStore = ReturnType<typeof createLeaderboardChoiceStore>;

// Delayed server write, checked live when the timer fires (not from the closure):
// nothing runs unless isActive() — the scheduling account is still the active,
// hydrated session; the public part additionally needs mayPublish(). Returns a
// cancel function for effect cleanup. A request already sent cannot be recalled.
export function scheduleServerSync(opts: {
  delayMs: number;
  isActive: () => boolean;
  privateWrite?: () => void;
  publicWrite?: () => void;
  mayPublish: () => boolean;
}): () => void {
  const id = setTimeout(() => {
    if (!opts.isActive()) return;
    opts.privateWrite?.();
    if (opts.publicWrite && opts.mayPublish()) opts.publicWrite();
  }, opts.delayMs);
  return () => clearTimeout(id);
}
