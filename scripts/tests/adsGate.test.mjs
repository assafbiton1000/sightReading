// Unit tests for src/utils/adsGate.ts with a fake SDK (no React Native, no network).
// Run: npm test   (Node >= 22.6 strips the TypeScript types natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdsGate } from '../../src/utils/adsGate.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function fakeSdk(over = {}) {
  const calls = { gather: 0, info: 0, form: 0, init: 0 };
  const sdk = {
    info: { canRequestAds: true, privacyOptionsRequired: false, status: 'NOT_REQUIRED' },
    gatherConsent: async () => { calls.gather++; },
    getConsentInfo: async () => { calls.info++; return { ...sdk.info }; },
    showPrivacyOptionsForm: async () => { calls.form++; },
    initialize: async () => { calls.init++; },
    ...over,
  };
  return { sdk, calls };
}

test('App and Support asking together: one gather, one initialize, ready', async () => {
  const { sdk, calls } = fakeSdk();
  const gate = createAdsGate(sdk);
  assert.equal(gate.canLoad(0), false, 'nothing may load before the first check');
  const [a, b] = await Promise.all([gate.ensureReady(), gate.ensureReady()]);
  assert.deepEqual([a, b], [true, true]);
  assert.equal(calls.gather, 1);
  assert.equal(calls.init, 1);
  assert.equal(gate.getState().phase, 'ready');
  assert.equal(gate.canLoad(gate.getState().generation), true);
});

test('a successful gather is not repeated on later calls in the same launch', async () => {
  const { sdk, calls } = fakeSdk();
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  await gate.ensureReady();
  assert.equal(calls.gather, 1);
  assert.equal(calls.init, 1);
  assert.equal(calls.info, 2, 'info is still refreshed');
});

test('gather fails but stored consent says canRequestAds=true: ads allowed', async () => {
  const { sdk, calls } = fakeSdk({ gatherConsent: async () => { throw new Error('offline'); } });
  const gate = createAdsGate(sdk);
  assert.equal(await gate.ensureReady(), true);
  assert.equal(calls.init, 1);
});

test('gather fails and canRequestAds=false: error, no init, nothing loadable', async () => {
  const { sdk, calls } = fakeSdk({ gatherConsent: async () => { throw new Error('offline'); } });
  sdk.info.canRequestAds = false;
  const gate = createAdsGate(sdk);
  assert.equal(await gate.ensureReady(), false);
  assert.equal(gate.getState().phase, 'error');
  assert.equal(calls.init, 0);
  assert.equal(gate.canLoad(gate.getState().generation), false);
});

test('getConsentInfo itself fails: never assumes permission', async () => {
  const { sdk, calls } = fakeSdk({ getConsentInfo: async () => { throw new Error('native'); } });
  const gate = createAdsGate(sdk);
  assert.equal(await gate.ensureReady(), false);
  assert.equal(gate.getState().phase, 'error');
  assert.equal(calls.init, 0);
});

test('gather OK but consent does not allow ads: blocked, no init', async () => {
  const { sdk, calls } = fakeSdk();
  sdk.info = { canRequestAds: false, privacyOptionsRequired: true, status: 'REQUIRED' };
  const gate = createAdsGate(sdk);
  assert.equal(await gate.ensureReady(), false);
  assert.equal(gate.getState().phase, 'blocked');
  assert.equal(gate.getState().privacyOptionsRequired, true, 'privacy options stay reachable');
  assert.equal(calls.init, 0);
});

test('failed gather is retried on the next ensureReady (no loop in between)', async () => {
  let fail = true;
  const { sdk, calls } = fakeSdk({ gatherConsent: async () => { calls.gather++; if (fail) throw new Error('offline'); } });
  sdk.info.canRequestAds = false;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  assert.equal(calls.gather, 1);
  fail = false; sdk.info.canRequestAds = true;
  assert.equal(await gate.ensureReady(), true);
  assert.equal(calls.gather, 2);
});

