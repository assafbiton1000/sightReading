// Unit tests for src/utils/accountRank.ts (rank floor + rank syncer) with fakes.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRankFloorStore, createRankSyncer, createRankSyncDriver, effectiveRankIndex } from '../../src/utils/accountRank.ts';

const flush = () => new Promise(r => setImmediate(r));
function memStorage() {
  const data = {};
  return { data, getItem: async k => (k in data ? data[k] : null), setItem: async (k, v) => { data[k] = v; } };
}
function deferred() {
  let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve };
}

// ---- effective rank / floor ----

test('opted-out user still progresses privately (no server rank needed)', () => {
  assert.equal(effectiveRankIndex({ serverIndex: null, earnedIndex: 2, floorIndex: -1 }), 2);
});

test('a higher admin/server rank is never lowered by local data', () => {
  assert.equal(effectiveRankIndex({ serverIndex: 4, earnedIndex: 1, floorIndex: 0 }), 4);
});

test('trimmed history does not lower a rank already reached (floor)', async () => {
  const floors = createRankFloorStore(memStorage());
  await floors.load('A');
  await floors.raise('A', 3);
  // 90-day window dropped the old sessions: earned falls back to 1
  assert.equal(effectiveRankIndex({ serverIndex: null, earnedIndex: 1, floorIndex: floors.get('A') }), 3);
  await floors.raise('A', 1);
  assert.equal(floors.get('A'), 3, 'floor only rises');
});

test('floor survives a restart; accounts never share a floor', async () => {
  const storage = memStorage();
  const s1 = createRankFloorStore(storage);
  await s1.load('A');
  await s1.raise('A', 3);
  const s2 = createRankFloorStore(storage);
  await s2.load('A');
  await s2.load('B');
  assert.equal(s2.get('A'), 3);
  assert.equal(s2.get('B'), -1);
});

test('floor record with a mismatched user id is ignored', async () => {
  const storage = memStorage();
  storage.data['@sightreading/rankFloor/B'] = JSON.stringify({ userId: 'A', index: 4 });
  const s = createRankFloorStore(storage);
  await s.load('B');
  assert.equal(s.get('B'), -1);
});

test('floor is not raised before it is loaded (no write for a not-yet-hydrated account)', async () => {
  const storage = memStorage();
  const s = createRankFloorStore(storage);
  await s.raise('A', 2);
  assert.equal(s.get('A'), undefined);
  assert.deepEqual(storage.data, {});
});

test('fast raises with slow writes leave the highest value on disk', async () => {
  const pending = [];
  const data = {};
  const storage = {
    getItem: async () => null,
    setItem: (k, v) => new Promise(r => pending.push(() => { data[k] = v; r(); })),
  };
  const s = createRankFloorStore(storage);
  await s.load('A');
  const p1 = s.raise('A', 2);
  const p2 = s.raise('A', 3);
  await flush();
  pending.shift()();          // first write completes...
  await flush();
  pending.shift()();          // ...then the second (serialized)
  await Promise.all([p1, p2]);
  assert.equal(JSON.parse(data['@sightreading/rankFloor/A']).index, 3);
});

// ---- rank syncer ----

function harness() {
  const session = { uid: 'A', epoch: 1 };
  const optIn = new Set(['A']);
  const sends = [];
  let reply = async () => true;
  const syncer = createRankSyncer({
    send: rank => { sends.push(rank); return reply(rank); },
    isActive: (uid, epoch) => session.uid === uid && session.epoch === epoch,
    mayPublish: uid => optIn.has(uid),
  });
  return { session, optIn, sends, syncer, setReply: f => { reply = f; } };
}

test('no opt-in: sync-rank is never called', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    h.optIn.clear();
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    assert.deepEqual(h.sends, []);
  } finally { mock.timers.reset(); }
});

test('switch from A (opted in) to B, or sign-out, before the timer: nothing sent for A', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    for (const next of [{ uid: 'B', epoch: 2 }, { uid: null, epoch: 2 }]) {
      const h = harness();
      h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 }); // timer not cancelled (stale callback)
      Object.assign(h.session, next);
      mock.timers.tick(10);
      assert.deepEqual(h.sends, [], 'A is still "in" in the cache, but not the active session');
    }
  } finally { mock.timers.reset(); }
});

test('same account re-hydrated (new epoch): old callback does not fire', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    h.session.epoch = 2;
    mock.timers.tick(10);
    assert.deepEqual(h.sends, []);
  } finally { mock.timers.reset(); }
});

test('failed sync stays retryable; success then marks synced', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    h.setReply(async () => false);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    assert.equal(h.syncer.syncedFor('A'), -1, 'failure is not marked synced');
    h.setReply(async () => true);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2, 2]);
    assert.equal(h.syncer.syncedFor('A'), 2);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2, 2], 'no resend once confirmed');
  } finally { mock.timers.reset(); }
});

test('opt-out before the retry: retry does not send', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    h.setReply(async () => false);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    h.optIn.delete('A');
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2]);
  } finally { mock.timers.reset(); }
});

