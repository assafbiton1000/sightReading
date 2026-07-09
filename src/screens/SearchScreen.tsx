import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Keyboard, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

type Screen = 'search' | 'viewer';

interface Source {
  label: string;
  desc: string;
  icon: string;
  color: string;
  buildUrl: (q: string) => string;
}

const FREE_SOURCES: Source[] = [
  {
    label: 'IMSLP',
    desc: 'ספריית תווים ציבורית — מוזיקה קלאסית, חינם לגמרי',
    icon: '📜',
    color: '#4F6EF7',
    buildUrl: q => `https://imslp.org/wiki/Special:Search?search=${encodeURIComponent(q)}&go=Go`,
  },
  {
    label: '8notes',
    desc: 'תווים לפסנתר לסגנונות שונים — פופ, ג׳אז, קלאסי',
    icon: '🎹',
    color: '#10b981',
    buildUrl: q => `https://www.8notes.com/search/?q=${encodeURIComponent(q)}&category=piano`,
  },
  {
    label: 'Google תווים',
    desc: 'חיפוש כללי — מחזיר תוצאות מכל אתרי התווים החינמיים',
    icon: '🔍',
    color: '#4285f4',
    buildUrl: q => `https://www.google.com/search?q=${encodeURIComponent(q + ' free piano sheet music')}`,
  },
  {
    label: 'Free-Scores',
    desc: 'אלפי תווים חינמיים לכל כלי — כולל פסנתר',
    icon: '🎵',
    color: '#ef4444',
    buildUrl: q => `https://www.free-scores.com/search-en.php?s=${encodeURIComponent(q)}`,
  },
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [committed, setCommitted] = useState('');
  const [screen, setScreen] = useState<Screen>('search');
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSearch() {
    Keyboard.dismiss();
    if (query.trim()) setCommitted(query.trim());
  }

  function openSource(source: Source) {
    const q = committed || query.trim();
    if (!q) return;
    setViewerUrl(source.buildUrl(q));
    setViewerTitle(`${source.label} — ${q}`);
    setScreen('viewer');
  }

  if (screen === 'viewer') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.viewerHeader}>
          <TouchableOpacity onPress={() => setScreen('search')}>
            <Text style={s.back}>← חזרה</Text>
          </TouchableOpacity>
          <Text style={s.viewerTitle} numberOfLines={1}>{viewerTitle}</Text>
        </View>
        <WebView
          source={{ uri: viewerUrl }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          )}
        />
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← חזרה</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>חיפוש תווים חינמי</Text>
        </View>

        {/* Search bar */}
        <View style={s.searchRow}>
          <TextInput
            style={s.input}
            placeholder="שם שיר, מלחין, סגנון..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
            <Text style={s.searchBtnTxt}>חפש</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <Text style={s.hint}>
          {committed
            ? `תוצאות עבור: "${committed}" — בחר מקור:`
            : 'הקלד שם שיר ובחר מאיזה אתר חינמי לחפש'}
        </Text>

        {/* Source cards */}
        <View style={s.sourcesCol}>
          {FREE_SOURCES.map(src => (
            <TouchableOpacity
              key={src.label}
              style={[s.sourceCard, !committed && s.sourceCardDisabled]}
              onPress={() => openSource(src)}
              disabled={!committed}
            >
              <Text style={s.sourceIcon}>{src.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.sourceLabel, { color: committed ? src.color : C.muted }]}>
                  {src.label}
                </Text>
                <Text style={s.sourceDesc}>{src.desc}</Text>
              </View>
              <Text style={[s.arrow, { color: committed ? src.color : C.border }]}>←</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            💡 כל המקורות האלה הם חינמיים לחלוטין. IMSLP מצוין למוזיקה קלאסית. 8notes לפופ וג׳אז.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const C = { bg: '#F5F7FA', card: '#fff', primary: '#4F6EF7', text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0' };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  back: { fontSize: 16, color: C.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1, backgroundColor: C.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text,
    borderWidth: 1.5, borderColor: C.border,
  },
  searchBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 13, color: C.muted, marginBottom: 14 },
  sourcesCol: { gap: 10 },
  sourceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.border, gap: 12,
  },
  sourceCardDisabled: { opacity: 0.5 },
  sourceIcon: { fontSize: 28 },
  sourceLabel: { fontSize: 15, fontWeight: '700' },
  sourceDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  arrow: { fontSize: 18, fontWeight: '700' },
  noteBox: {
    marginTop: 20, backgroundColor: '#FFF9E6', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#F6D860',
  },
  noteText: { fontSize: 13, color: '#7A6000', lineHeight: 20 },
  viewerHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderColor: C.border, gap: 12,
  },
  viewerTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
