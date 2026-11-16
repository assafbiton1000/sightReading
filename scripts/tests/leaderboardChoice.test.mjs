// Unit tests for src/utils/leaderboardChoice.ts with an in-memory storage fake.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createLeaderboardChoiceStore, scheduleServerSync, LB_DISCLOSURE_VERSION } from '../../src/utils/leaderboardChoice.ts';

function memStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: async k => (k in data ? data[k] : null),
    setItem: async (k, v) => { data[k] = v; },
  };
}
const KEY = uid => `@sightreading/leaderboardChoice/${uid}`;

test('new or returning account with no stored choice: unset, not opted in', async () => {
  const store = createLeaderboardChoiceStore(memStorage());
  assert.equal(store.get('A'), undefined, 'undefined until loaded');
  assert.equal(store.isOptedIn('A'), false, 'not opted in while loading');
  await store.load('A');
  assert.equal(store.get('A'), null);
  assert.equal(store.isOptedIn('A'), false);
});

test('choice persists per account with version and survives a restart', async () => {
  const storage = memStorage();
  const s1 = createLeaderboardChoiceStore(storage);
  await s1.setChoice('A', 'in');
  const rec = JSON.parse(storage.data[KEY('A')]);
  assert.equal(rec.userId, 'A');
  assert.equal(rec.version, LB_DISCLOSURE_VERSION);
  const s2 = createLeaderboardChoiceStore(storage);
  await s2.load('A');
  assert.equal(s2.isOptedIn('A'), true);
});

test('two accounts on one device never share a choice', async () => {
  const store = createLeaderboardChoiceStore(memStorage());
  await store.setChoice('A', 'in');
  await store.load('B');
  assert.equal(store.isOptedIn('A'), true);
  assert.equal(store.isOptedIn('B'), false);
  assert.equal(store.get('B'), null);
});

test('record whose userId does not match the key is ignored', async () => {
  const storage = memStorage({ [KEY('B')]: JSON.stringify({ userId: 'A', choice: 'in', version: LB_DISCLOSURE_VERSION }) });
  const store = createLeaderboardChoiceStore(storage);
  await store.load('B');
  assert.equal(store.get('B'), null);
});

test('older disclosure version asks again', async () => {
  const storage = memStorage({ [KEY('A')]: JSON.stringify({ userId: 'A', choice: 'in', version: LB_DISCLOSURE_VERSION - 1 }) });
  const store = createLeaderboardChoiceStore(storage);
  await store.load('A');
  assert.equal(store.get('A'), null);
});

test('corrupt data or storage failure: unset, never opted in', async () => {
  const s1 = createLeaderboardChoiceStore(memStorage({ [KEY('A')]: '{oops' }));
  await s1.load('A');
  assert.equal(s1.get('A'), null);
  const s2 = createLeaderboardChoiceStore({ getItem: async () => { throw new Error('io'); }, setItem: async () => {} });
  await s2.load('A');
  assert.equal(s2.get('A'), null);
});

test('saved in, then opt-out save fails: blocked this session, failure visible, and the limit is real', async () => {
  const storage = memStorage();
  const store = createLeaderboardChoiceStore(storage);
  assert.equal(await store.setChoice('A', 'in'), 'saved');
  const goodSet = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  assert.equal(await store.setChoice('A', 'out'), 'failed');
  assert.equal(store.isOptedIn('A'), false, 'publishing stops for this session');
  assert.equal(store.saveStatus('A'), 'failed', 'failure is exposed, not swallowed');

  // Restart with the same disk: the old saved "in" is what is on disk. The code
  // cannot change that without a successful write — this is the documented limit.
  const restarted = createLeaderboardChoiceStore({ ...storage, setItem: goodSet });
  await restarted.load('A');
  assert.equal(restarted.get('A'), 'in');
});

test('retry of a failed opt-out persists it across a restart', async () => {
  const storage = memStorage();
  const store = createLeaderboardChoiceStore(storage);
  await store.setChoice('A', 'in');
  const goodSet = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  await store.setChoice('A', 'out');
  storage.setItem = goodSet;
  assert.equal(await store.retrySave('A'), 'saved');
  assert.equal(store.saveStatus('A'), 'saved');
  const restarted = createLeaderboardChoiceStore(storage);
  await restarted.load('A');
  assert.equal(restarted.get('A'), 'out');
});

test('retry is a no-op unless the last save failed (no loop)', async () => {
  const storage = memStorage();
  const store = createLeaderboardChoiceStore(storage);
  await store.setChoice('A', 'out');
  let writes = 0;
  storage.setItem = async () => { writes++; };
  assert.equal(await store.retrySave('A'), 'superseded');
  assert.equal(writes, 0);
});

test('in then out back-to-back: out is what ends on disk, superseded write skipped', async () => {
  const storage = memStorage();
  const store = createLeaderboardChoiceStore(storage);
  const r1 = store.setChoice('A', 'in');
  const r2 = store.setChoice('A', 'out');
  assert.deepEqual(await Promise.all([r1, r2]), ['superseded', 'saved']);
  assert.equal(JSON.parse(storage.data[KEY('A')]).choice, 'out');
});

