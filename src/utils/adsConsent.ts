import { useSyncExternalStore } from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';
import { createAdsGate, type AdsGateState } from './adsGate';

// Dev builds only: to test the EEA consent form on a test device, set
// EXPO_PUBLIC_UMP_TEST_DEVICE_ID to the hashed device id UMP prints in logcat.
// In release __DEV__ is false, so no forced geography / test id ever ships.
const devTestDeviceId = __DEV__ ? process.env.EXPO_PUBLIC_UMP_TEST_DEVICE_ID : undefined;
const consentOptions = devTestDeviceId
  ? { debugGeography: AdsConsentDebugGeography.EEA, testDeviceIdentifiers: [devTestDeviceId] }
  : {};

export const adsGate = createAdsGate({
  gatherConsent: () => AdsConsent.gatherConsent(consentOptions),
  getConsentInfo: async () => {
    const info = await AdsConsent.getConsentInfo();
    return {
      canRequestAds: info.canRequestAds,
      privacyOptionsRequired: info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      status: String(info.status),
    };
  },
  showPrivacyOptionsForm: () => AdsConsent.showPrivacyOptionsForm(),
  initialize: () => mobileAds().initialize(),
});

export function useAdsGate(): AdsGateState {
  return useSyncExternalStore(adsGate.subscribe, adsGate.getState);
}
