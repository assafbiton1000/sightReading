import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLang } from '../context/LangContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { getAbout, DEVELOPER_EMAIL, APP_VERSION } from '../constants/about';
import AppHeader from '../components/AppHeader';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { t, lang } = useLang();
  const C = useTheme();
  const s = makeStyles(C);
  const about = getAbout(lang);

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.drawerAbout}</Text>
        </View>

        {/* Hero: app identity */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Feather name="music" size={30} color={C.primary} />
          </View>
          <Text style={s.heroName}>{t.appTitle}</Text>
          <Text style={s.heroTagline}>{about.tagline}</Text>
          <View style={s.versionChip}>
            <Text style={s.versionTxt}>{about.versionLabel} {APP_VERSION}</Text>
          </View>
        </View>

        {/* Background story */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.primaryTint }]}>
              <Feather name="book-open" size={16} color={C.primary} />
            </View>
            <Text style={s.cardTitle}>{about.story.title}</Text>
          </View>
          {about.story.paras.map((p, i) => (
            <Text key={i} style={s.para}>{p}</Text>
          ))}
        </View>

        {/* Developer credit */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Feather name="code" size={16} color="#10b981" />
            </View>
            <Text style={s.cardTitle}>{about.developer.title}</Text>
          </View>

          <View style={s.devRow}>
            <View style={s.devAvatar}>
              <Feather name="user" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.devName}>{about.developer.name}</Text>
              <Text style={s.devRole}>{about.developer.role}</Text>
            </View>
          </View>

          {about.developer.paras.map((p, i) => (
            <Text key={i} style={s.para}>{p}</Text>
          ))}

          <TouchableOpacity
            style={s.contactRow}
            onPress={() => Linking.openURL(`mailto:${DEVELOPER_EMAIL}`).catch(() => {})}
            activeOpacity={0.7}
          >
            <Feather name="mail" size={15} color={C.primary} />
            <Text style={s.contactTxt}>{about.developer.contactLabel}: {DEVELOPER_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        {/* Technology */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Feather name="cpu" size={16} color="#f59e0b" />
            </View>
            <Text style={s.cardTitle}>{about.tech.title}</Text>
          </View>
          {about.tech.items.map((item, i) => (
            <View key={i} style={s.techRow}>
              <View style={s.techDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.techName}>{item.name}</Text>
                <Text style={s.techDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.footer}>© {new Date().getFullYear()} {about.developer.name}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    hero: {
      alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 26, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    heroIcon: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    heroName: { fontFamily: 'Heebo_800ExtraBold', fontSize: 24, color: C.text },
    heroTagline: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center' },
    versionChip: { backgroundColor: C.chipBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 12 },
    versionTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 11.5, color: C.muted },

    card: {
      backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    cardIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15.5, color: C.text },
    para: { fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text, lineHeight: 22, opacity: 0.85, marginBottom: 10 },

    devRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    devAvatar: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    devName: { fontFamily: 'Heebo_800ExtraBold', fontSize: 17, color: C.text },
    devRole: { fontFamily: 'Heebo_500Medium', fontSize: 12.5, color: C.muted, marginTop: 1 },
    contactRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: C.chipBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 2,
    },
    contactTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: C.primary },

    techRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
    techDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
    techName: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: C.text },
    techDesc: { fontFamily: 'Heebo_400Regular', fontSize: 12.5, color: C.muted, lineHeight: 18, marginTop: 1 },

    footer: { fontFamily: 'Heebo_500Medium', fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 8 },
  });
}