test('slow in-write already started, then out: writes serialized, out stays on disk', async () => {
  const pending = [];
  const data = {};
  const storage = {
    getItem: async k => data[k] ?? null,
    setItem: (k, v) => new Promise(r => pending.push(() => { data[k] = v; r(); })),
  };
  const store = createLeaderboardChoiceStore(storage);
  const r1 = store.setChoice('A', 'in');
  await new Promise(r => setImmediate(r));       // "in" write is now in progress
  const r2 = store.setChoice('A', 'out');
  await new Promise(r => setImmediate(r));
  assert.equal(pending.length, 1, 'out waits for the in-flight write');
  pending.shift()();                              // in completes (late)...
  await new Promise(r => setImmediate(r));
  pending.shift()();                              // ...then out
  assert.deepEqual(await Promise.all([r1, r2]), ['superseded', 'saved']);
  assert.equal(JSON.parse(data[KEY('A')]).choice, 'out');
  assert.equal(store.saveStatus('A'), 'saved');
});

test('storage failure for one account does not touch another', async () => {
  const storage = memStorage();
  const store = createLeaderboardChoiceStore(storage);
  await store.setChoice('B', 'in');
  const goodSet = storage.setItem;
  storage.setItem = async (k, v) => { if (k === KEY('A')) throw new Error('io'); return goodSet(k, v); };
  await store.setChoice('A', 'out');
  assert.equal(store.saveStatus('A'), 'failed');
  assert.equal(store.saveStatus('B'), 'saved');
  assert.equal(store.isOptedIn('B'), true);
});

test('pending public write does not publish after an opt-out whose save failed', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const storage = memStorage();
    const store = createLeaderboardChoiceStore(storage);
    store.setChoice('A', 'in');
    const calls = [];
    scheduleServerSync({
      delayMs: 10, isActive: () => true,
      privateWrite: () => calls.push('stats'), publicWrite: () => calls.push('board'),
      mayPublish: () => store.isOptedIn('A'),
    });
    storage.setItem = async () => { throw new Error('io'); };
    store.setChoice('A', 'out');
    mock.timers.tick(10);
    assert.deepEqual(calls, ['stats']);
  } finally { mock.timers.reset(); }
});

test('scheduled sync for an account that is no longer active sends nothing at all', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const store = createLeaderboardChoiceStore(memStorage());
    store.setChoice('A', 'in');      // A's opt-in stays cached after the switch
    const session = { uid: 'A', epoch: 1 };
    const calls = [];
    scheduleServerSync({
      delayMs: 10,
      isActive: () => session.uid === 'A' && session.epoch === 1,
      privateWrite: () => calls.push('stats'), publicWrite: () => calls.push('board'),
      mayPublish: () => store.isOptedIn('A'),
    });
    Object.assign(session, { uid: 'B', epoch: 2 }); // switched before the timer, cleanup missed
    mock.timers.tick(10);
    assert.deepEqual(calls, []);
  } finally { mock.timers.reset(); }
});

test('a choice made while the stored value is still loading wins', async () => {
  let release;
  const storage = {
    getItem: () => new Promise(r => { release = () => r(JSON.stringify({ userId: 'A', choice: 'in', version: LB_DISCLOSURE_VERSION })); }),
    setItem: async () => {},
  };
  const store = createLeaderboardChoiceStore(storage);
  const loading = store.load('A');
  await store.setChoice('A', 'out');
  release();
  await loading;
  assert.equal(store.get('A'), 'out');
});

test('scheduled sync: private write always, public write only if allowed at fire time', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const store = createLeaderboardChoiceStore(memStorage());
    const calls = [];
    store.setChoice('A', 'in');
    scheduleServerSync({ isActive: () => true,
      delayMs: 1500,
      privateWrite: () => calls.push('stats'),
      publicWrite: () => calls.push('board'),
      mayPublish: () => store.isOptedIn('A'),
    });
    store.setChoice('A', 'out'); // user opts out before the timer fires
    mock.timers.tick(1500);
    assert.deepEqual(calls, ['stats'], 'backup still runs; no public write');
  } finally { mock.timers.reset(); }
});

test('scheduled sync: opted-in account publishes; unset or other account does not', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const store = createLeaderboardChoiceStore(memStorage());
    store.setChoice('A', 'in');
    const calls = [];
    for (const uid of ['A', 'B']) {
      scheduleServerSync({ delayMs: 10, isActive: () => true, publicWrite: () => calls.push(uid), mayPublish: () => store.isOptedIn(uid) });
    }
    mock.timers.tick(10);
    assert.deepEqual(calls, ['A']);
  } finally { mock.timers.reset(); }
});

test('cancelling a scheduled sync (effect cleanup) sends nothing', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const calls = [];
    const cancel = scheduleServerSync({ isActive: () => true,
      delayMs: 10, privateWrite: () => calls.push('stats'), publicWrite: () => calls.push('board'), mayPublish: () => true,
    });
    cancel();
    mock.timers.tick(10);
    assert.deepEqual(calls, []);
  } finally { mock.timers.reset(); }
});
