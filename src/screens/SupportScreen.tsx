import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { useLang } from '../context/LangContext';
import { useHistory, POINTS_PER_AD } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { REWARDED_AD_UNIT_ID } from '../constants/support';
import AppHeader from '../components/AppHeader';

// "Bonus Points" screen — a standard rewarded-ads flow: the user opts in to
// watch an ad and earns leaderboard points. Deliberately NO donation links or
// "support the developer" framing: external payment links (e.g. Buy Me a
// Coffee) violate Google Play's Payments policy for apps distributed there.

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

        {/* Watch an ad → earn points */}
        <TouchableOpacity
          style={s.card}
          onPress={handleWatchAd}
          disabled={rewarded.isShowing}
          activeOpacity={0.85}
        >
          <View style={[s.iconWrap, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
            <Feather name="gift" size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{t.watchAdLabel}</Text>
            <Text style={s.cardDesc}>{!rewarded.isLoaded ? t.watchAdLoading : t.watchAdDesc}</Text>
          </View>
          {!rewarded.isLoaded && <ActivityIndicator size="small" color={C.muted} />}
        </TouchableOpacity>

        {thanked && (
          <View style={s.thanksBox}>
            <Feather name="star" size={18} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={s.thanksTxt}>{t.watchAdThanks}</Text>
              <Text style={s.pointsEarnedTxt}>{t.watchAdPointsEarned.replace('{points}', String(POINTS_PER_AD))}</Text>
            </View>
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
  });
}
