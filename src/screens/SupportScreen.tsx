import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useRewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { useLang } from '../context/LangContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { BUY_ME_A_COFFEE_URL, REWARDED_AD_UNIT_ID } from '../constants/support';
import AppHeader from '../components/AppHeader';

type FeatherIcon = keyof typeof Feather.glyphMap;
type Styles = ReturnType<typeof makeStyles>;

export default function SupportScreen() {
  const navigation = useNavigation();
  const { t } = useLang();
  const { recordAdWatch } = useHistory();
  const C = useTheme();
  const s = makeStyles(C);

  const [thanked, setThanked] = useState(false);
  const [adError, setAdError] = useState(false);
  const adUnitId = REWARDED_AD_UNIT_ID ?? TestIds.REWARDED;
  const rewarded = useRewardedAd(adUnitId);

  useEffect(() => {
    if (rewarded.isEarnedReward) {
      setThanked(true);
      recordAdWatch();
    }
  }, [rewarded.isEarnedReward, recordAdWatch]);

  useEffect(() => {
    if (rewarded.error) setAdError(true);
  }, [rewarded.error]);

  useEffect(() => {
    rewarded.load();
  }, [rewarded.load]);

  // Load the next ad as soon as one closes, so watching (and earning points
  // for) more than one in a visit doesn't need leaving and re-entering the screen.
  useEffect(() => {
    if (rewarded.isClosed) rewarded.load();
  }, [rewarded.isClosed, rewarded.load]);

  function handleWatchAd() {
    setAdError(false);
    if (rewarded.isLoaded) {
      rewarded.show();
    } else {
      setAdError(true);
      rewarded.load();
    }
  }

  function handleBmcPress() {
    if (BUY_ME_A_COFFEE_URL) WebBrowser.openBrowserAsync(BUY_ME_A_COFFEE_URL);
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.supportTitle}</Text>
        </View>

        <Text style={s.intro}>{t.supportIntro}</Text>

        {/* Buy Me a Coffee */}
        <TouchableOpacity
          style={[s.card, !BUY_ME_A_COFFEE_URL && s.cardDisabled]}
          onPress={handleBmcPress}
          disabled={!BUY_ME_A_COFFEE_URL}
          activeOpacity={0.85}
        >
          <View style={[s.iconWrap, { backgroundColor: 'rgba(255,145,0,0.12)' }]}>
            <Feather name="coffee" size={22} color="#ff9100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{t.bmcLabel}</Text>
            <Text style={s.cardDesc}>{t.bmcDesc}</Text>
          </View>
          {!BUY_ME_A_COFFEE_URL && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{t.bmcComingSoon}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Watch an ad */}
        <TouchableOpacity
          style={s.card}
          onPress={handleWatchAd}
          disabled={rewarded.isShowing}
          activeOpacity={0.85}
        >
          <View style={[s.iconWrap, { backgroundColor: 'rgba(236,72,153,0.12)' }]}>
            <Feather name="heart" size={22} color="#ec4899" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{t.watchAdLabel}</Text>
            <Text style={s.cardDesc}>{!rewarded.isLoaded ? t.watchAdLoading : t.watchAdDesc}</Text>
          </View>
          {!rewarded.isLoaded && <ActivityIndicator size="small" color={C.muted} />}
        </TouchableOpacity>

        {thanked && (
          <View style={s.thanksBox}>
            <Feather name="heart" size={18} color="#ec4899" />
            <Text style={s.thanksTxt}>{t.watchAdThanks}</Text>
          </View>
        )}
        {adError && !thanked && (
          <Text style={s.errorTxt}>{t.watchAdError}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
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
    cardDisabled: { opacity: 0.6 },
    iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text },
    cardDesc: { fontFamily: 'Heebo_400Regular', fontSize: 12.5, color: C.muted, marginTop: 3 },

    badge: { backgroundColor: C.chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    badgeTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 11, color: C.muted },

    thanksBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(236,72,153,0.12)', borderRadius: 14, padding: 14, marginTop: 4,
    },
    thanksTxt: { flex: 1, fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },
    errorTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: '#ef4444', textAlign: 'center', marginTop: 4 },
  });
}
