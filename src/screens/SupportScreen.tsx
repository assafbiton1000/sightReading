import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRewardedAd, TestIds } from 'react-native-google-mobile-ads';
import {
  useIAP,
  finishTransaction as finishTransactionRoot,
  ErrorCode,
  type Purchase,
} from 'expo-iap';
import { useLang } from '../context/LangContext';
import { useHistory, POINTS_PER_AD } from '../context/HistoryContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { REWARDED_AD_UNIT_ID } from '../constants/support';
import { adsGate, useAdsGate } from '../utils/adsConsent';
import type { AdsPhase } from '../utils/adsGate';
import {
  SUPPORT_PRODUCT_IDS, SUPPORT_MIN_AMOUNT, SUPPORT_MAX_AMOUNT,
  supportProductId, isValidSupportAmount, findSupportProduct,
} from '../utils/iap';
import AppHeader from '../components/AppHeader';

// "Bonus Points" screen — two policy-safe ways to support the app:
//   1. A rewarded-ads flow: opt in to watch an ad, earn leaderboard points.
//   2. Support purchases via Google Play Billing (expo-iap): one-time tiers that
//      grant the cosmetic "Music Patron" badge. Buying a DIGITAL good through
//      Play Billing is compliant; external payment links (e.g. Buy Me a Coffee)
//      are NOT, which is why there are none here.

type Styles = ReturnType<typeof makeStyles>;