test('late success for A after switching to B does not mark or block B', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    h.optIn.add('B');
    const slow = deferred();
    h.setReply(() => slow.promise);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 3, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    Object.assign(h.session, { uid: 'B', epoch: 2 });
    h.setReply(async () => true);
    h.syncer.schedule({ userId: 'B', epoch: 2, rankIndex: 1, delayMs: 10 });
    slow.resolve(true);        // A's request returns late with success
    await flush();
    assert.equal(h.syncer.syncedFor('A'), -1);
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [3, 1], 'B synced its own rank');
    assert.equal(h.syncer.syncedFor('B'), 1);
  } finally { mock.timers.reset(); }
});

test('cancelled timer then re-opt-in: sync still happens (not marked done by mistake)', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const cancel = h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    cancel();                  // user opted out before it fired (effect cleanup)
    mock.timers.tick(10);
    assert.deepEqual(h.sends, []);
    assert.equal(h.syncer.syncedFor('A'), -1);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 }); // opted back in
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2]);
  } finally { mock.timers.reset(); }
});

test('one request at a time; a higher rank arriving meanwhile is sent after success', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const first = deferred();
    h.setReply(() => first.promise);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 1, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 }); // while in flight
    mock.timers.tick(10);
    assert.deepEqual(h.sends, [1], 'no parallel request');
    h.setReply(async () => true);
    first.resolve(true);
    await flush(); await flush();
    assert.deepEqual(h.sends, [1, 2]);
    assert.equal(h.syncer.syncedFor('A'), 2);
  } finally { mock.timers.reset(); }
});

// ---- v3: session = userId + epoch; retry wired to practice activity ----

test('REGRESSION (a): A signs in again (epoch 2) while the epoch-1 request is pending → new session still sends', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const slow = deferred();
    h.setReply(() => slow.promise);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2], 'epoch-1 request in flight');

    h.session.epoch = 2;                     // A signed out and back in
    h.setReply(async () => true);
    h.syncer.schedule({ userId: 'A', epoch: 2, rankIndex: 2, delayMs: 10 });
    slow.resolve(true);                      // old reply arrives first (success)
    await flush();
    assert.equal(h.syncer.syncedFor('A', 2), -1, 'old reply does not mark the new session');
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2, 2], 'new session request was not dropped');
    assert.equal(h.syncer.syncedFor('A', 2), 2);
  } finally { mock.timers.reset(); }
});

test('REGRESSION (a): new-session request still checks opt-in and epoch live before sending', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const slow = deferred();
    h.setReply(() => slow.promise);
    h.syncer.schedule({ userId: 'A', epoch: 1, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    await flush();
    h.session.epoch = 2;
    h.syncer.schedule({ userId: 'A', epoch: 2, rankIndex: 2, delayMs: 10 });
    h.optIn.delete('A');                     // opted out before the new timer fired
    mock.timers.tick(10);
    await flush();
    h.optIn.add('A');
    h.session.epoch = 3;                     // and a stale epoch-2 timer can't fire either
    h.syncer.schedule({ userId: 'A', epoch: 2, rankIndex: 2, delayMs: 10 });
    mock.timers.tick(10);
    slow.resolve(true);
    await flush();
    assert.deepEqual(h.sends, [2], 'only the original epoch-1 send ever happened');
  } finally { mock.timers.reset(); }
});

test('REGRESSION (b): failed sync is retried once by the next practice activity (driver used by HistoryContext)', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const driver = createRankSyncDriver(h.syncer, 10);
    const base = { userId: 'A', epoch: 1, optedIn: true, rankIndex: 2 };
    h.setReply(async () => false);
    driver.update({ ...base, activity: 10 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2]);
    assert.equal(h.syncer.syncedFor('A', 1), -1);

    driver.update({ ...base, activity: 10 }); // re-render, same inputs
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2], 'no request on a plain re-render');

    h.setReply(async () => true);
    driver.update({ ...base, activity: 11 }); // another practice session, same rank
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2, 2], 'exactly one retry');
    assert.equal(h.syncer.syncedFor('A', 1), 2);

    driver.update({ ...base, activity: 12 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2, 2], 'no resend after success');
  } finally { mock.timers.reset(); }
});

test('REGRESSION (b): after opt-out the activity trigger sends nothing (prop or live check)', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const driver = createRankSyncDriver(h.syncer, 10);
    h.setReply(async () => false);
    driver.update({ userId: 'A', epoch: 1, optedIn: true, rankIndex: 2, activity: 1 });
    mock.timers.tick(10);
    await flush();
    driver.update({ userId: 'A', epoch: 1, optedIn: false, rankIndex: 2, activity: 2 }); // opted out
    mock.timers.tick(10);
    await flush();
    h.optIn.delete('A');
    driver.update({ userId: 'A', epoch: 1, optedIn: true, rankIndex: 2, activity: 3 }); // stale prop, live says no
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2]);
  } finally { mock.timers.reset(); }
});

test('driver: a change before the delay replaces the pending timer; dispose cancels it', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const h = harness();
    const driver = createRankSyncDriver(h.syncer, 10);
    driver.update({ userId: 'A', epoch: 1, optedIn: true, rankIndex: 1, activity: 1 });
    driver.update({ userId: 'A', epoch: 1, optedIn: true, rankIndex: 2, activity: 2 });
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2], 'one request with the latest rank');
    driver.update({ userId: 'A', epoch: 1, optedIn: true, rankIndex: 3, activity: 3 });
    driver.dispose();
    mock.timers.tick(10);
    await flush();
    assert.deepEqual(h.sends, [2]);
  } finally { mock.timers.reset(); }
});
