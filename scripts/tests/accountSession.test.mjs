// Unit tests for src/utils/accountSession.ts — server flags (admin/patron/rank)
// bound to the auth session they were loaded for. Pure, no React.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountSession, flagsFor } from '../../src/utils/accountSession.ts';
import { effectiveRankIndex } from '../../src/utils/accountRank.ts';

const RANKS = ['beginner', 'intermediate', 'advanced', 'expert', 'master']; // mirrors constants/ranks.ts
const idx = r => (r ? RANKS.indexOf(r) : null);
// What HistoryContext feeds into the private rank: server rank of the *current* account only.
const serverIndexFor = (s, uid) => idx(flagsFor(s.getSnapshot(), uid)?.rank ?? null);

test('REGRESSION (c): switching A (master) → B with B\'s load pending: A is neither shown nor fed to B', () => {
  const s = createAccountSession();
  s.setUser('A');
  const tA = s.token();
  assert.equal(s.apply(tA, { rank: 'master', isAdmin: true, isPatron: true }), true);
  assert.equal(flagsFor(s.getSnapshot(), 'A').rank, 'master');

  // render right after the switch, before the layout effect moved the session: still nothing of A for B
  assert.equal(flagsFor(s.getSnapshot(), 'B'), null);

  s.setUser('B');                       // B's profile row still loading
  assert.equal(flagsFor(s.getSnapshot(), 'B'), null, 'loading → null, not A\'s flags');
  assert.equal(serverIndexFor(s, 'B'), null);
  assert.equal(effectiveRankIndex({ serverIndex: serverIndexFor(s, 'B'), earnedIndex: 1, floorIndex: -1 }), 1,
    'B\'s effective rank comes from B\'s own data only');

  // A's late replies (profile row / syncRank) are dropped
  assert.equal(s.apply(tA, { rank: 'master' }), false);
  assert.equal(flagsFor(s.getSnapshot(), 'B'), null);

  const tB = s.token();
  assert.equal(s.apply(tB, { rank: 'beginner', isAdmin: false, isPatron: false }), true);
  assert.deepEqual(flagsFor(s.getSnapshot(), 'B'), { rank: 'beginner', isAdmin: false, isPatron: false });
});

test('REGRESSION (c): A signs out and back in; an old reply for A does not update the new A session', () => {
  const s = createAccountSession();
  s.setUser('A');
  const old = s.token();
  s.setUser(null);
  assert.equal(flagsFor(s.getSnapshot(), null), null);
  s.setUser('A');
  const fresh = s.token();
  assert.notEqual(fresh.epoch, old.epoch, 'same uid, new session');

  assert.equal(s.apply(old, { rank: 'expert' }), false, 'stale profile-row / syncRank reply dropped');
  assert.equal(flagsFor(s.getSnapshot(), 'A'), null, 'new session still loading, not the stale value');
  assert.equal(s.isCurrent(old), false);
  assert.equal(s.isCurrent(fresh), true);

  assert.equal(s.apply(fresh, { rank: 'advanced' }), true);
  assert.equal(flagsFor(s.getSnapshot(), 'A').rank, 'advanced');
});

test('signed out: no token, nothing applies, nothing readable', () => {
  const s = createAccountSession();
  assert.equal(s.token(), null);
  assert.equal(s.apply(null, { rank: 'master' }), false);
  assert.equal(flagsFor(s.getSnapshot(), null), null);
});

test('a partial patch (patron after purchase) keeps the other loaded flags of the same session', () => {
  const s = createAccountSession();
  s.setUser('A');
  const t = s.token();
  s.apply(t, { rank: 'expert', isAdmin: false, isPatron: false });
  s.apply(t, { isPatron: true });
  assert.deepEqual(flagsFor(s.getSnapshot(), 'A'), { rank: 'expert', isAdmin: false, isPatron: true });
});

test('setUser with the same id is a no-op (token refresh does not start a new session)', () => {
  const s = createAccountSession();
  s.setUser('A');
  const t = s.token();
  s.setUser('A');
  assert.equal(s.isCurrent(t), true);
});