export default function SupportScreen() {
  const navigation = useNavigation();
  const { t } = useLang();
  const { recordAdWatch } = useHistory();
  const { profile, isPatron, verifyPurchase } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const scrollRef = useRef<ScrollView>(null);

  const [thanked, setThanked] = useState(false);
  const ads = useAdsGate();
  // Retries consent/init if an earlier attempt this launch failed; shares the
  // in-flight run with App's start-up call (never two consent forms).
  useEffect(() => { adsGate.ensureReady(); }, []);
  const onEarned = useCallback(() => { setThanked(true); recordAdWatch(); }, [recordAdWatch]);

  // ---- In-app purchase (free-choice support amount) ----
  const [amountText, setAmountText] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [supportThanked, setSupportThanked] = useState(false);
  const [supportError, setSupportError] = useState(false);

  const { connected, products, fetchProducts, requestPurchase } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      // Verify the purchase server-side (against the Google Play Developer API)
      // BEFORE granting the badge. Then consume it either way — consuming also
      // acknowledges the transaction, so Play won't auto-refund a real payment.
      // Root finishTransaction is a stable module reference, safe here.
      const granted = purchase.purchaseToken
        ? await verifyPurchase(purchase.productId, purchase.purchaseToken)
        : false;
      try {
        await finishTransactionRoot({ purchase, isConsumable: true });
      } catch {}
      setPurchasing(null);
      if (granted) {
        setSupportError(false);
        setSupportThanked(true);
      } else {
        setSupportError(true);
      }
    },
    onPurchaseError: (error) => {
      setPurchasing(null);
      // A user backing out of the Google payment sheet is not an error to show.
      if (error.code !== ErrorCode.UserCancelled) setSupportError(true);
    },
  });

  // Load the whole support-amount bank once the store connection is up, so we
  // can show the store's localized price for the amount the user types.
  useEffect(() => {
    if (connected) fetchProducts({ skus: SUPPORT_PRODUCT_IDS, type: 'in-app' });
  }, [connected, fetchProducts]);

  const amount = parseInt(amountText, 10);
  const amountValid = isValidSupportAmount(amount);
  const matchedProduct = amountValid ? findSupportProduct(products, amount) : undefined;

  async function handleDonate() {
    if (!profile || purchasing || !amountValid) return;
    const productId = supportProductId(amount);
    setSupportError(false);
    setSupportThanked(false);
    setPurchasing(productId);
    try {
      await requestPurchase({
        request: { google: { skus: [productId] }, apple: { sku: productId } },
        type: 'in-app',
      });
      // Result arrives via onPurchaseSuccess / onPurchaseError.
    } catch {
      setPurchasing(null);
      setSupportError(true);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.supportTitle}</Text>
        </View>

        <Text style={s.intro}>{t.supportIntro}</Text>

        {/* Watch an ad → earn points. Keyed on the consent generation: a privacy
            choice change unmounts it, discarding any ad loaded under the old choice. */}
        <RewardedAdCard
          key={ads.generation}
          generation={ads.generation}
          allowed={adsGate.canLoad(ads.generation)}
          phase={ads.formOpen ? 'checking' : ads.phase}
          onEarned={onEarned}
          hideError={thanked}
          s={s}
        />
        {ads.privacyOptionsRequired && (
          <TouchableOpacity
            style={s.privacyBtn}
            onPress={() => adsGate.openPrivacyOptions()}
            disabled={ads.formOpen}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Feather name="shield" size={14} color={C.primary} />
            <Text style={s.privacyBtnTxt}>{t.adsPrivacyOptionsBtn}</Text>
          </TouchableOpacity>
        )}

        {thanked && (
          <View style={s.thanksBox}>
            <Feather name="star" size={18} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={s.thanksTxt}>{t.watchAdThanks}</Text>
              <Text style={s.pointsEarnedTxt}>{t.watchAdPointsEarned.replace('{points}', String(POINTS_PER_AD))}</Text>
            </View>
          </View>
        )}
        {/* ---- Support with a free-choice amount (Google Play in-app purchase) ---- */}
        <View style={s.tierSection}>
          <Text style={s.sectionTitle}>{t.supportTierTitle}</Text>
          <Text style={s.sectionIntro}>{t.supportTierIntro}</Text>

          {isPatron && (
            <View style={s.patronBox}>
              <Feather name="award" size={16} color="#f59e0b" />
              <Text style={s.patronTxt}>{t.supportPatronActive}</Text>
            </View>
          )}

          {!profile ? (
            <Text style={s.hintTxt}>{t.supportSignInRequired}</Text>
          ) : !connected ? (
            <View style={s.storeLoading}>
              <ActivityIndicator size="small" color={C.muted} />
              <Text style={s.hintTxt}>{t.supportStoreUnavailable}</Text>
            </View>
          ) : (
            <>
              <Text style={s.amountLabel}>
                {t.supportAmountLabel.replace('{min}', String(SUPPORT_MIN_AMOUNT)).replace('{max}', String(SUPPORT_MAX_AMOUNT))}
              </Text>
              <View style={s.amountRow}>
                <View style={[s.iconWrap, { backgroundColor: 'rgba(236,72,153,0.14)' }]}>
                  <Feather name="heart" size={20} color="#ec4899" />
                </View>
                <Text style={s.currencySign}>$</Text>
                <TextInput
                  style={s.amountInput}
                  value={amountText}
                  onChangeText={txt => setAmountText(txt.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder={String(SUPPORT_MIN_AMOUNT)}
                  placeholderTextColor={C.muted}
                  maxLength={3}
                  editable={!purchasing}
                  // Keep the input (and Support button) above the number pad.
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                />
              </View>

              {/* Show the store's real localized price for the typed amount. */}
              {amountValid && matchedProduct && (
                <Text style={s.pricePreview}>{matchedProduct.displayPrice}</Text>
              )}

              <TouchableOpacity
                style={[s.donateBtn, (!amountValid || !!purchasing) && s.disabled]}
                onPress={handleDonate}
                disabled={!amountValid || !!purchasing}
                activeOpacity={0.85}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="heart" size={16} color="#fff" />
                    <Text style={s.donateBtnTxt}>{t.supportDonateBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {supportThanked && (
            <View style={s.thanksBox}>
              <Feather name="heart" size={18} color="#ec4899" />
              <View style={{ flex: 1 }}>
                <Text style={s.thanksTxt}>{t.supportThanksTitle}</Text>
                <Text style={s.pointsEarnedTxt}>{t.supportThanksBody}</Text>
              </View>
            </View>
          )}
          {supportError && !supportThanked && (
            <Text style={s.errorTxt}>{t.supportPurchaseError}</Text>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// The only place that touches the rewarded ad. Until the consent gate allows
// ads, the hook gets a null unit id, so no ad object exists and load()/show()
// are no-ops (wrapper 16: createForAdRequest itself makes no request; load()
// does). Every load/show also re-checks the gate live for this generation.
function RewardedAdCard({ generation, allowed, phase, onEarned, hideError, s }: {
  generation: number;
  allowed: boolean;
  phase: AdsPhase;
  onEarned: () => void;
  hideError: boolean;
  s: Styles;
}) {
  const { t } = useLang();
  const C = useTheme();
  // Dev builds always use Google's test unit, so local testing never serves live ads.
  const adUnitId = __DEV__ ? TestIds.REWARDED : (REWARDED_AD_UNIT_ID ?? TestIds.REWARDED);
  const { load, show, isLoaded, isClosed, isEarnedReward, error, isShowing } = useRewardedAd(allowed ? adUnitId : null);
  const [adError, setAdError] = useState(false);
  const onEarnedRef = useRef(onEarned);
  onEarnedRef.current = onEarned;

  const gatedLoad = useCallback(() => {
    if (adsGate.canLoad(generation)) load();
  }, [load, generation]);

  // Points only on the SDK's EARNED_REWARD event.
  useEffect(() => { if (isEarnedReward) onEarnedRef.current(); }, [isEarnedReward]);
  useEffect(() => { if (error) setAdError(true); }, [error]);
  useEffect(() => { gatedLoad(); }, [gatedLoad]);
  // Load the next ad as soon as one closes, so watching (and earning points
  // for) more than one in a visit doesn't need leaving and re-entering the screen.
  useEffect(() => { if (isClosed) gatedLoad(); }, [isClosed, gatedLoad]);

  function handlePress() {
    if (phase === 'error') { adsGate.ensureReady(); return; } // user-initiated retry
    if (phase !== 'ready') return;
    setAdError(false);
    if (isLoaded && adsGate.canLoad(generation)) {
      show();
    } else {
      setAdError(true);
      gatedLoad();
    }
  }

  const desc = phase === 'ready' ? (isLoaded ? t.watchAdDesc : t.watchAdLoading)
    : phase === 'blocked' ? t.adsBlocked
    : phase === 'error' ? t.adsCheckFailed
    : t.adsChecking;
  const busy = phase === 'idle' || phase === 'checking' || (phase === 'ready' && !isLoaded);

  return (
    <>
      <TouchableOpacity
        style={s.card}
        onPress={handlePress}
        disabled={isShowing || phase === 'blocked'}
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <View style={[s.iconWrap, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
          <Feather name="gift" size={22} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{t.watchAdLabel}</Text>
          <Text style={s.cardDesc}>{desc}</Text>
        </View>
        {busy && <ActivityIndicator size="small" color={C.muted} />}
      </TouchableOpacity>
      {adError && !hideError && phase === 'ready' && (
        <Text style={s.errorTxt}>{t.watchAdError}</Text>
      )}
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    intro: { fontFamily: 'Heebo_400Regular', fontSize: 14, color: C.muted, lineHeight: 21, marginBottom: 20 },

    card: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, padding: 18, gap: 16, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text },
    cardDesc: { fontFamily: 'Heebo_400Regular', fontSize: 12.5, color: C.muted, marginTop: 3 },

    thanksBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(245,158,11,0.14)', borderRadius: 14, padding: 14, marginTop: 4,
    },
    thanksTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },
    pointsEarnedTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: '#f59e0b', marginTop: 2 },
    errorTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: '#ef4444', textAlign: 'center', marginTop: 4 },
    privacyBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
    privacyBtnTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.primary },

    tierSection: { marginTop: 28 },
    sectionTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 17, color: C.text, marginBottom: 6 },
    sectionIntro: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 16 },
    tierCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 18, padding: 16, gap: 14, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
    },
    tierPrice: { fontFamily: 'Heebo_800ExtraBold', fontSize: 16, color: C.text },
    patronBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(245,158,11,0.14)', borderRadius: 12, padding: 12, marginBottom: 14,
    },
    patronTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.text, flex: 1 },
    storeLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    hintTxt: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, lineHeight: 20 },

    amountLabel: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted, marginBottom: 8 },
    amountRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card,
      borderRadius: 18, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
    },
    currencySign: { fontFamily: 'Heebo_800ExtraBold', fontSize: 22, color: C.text },
    amountInput: {
      flex: 1, fontFamily: 'Heebo_800ExtraBold', fontSize: 22, color: C.text,
      paddingVertical: 6, textAlign: 'left',
    },
    pricePreview: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted, marginTop: 8, textAlign: 'center' },
    donateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#ec4899', borderRadius: 16, paddingVertical: 15, marginTop: 12,
    },
    donateBtnTxt: { fontFamily: 'Heebo_800ExtraBold', fontSize: 15, color: '#fff' },
    disabled: { opacity: 0.45 },
  });
}
