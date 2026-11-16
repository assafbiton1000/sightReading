// Consent + initialization gate for Google Mobile Ads (UMP via react-native-google-mobile-ads).
// Pure: the SDK is injected, so this file has no React Native imports and is
// unit-tested in Node (scripts/tests/adsGate.test.mjs). Wiring: ./adsConsent.ts.
//
// Rules this enforces:
// - Consent is gathered (info refresh + form if required) on the first
//   ensureReady() of each app launch; concurrent callers share one run, so the
//   App start-up call and the Support screen never open two forms.
// - Only the SDK's canRequestAds allows initialize/load. A failed gather still
//   reads getConsentInfo (consent stored from an earlier launch stays valid);
//   if that read fails too, ads stay blocked. Nothing is assumed or invented.
// - mobileAds().initialize() runs at most once at a time and is marked done
//   only after it succeeds, so a failure can be retried.
// - Opening the privacy-options form blocks loads, and bumps `generation`:
//   any ad loaded before the change must be discarded (the Support screen keys
//   its ad component on it), even if canRequestAds is still true afterwards.
// - No retry loop: a failed gather/init is retried only on the next
//   ensureReady() call (Support screen mount or the user's "try again" tap).

export interface ConsentInfo {
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  /** UMP consent status, informational only — never used to infer consent. */
  status: string;
}

export interface AdsSdk {
  gatherConsent(): Promise<unknown>;
  getConsentInfo(): Promise<ConsentInfo>;
  showPrivacyOptionsForm(): Promise<unknown>;
  initialize(): Promise<unknown>;
}

/** idle → checking → ready | blocked (consent says no) | error (couldn't check / init failed) */
export type AdsPhase = 'idle' | 'checking' | 'ready' | 'blocked' | 'error';

export interface AdsGateState {
  phase: AdsPhase;
  privacyOptionsRequired: boolean;
  formOpen: boolean;
  /** Bumped whenever ads loaded earlier must be thrown away. */
  generation: number;
}

export function createAdsGate(sdk: AdsSdk) {
  let state: AdsGateState = { phase: 'idle', privacyOptionsRequired: false, formOpen: false, generation: 0 };
  const listeners = new Set<() => void>();
  let lastInfo: ConsentInfo | null = null;
  let gathered = false;              // a gather succeeded during this launch
  let inflight: Promise<boolean> | null = null;
  let initialized = false;
  let initRun: Promise<unknown> | null = null;

  function set(patch: Partial<AdsGateState>) {
    state = { ...state, ...patch };
    listeners.forEach(l => l());
  }

  async function initOnce(): Promise<boolean> {
    if (initialized) return true;
    if (!initRun) {
      initRun = sdk.initialize().then(
        () => { initialized = true; },
        (e) => { initRun = null; throw e; },  // allow a later retry
      );
    }
    try { await initRun; return true; } catch { return false; }
  }

  // Re-read consent from the SDK and derive the phase. Never throws. Only the
  // newest refresh may write state: an older one finishing late (e.g. one that
  // read consent before the privacy form changed it) is dropped.
  let refreshSeq = 0;
  async function refresh(): Promise<boolean> {
    const mine = ++refreshSeq;
    let info: ConsentInfo;
    try {
      info = await sdk.getConsentInfo();
    } catch {
      if (mine !== refreshSeq) return false;
      lastInfo = null;
      // keep the last known privacyOptionsRequired so the button stays reachable
      set({ phase: 'error', generation: state.generation + 1 });
      return false;
    }
    if (mine !== refreshSeq) return false;
    const changed = !lastInfo || lastInfo.canRequestAds !== info.canRequestAds || lastInfo.status !== info.status;
    const hadInfo = lastInfo !== null;
    lastInfo = info;
    const generation = changed && hadInfo ? state.generation + 1 : state.generation;
    if (!info.canRequestAds) {
      set({ phase: gathered ? 'blocked' : 'error', privacyOptionsRequired: info.privacyOptionsRequired, generation });
      return false;
    }
    const ok = await initOnce();
    if (mine !== refreshSeq) return false;
    set({ phase: ok ? 'ready' : 'error', privacyOptionsRequired: info.privacyOptionsRequired, generation });
    return ok;
  }

  async function run(): Promise<boolean> {
    if (state.phase !== 'ready') set({ phase: 'checking' });
    if (!gathered) {
      try { await sdk.gatherConsent(); gathered = true; } catch { /* fall through to the stored info */ }
    }
    return refresh();
  }

  // The whole privacy-options cycle (wait for start-up → form → refresh →
  // state) runs under one lock, taken synchronously on the first call; every
  // concurrent call joins it. Start-up never waits on this lock (no deadlock);
  // ensureReady() calls made during the cycle join it instead of racing it.
  let privacyRun: Promise<void> | null = null;

  function ensureReady(): Promise<boolean> {
    if (privacyRun) return privacyRun.then(() => state.phase === 'ready');
    if (!inflight) inflight = run().finally(() => { inflight = null; });
    return inflight;
  }

  async function privacyCycle(): Promise<void> {
    while (inflight) await inflight;   // never overlap the consent form
    set({ formOpen: true, generation: state.generation + 1 });
    try {
      try {
        await sdk.showPrivacyOptionsForm();
        gathered = true;               // the user has just answered UMP directly
      } catch { /* refresh below decides from the stored info */ }
      await refresh();
    } finally {
      set({ formOpen: false });
    }
  }

  function openPrivacyOptions(): Promise<void> {
    if (!privacyRun) privacyRun = privacyCycle().finally(() => { privacyRun = null; });
    return privacyRun;
  }

  return {
    ensureReady,
    openPrivacyOptions,
    /** True only if an ad may be loaded/shown now for the given generation. */
    canLoad: (generation: number) => state.phase === 'ready' && !state.formOpen && generation === state.generation,
    getState: () => state,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export type AdsGate = ReturnType<typeof createAdsGate>;
