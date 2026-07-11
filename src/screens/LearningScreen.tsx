import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';
import SheetMusic from '../components/SheetMusic';
import { isNoteMatch } from '../utils/musicTheory';
import { GeneratedNote } from '../utils/noteGenerator';
import { useLang } from '../context/LangContext';

type Clef = 'treble' | 'bass';

const TREBLE_KEYS = [
  'c/4','d/4','e/4','f/4','g/4','a/4','b/4',
  'c/5','d/5','e/5','f/5','g/5','a/5','b/5','c/6',
];

const BASS_KEYS = [
  'f/2','g/2','a/2','b/2',
  'c/3','d/3','e/3','f/3','g/3','a/3','b/3',
  'c/4','d/4','e/4','f/4','g/4',
];

// Note names are now language-aware via useLang()

function noteLetter(key: string) { return key.split('/')[0]; }
function noteOctave(key: string) { return key.split('/')[1]; }

function pickOther(keys: string[], avoid: string): string {
  const opts = keys.filter(k => k !== avoid);
  return opts[Math.floor(Math.random() * opts.length)];
}

export default function LearningScreen() {
  const navigation = useNavigation();
  const pitchRef = useRef<PitchDetectorHandle>(null);
  const { t } = useLang();

  const NOTE_NAME: Record<string, string> = {
    c: t.noteC, d: t.noteD, e: t.noteE,
    f: t.noteF, g: t.noteG, a: t.noteA, b: t.noteB,
  };

  const [clef, setClef] = useState<Clef>('treble');
  const clefRef = useRef<Clef>('treble');

  const keys = clef === 'treble' ? TREBLE_KEYS : BASS_KEYS;

  const [currentKey, setCurrentKey] = useState(keys[Math.floor(Math.random() * keys.length)]);
  const currentKeyRef = useRef(currentKey);

  const [detected, setDetected] = useState(false);
  const detectedRef = useRef(false);

  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [micReady, setMicReady] = useState(false);

  const flashAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    Audio.requestPermissionsAsync().then(({ granted }) => {
      if (cancelled || !granted) return;
      setTimeout(() => {
        if (!cancelled) {
          pitchRef.current?.start();
          setMicReady(true);
        }
      }, 800);
    });
    return () => {
      cancelled = true;
      pitchRef.current?.stop();
    };
  }, []);

  // When clef changes, pick a new note from the new range
  function switchClef(newClef: Clef) {
    if (newClef === clef) return;
    clefRef.current = newClef;
    setClef(newClef);
    const newKeys = newClef === 'treble' ? TREBLE_KEYS : BASS_KEYS;
    const next = newKeys[Math.floor(Math.random() * newKeys.length)];
    currentKeyRef.current = next;
    setCurrentKey(next);
    detectedRef.current = false;
    setDetected(false);
  }

  const handlePitch = useCallback((freq: number) => {
    if (detectedRef.current) return;

    if (isNoteMatch(freq, currentKeyRef.current)) {
      detectedRef.current = true;
      setDetected(true);
      setCount(c => c + 1);
      setStreak(s => s + 1);

      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1.1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 60, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();

      setTimeout(() => {
        const currentKeys = clefRef.current === 'treble' ? TREBLE_KEYS : BASS_KEYS;
        const next = pickOther(currentKeys, currentKeyRef.current);
        currentKeyRef.current = next;
        setCurrentKey(next);
        detectedRef.current = false;
        setDetected(false);
      }, 600);
    }
  }, []);

  const sheetNote: GeneratedNote = { keys: [currentKey], duration: 'w', clef };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5F7FA', '#dcfce7'],
  });

  return (
    <SafeAreaView style={s.safe}>
      <PitchDetectorView ref={pitchRef} onPitchDetected={handlePitch} />

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { pitchRef.current?.stop(); navigation.goBack(); }}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.learningTitle}</Text>
        </View>

        {/* Clef selector */}
        <View style={s.clefRow}>
          {(['treble', 'bass'] as Clef[]).map(c => (
            <TouchableOpacity
              key={c}
              style={[s.clefBtn, clef === c && s.clefBtnActive]}
              onPress={() => switchClef(c)}
            >
              <Text style={[s.clefBtnTxt, clef === c && s.clefBtnTxtActive]}>
                {c === 'treble' ? t.clefTreble : t.clefBass}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Counter row */}
        <View style={s.topRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{count}</Text>
            <Text style={s.statLbl}>{t.notesCount}</Text>
          </View>
          <View style={[s.statBox, { borderColor: '#f59e0b' }]}>
            <Text style={[s.statNum, { color: '#f59e0b' }]}>{streak}</Text>
            <Text style={s.statLbl}>{t.streakLabel}</Text>
          </View>
          <View style={[s.badge, detected ? s.badgeGreen : s.badgeBlue]}>
            <Text style={s.badgeTxt}>
              {detected ? t.correctExclaim : micReady ? t.listeningLabel : t.waitingLabel}
            </Text>
          </View>
        </View>

        {/* Sheet music */}
        <Animated.View style={{ transform: [{ scale: flashAnim }] }}>
          <SheetMusic
            notes={[sheetNote]}
            highlightedIndices={detected ? [] : [0]}
            noteResults={[detected ? 'correct' : 'pending']}
            keySignature="C"
            timeSignature={[4, 4]}
          />
        </Animated.View>

        {/* Note label */}
        <Animated.View style={[s.noteLabel, { backgroundColor: bgColor }]}>
          <Text style={[s.noteName, detected && { color: '#22c55e' }]}>
            {NOTE_NAME[noteLetter(currentKey)]}
          </Text>
          <Text style={s.noteOctave}>{noteOctave(currentKey)}</Text>
        </Animated.View>

        <Text style={s.hint}>{t.learningHint}</Text>

        <TouchableOpacity style={s.skipBtn} onPress={() => {
          const currentKeys = clef === 'treble' ? TREBLE_KEYS : BASS_KEYS;
          const next = pickOther(currentKeys, currentKey);
          currentKeyRef.current = next;
          setCurrentKey(next);
          detectedRef.current = false;
          setDetected(false);
          setStreak(0);
        }}>
          <Text style={s.skipTxt}>{t.skipBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = {
  bg: '#F5F7FA', card: '#fff', primary: '#8b5cf6',
  text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0',
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  back: { fontSize: 16, color: C.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: C.text },

  clefRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  clefBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  clefBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  clefBtnTxt: { fontSize: 14, fontWeight: '700', color: C.text },
  clefBtnTxtActive: { color: '#fff' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  statBox: { alignItems: 'center', backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: C.primary },
  statNum: { fontSize: 28, fontWeight: '900', color: C.primary },
  statLbl: { fontSize: 10, color: C.muted, fontWeight: '600' },
  badge: { flex: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  badgeBlue: { backgroundColor: '#EEF2FF' },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeTxt: { fontSize: 14, fontWeight: '700', color: C.text },

  noteLabel: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 16, marginBottom: 8 },
  noteName: { fontSize: 42, fontWeight: '900', color: C.primary },
  noteOctave: { fontSize: 22, color: C.muted, fontWeight: '600' },

  hint: { textAlign: 'center', color: C.muted, fontSize: 13, marginBottom: 20 },

  skipBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  skipTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
});
