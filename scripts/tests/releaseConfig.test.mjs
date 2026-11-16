// Static checks of the release config and of the ad/leaderboard gates in source.
// They read files only; nothing is built or prebuilt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
// Code only: drop // line comments and {/* */} / /* */ blocks so prose mentioning load() etc. doesn't count.
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const app = JSON.parse(read('app.json')).expo;
const plugin = name => app.plugins.find(p => (Array.isArray(p) ? p[0] : p) === name);

function srcFiles(dir = new URL('src/', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? srcFiles(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

test('version 1.0.1 with appVersion runtime policy and no platform override', () => {
  assert.equal(app.version, '1.0.1');
  assert.deepEqual(app.runtimeVersion, { policy: 'appVersion' });
  assert.equal(app.android.runtimeVersion, undefined);
  assert.equal(app.ios.runtimeVersion, undefined);
  assert.match(read('src/constants/about.ts'), /APP_VERSION = '1\.0\.1'/);
});

test('app identity unchanged', () => {
  assert.equal(app.android.package, 'com.freepacepiano.app');
  assert.equal(app.extra.eas.projectId, '2422c0a7-6818-4a29-8510-40db3553c17c');
  assert.equal(app.updates.url, 'https://u.expo.dev/2422c0a7-6818-4a29-8510-40db3553c17c');
});

test('ads plugin: real app id kept, app measurement delayed', () => {
  const [, opts] = plugin('react-native-google-mobile-ads');
  assert.equal(opts.androidAppId, 'ca-app-pub-0087664103437143~3146115034');
  assert.equal(opts.delayAppMeasurementInit, true);
});

test('R8 kept and UMP keep rule added', () => {
  const [, opts] = plugin('expo-build-properties');
  assert.equal(opts.android.enableProguardInReleaseBuilds, true);
  assert.equal(opts.android.enableShrinkResourcesInReleaseBuilds, true);
  assert.match(opts.android.extraProguardRules, /-keep class com\.google\.android\.gms\.internal\.consent_sdk\.\*\* \{ \*; \}/);
});

test('no unconditional mobileAds().initialize() outside the gate wiring', () => {
  const hits = [...srcFiles(), new URL('App.tsx', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')]
    .filter(f => /mobileAds\(\)\.initialize\(\)/.test(code(readFileSync(f, 'utf8'))));
  assert.deepEqual(hits.map(f => f.replace(/\\/g, '/').split('/').slice(-3).join('/')), ['src/utils/adsConsent.ts']);
});

test('no consent reset and no forced debug geography outside __DEV__', () => {
  for (const f of srcFiles()) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /AdsConsent\.reset\(/, f);
    if (/debugGeography/.test(src)) {
      assert.match(f.replace(/\\/g, '/'), /src\/utils\/adsConsent\.ts$/);
      assert.match(src, /const devTestDeviceId = __DEV__ \?/);
    }
  }
});

test('SupportScreen: every ad load/show goes through the gate', () => {
  const src = code(read('src/screens/SupportScreen.tsx'));
  assert.match(src, /useRewardedAd\(allowed \? adUnitId : null\)/, 'no ad object without consent');
  assert.equal((src.match(/\bload\(\)/g) || []).length, 1, 'single load() call site');
  assert.match(src, /if \(adsGate\.canLoad\(generation\)\) load\(\);/);
  assert.equal((src.match(/\bshow\(\)/g) || []).length, 1, 'single show() call site');
  assert.match(src, /if \(isLoaded && adsGate\.canLoad\(generation\)\) \{\s*show\(\);/);
  assert.match(src, /key=\{ads\.generation\}/, 'ad component remounts on consent change');
  assert.doesNotMatch(src, /rewarded\.(load|show)/);
});

test('leaderboard publishers are gated on opt-in AND the live active account session', () => {
  const src = code(read('src/context/HistoryContext.tsx'));
  // active session = signed-in profile whose data is hydrated; epoch changes on every switch
  assert.match(src, /const activeUid = profile && hydratedUserId === profile\.id \? profile\.id : null;/);
  assert.match(src, /if \(session\.current\.uid !== activeUid\) session\.current = \{ uid: activeUid, epoch: session\.current\.epoch \+ 1 \};/);

  // score write-through: one call site, checked live for session + opt-in when the timer fires
  assert.equal((src.match(/pushLeaderboardScore\(/g) || []).length, 1);
  const wt = src.slice(src.indexOf('return scheduleServerSync({'), src.indexOf('}, [activeUid, profile, points, records, optedIn]);'));
  assert.match(wt, /isActive: \(\) => session\.current\.uid === uid && session\.current\.epoch === epoch,/);
  assert.match(wt, /publicWrite: \(\) => pushLeaderboardScore\(uid, name, snapshotPoints\),/);
  assert.match(wt, /mayPublish: \(\) => leaderboardChoice\.isOptedIn\(uid\),/);

  // sync-rank (also writes the public board): only via the syncer, opt-in + session checked live
  assert.equal((src.match(/syncRankRef\.current\(/g) || []).length, 1, 'single sync-rank call site');
  assert.match(src, /send: rank => syncRankRef\.current\(rank\),/);
  assert.match(src, /isActive: \(uid, epoch\) => session\.current\.uid === uid && session\.current\.epoch === epoch,/);
  assert.match(src, /mayPublish: uid => leaderboardChoice\.isOptedIn\(uid\),/);
  // rank sync goes through the tested driver, fed by the live session epoch and practice activity
  assert.match(src, /createRankSyncDriver\(createRankSyncer\(\{/);
  const drive = src.slice(src.indexOf('rankDriver.update({'), src.indexOf('}, [rankDriver, activeUid, optedIn, earnedRank, floor, points]);'));
  assert.match(drive, /userId: activeUid,\s*epoch: session\.current\.epoch,\s*optedIn,/);
  assert.match(drive, /rankIndex: floor === undefined \? null : Math\.max\(earnedRank, floor\),\s*activity: points,/);
  assert.match(src, /useEffect\(\(\) => \(\) => rankDriver\.dispose\(\), \[rankDriver\]\);/);

  // client wrapper: flags bound to the auth session; replies applied only for the session that sent them
  const prof = code(read('src/context/ProfileContext.tsx'));
  assert.match(prof, /syncRank = useCallback\(async \(earnedRankIndex: number\): Promise<boolean>/);
  assert.match(prof, /return acct\.apply\(tok, \{ rank: data\.rank \}\);/);
  assert.match(prof, /const flags = flagsFor\(acctSnap, userId\);/);
  assert.match(prof, /const rank = flags\?\.rank \?\? null;/);
  assert.match(prof, /acct\.apply\(tok, \{\s*isAdmin: !!data\?\.is_admin,/);
  assert.doesNotMatch(prof, /setRank\(|setIsAdmin\(|setIsPatron\(/, 'no unscoped flag setters left');
  // No other client path calls the publishers (definitions live in leaderboard.ts / ProfileContext.tsx).
  for (const f of srcFiles()) {
    if (/HistoryContext\.tsx$|leaderboard\.ts$|ProfileContext\.tsx$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(f, 'utf8'), /pushLeaderboardScore\(|\bsyncRank\(|'sync-rank'/, f);
  }
});

test('private rank shown without publishing; disclosure wording scoped', () => {
  const profile = code(read('src/screens/ProfileScreen.tsx'));
  assert.match(profile, /const shownRank = myRank \?\? rank;/);
  assert.doesNotMatch(profile, /RANK_LABEL\[rank as Rank\]/, 'profile no longer shows only the server rank');
  const en = read('src/utils/i18n/en.ts');
  assert.match(en, /Your email address is not shown on the leaderboard\./);
  assert.doesNotMatch(en, /email address is never shown/i);
  assert.doesNotMatch(en, /stops future updates from this device/i, 'old over-broad scope removed');
  assert.match(read('src/utils/leaderboardChoice.ts'), /export const LB_DISCLOSURE_VERSION = 2;/);
});