test('initialize fails, then concurrent retries recover with exactly one more init', async () => {
  let failInit = true;
  const { sdk, calls } = fakeSdk({ initialize: async () => { calls.init++; if (failInit) throw new Error('init'); } });
  const gate = createAdsGate(sdk);
  assert.equal(await gate.ensureReady(), false);
  assert.equal(gate.getState().phase, 'error');
  assert.equal(calls.init, 1);
  failInit = false;
  const results = await Promise.all([gate.ensureReady(), gate.ensureReady()]);
  assert.deepEqual(results, [true, true]);
  assert.equal(calls.init, 2, 'no parallel double init');
  await gate.ensureReady();
  assert.equal(calls.init, 2, 'marked initialized only after success, then never again');
});

test('privacy options: loads blocked while open, old ads invalidated even if canRequestAds stays true', async () => {
  const form = deferred();
  const { sdk, calls } = fakeSdk({ showPrivacyOptionsForm: () => { calls.form++; return form.promise; } });
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  const oldGen = gate.getState().generation;
  assert.equal(gate.canLoad(oldGen), true);

  const done = gate.openPrivacyOptions();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(gate.getState().formOpen, true);
  assert.equal(gate.canLoad(oldGen), false, 'old ad unusable while the form is open');
  assert.equal(gate.canLoad(gate.getState().generation), false, 'nothing loads while the form is open');
  const joined = gate.ensureReady(); // joins the privacy cycle instead of racing it

  form.resolve();
  await done;
  assert.equal(await joined, true);
  const newGen = gate.getState().generation;
  assert.notEqual(newGen, oldGen);
  assert.equal(gate.canLoad(oldGen), false, 'ad from before the change stays invalid');
  assert.equal(gate.canLoad(newGen), true, 'fresh load cycle allowed');
  assert.equal(calls.init, 1);
});

test('privacy options changing to "no ads": blocked after close', async () => {
  const { sdk } = fakeSdk({
    showPrivacyOptionsForm: async () => { sdk.info = { canRequestAds: false, privacyOptionsRequired: true, status: 'OBTAINED' }; },
  });
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  await gate.openPrivacyOptions();
  assert.equal(gate.getState().phase, 'blocked');
  assert.equal(gate.canLoad(gate.getState().generation), false, 'status OBTAINED is not treated as permission');
});

test('privacy options never overlap an in-flight consent form', async () => {
  const gather = deferred();
  const order = [];
  const { sdk } = fakeSdk({
    gatherConsent: () => { order.push('gather'); return gather.promise.then(() => order.push('gather-done')); },
    showPrivacyOptionsForm: async () => { order.push('privacy-form'); },
  });
  const gate = createAdsGate(sdk);
  gate.ensureReady();
  const p = gate.openPrivacyOptions();
  await Promise.resolve();
  gather.resolve();
  await p;
  assert.deepEqual(order, ['gather', 'gather-done', 'privacy-form']);
});

test('opening privacy options twice at once shows one form', async () => {
  const { sdk, calls } = fakeSdk();
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  await Promise.all([gate.openPrivacyOptions(), gate.openPrivacyOptions()]);
  assert.equal(calls.form, 1);
});

const flush = () => new Promise(r => setImmediate(r));

