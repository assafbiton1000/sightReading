import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { SONGS, SONG_DIFFICULTIES } from '../constants/songs';
import { useLang } from '../context/LangContext';
import { useTheme, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type Nav = StackNavigationProp<RootStackParamList, 'SongLibrary'>;

export default function SongLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLang();
  const C = useTheme();
  const s = makeStyles(C);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SONGS;
    return SONGS.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.composer.toLowerCase().includes(q)
    );
  }, [query]);

  function openSong(song: (typeof SONGS)[number]) {
    const bpm = SONG_DIFFICULTIES.find(d => d.id === song.levelId)?.bpm ?? SONG_DIFFICULTIES[0].bpm;
    navigation.navigate('Practice', {
      levelId: 1, // placeholder — the song's own bpm below drives tempo, not the main level system
      clef: 'treble',
      noteCount: song.notes.length,
      bothMode: 'sequential',
      song: { name: song.name, notes: song.notes, bpm },
    });
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t.songLibraryTitle}</Text>

        <View style={s.searchBox}>
          <Feather name="search" size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder={t.searchSongsPlaceholder}
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="music" size={22} color={C.muted} />
            <Text style={s.emptyTxt}>{t.noSongsFound}</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map(song => (
              <TouchableOpacity key={song.id} style={s.card} onPress={() => openSong(song)} activeOpacity={0.85}>
                <View style={s.iconWrap}>
                  <Feather name="music" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.songName}>{song.name}</Text>
                  <Text style={s.songSub}>{song.composer}</Text>
                </View>
                <View style={s.levelPill}>
                  <Text style={s.levelPillTxt}>{t.levelBadge} {song.levelId}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 3,
};

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 26, color: C.text, marginBottom: 18 },

    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card,
      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, ...cardShadow,
    },
    searchInput: { flex: 1, fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text },

    list: { gap: 12 },
    card: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, padding: 16, gap: 14, ...cardShadow,
    },
    iconWrap: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    songName: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text },
    songSub: { fontFamily: 'Heebo_400Regular', fontSize: 12, color: C.muted, marginTop: 3 },
    levelPill: { backgroundColor: C.chipBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    levelPillTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12, color: C.text },

    emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 48 },
    emptyTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted },
  });
}