test('REGRESSION: two privacy-option opens during start-up gather → exactly one form', async () => {
  const gather = deferred();
  const form = deferred();
  const { sdk, calls } = fakeSdk({
    gatherConsent: () => { calls.gather++; return gather.promise; },
    showPrivacyOptionsForm: () => { calls.form++; return form.promise; },
  });
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  const startup = gate.ensureReady();
  const genBefore = gate.getState().generation;
  const a = gate.openPrivacyOptions();
  const b = gate.openPrivacyOptions();
  assert.equal(a, b, 'second caller joins the same operation');

  gather.resolve();
  await startup;
  await flush();
  assert.equal(calls.form, 1, 'SDK got exactly one form call');
  const st = gate.getState();
  assert.equal(st.formOpen, true);
  assert.equal(gate.canLoad(st.generation), false, 'no load/show while the form is open');
  assert.equal(gate.canLoad(genBefore), false);

  form.resolve();
  await Promise.all([a, b]);
  const after = gate.getState();
  assert.equal(after.formOpen, false);
  assert.equal(after.phase, 'ready');
  assert.notEqual(after.generation, genBefore, 'ad from before the form is invalidated');
  assert.equal(gate.canLoad(after.generation), true);
  assert.equal(calls.form, 1);
  assert.equal(calls.gather, 1);
});

test('REGRESSION: two opens while a refresh is in flight → one form, refresh not overlapped', async () => {
  const { sdk, calls } = fakeSdk();
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  const info = deferred();
  const order = [];
  sdk.getConsentInfo = () => { calls.info++; order.push('info'); return info.promise.then(() => ({ ...sdk.info })); };
  sdk.showPrivacyOptionsForm = async () => { calls.form++; order.push('form'); };
  const refreshing = gate.ensureReady();
  const a = gate.openPrivacyOptions();
  const b = gate.openPrivacyOptions();
  await flush();
  assert.equal(calls.form, 0, 'form waits for the in-flight refresh');
  info.resolve();
  await Promise.all([refreshing, a, b]);
  assert.equal(calls.form, 1);
  assert.deepEqual(order.slice(0, 2), ['info', 'form']);
  assert.equal(gate.getState().formOpen, false);
});

test('privacy form failure: lock released, state refreshed, button still reachable', async () => {
  const { sdk, calls } = fakeSdk({ showPrivacyOptionsForm: async () => { calls.form++; throw new Error('form'); } });
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  await gate.openPrivacyOptions();
  assert.equal(gate.getState().formOpen, false);
  assert.equal(gate.getState().phase, 'ready', 'decided from the stored consent info');
  await gate.openPrivacyOptions();
  assert.equal(calls.form, 2, 'a later open is possible (lock released)');
});

test('refresh failure after the privacy form: error, lock released, privacy button kept', async () => {
  const { sdk } = fakeSdk();
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  sdk.getConsentInfo = async () => { throw new Error('native'); };
  await gate.openPrivacyOptions();
  const st = gate.getState();
  assert.equal(st.formOpen, false);
  assert.equal(st.phase, 'error');
  assert.equal(st.privacyOptionsRequired, true, 'last known requirement kept so the button stays');
  assert.equal(gate.canLoad(st.generation), false);
});

test('ensureReady during the privacy cycle joins it and cannot flip back to ready early', async () => {
  const form = deferred();
  const { sdk } = fakeSdk({ showPrivacyOptionsForm: () => form.promise });
  sdk.info.privacyOptionsRequired = true;
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  const p = gate.openPrivacyOptions();
  await flush();
  const joined = gate.ensureReady();
  sdk.info = { canRequestAds: false, privacyOptionsRequired: true, status: 'OBTAINED' };
  form.resolve();
  assert.equal(await joined, false);
  await p;
  assert.equal(gate.getState().phase, 'blocked');
});

test('consent info changing between checks bumps the generation', async () => {
  const { sdk } = fakeSdk();
  const gate = createAdsGate(sdk);
  await gate.ensureReady();
  const g1 = gate.getState().generation;
  sdk.info.status = 'OBTAINED';
  await gate.ensureReady();
  assert.notEqual(gate.getState().generation, g1);
});

test('subscribers are notified and can unsubscribe', async () => {
  const { sdk } = fakeSdk();
  const gate = createAdsGate(sdk);
  let n = 0;
  const off = gate.subscribe(() => n++);
  await gate.ensureReady();
  assert.ok(n > 0);
  off();
  const before = n;
  await gate.openPrivacyOptions();
  assert.equal(n, before);
});
