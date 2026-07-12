import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { midiToFreq } from '../utils/musicTheory';
import { useTheme, useIsDark } from '../utils/theme';

// On-screen piano keyboard — the app's "MIDI keyboard" input source. Every tap
// is a perfectly discrete strike (unlike the mic's continuous pitch stream), so
// the parent can feed taps straight into the practice engine with no ring/repeat
// disambiguation at all. Black keys are included even though exercises only
// generate naturals: hitting one is a real, honest wrong note.

interface PianoKey {
  /** VexFlow-style name, e.g. 'c/4' or 'c#/4' — same naming the exercises use */
  note: string;
  freq: number;
  black: boolean;
  /** Octave label shown on C keys for orientation */
  label?: string;
}

const WHITE_W = 44;
const WHITE_H = 150;
const BLACK_W = 28;
const BLACK_H = 92;

const LETTER_SEMITONE: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const HAS_SHARP = new Set(['c', 'd', 'f', 'g', 'a']); // letters followed by a black key

// Range a/1 .. e/6 — covers every note any level can generate (see levels.ts).
function buildKeys(): { whites: PianoKey[]; blacks: (PianoKey & { left: number })[] } {
  const whites: PianoKey[] = [];
  const blacks: (PianoKey & { left: number })[] = [];
  const push = (letter: string, octave: number) => {
    const midi = 12 * (octave + 1) + LETTER_SEMITONE[letter];
    const whiteIdx = whites.length;
    whites.push({
      note: `${letter}/${octave}`,
      freq: midiToFreq(midi),
      black: false,
      label: letter === 'c' ? `C${octave}` : undefined,
    });
    if (HAS_SHARP.has(letter)) {
      blacks.push({
        note: `${letter}#/${octave}`,
        freq: midiToFreq(midi + 1),
        black: true,
        left: (whiteIdx + 1) * WHITE_W - BLACK_W / 2,
      });
    }
  };
  push('a', 1); push('b', 1);
  for (let o = 2; o <= 5; o++) for (const l of ['c', 'd', 'e', 'f', 'g', 'a', 'b']) push(l, o);
  for (const l of ['c', 'd', 'e']) push(l, 6); // 'e' has no sharp, so nothing dangles past the edge
  return { whites, blacks };
}

interface Props {
  /** Fired on touch-down (an instrument responds on press, not release). */
  onKeyPress: (note: string, freq: number) => void;
  /** White key to bring into view on mount. Defaults to middle C. */
  initialNote?: string;
}

function PianoKeyboard({ onKeyPress, initialNote = 'c/4' }: Props) {
  const C = useTheme();
  const isDark = useIsDark();
  const { whites, blacks } = useMemo(buildKeys, []);
  const scrollRef = useRef<ScrollView>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const idx = whites.findIndex(w => w.note === initialNote);
    if (idx > 0) {
      // Leave a little context to the left of the target key.
      const x = Math.max(0, (idx - 3) * WHITE_W);
      setTimeout(() => scrollRef.current?.scrollTo({ x, animated: false }), 0);
    }
  }, []);

  const press = useCallback((k: PianoKey) => {
    onKeyPress(k.note, k.freq);
    setPressedKeys(s => new Set(s).add(k.note));
  }, [onKeyPress]);

  const release = useCallback((k: PianoKey) => {
    setPressedKeys(s => { const n = new Set(s); n.delete(k.note); return n; });
  }, []);

  const whiteBg = isDark ? '#E8E9EF' : '#FFFFFF';
  const whitePressedBg = C.primaryTint;
  const blackBg = isDark ? '#0B0C12' : '#1a1d2e';

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, { borderColor: C.border, backgroundColor: C.card }]}
    >
      <View style={{ width: whites.length * WHITE_W, height: WHITE_H }}>
        <View style={styles.whiteRow}>
          {whites.map(k => (
            <Pressable
              key={k.note}
              onPressIn={() => press(k)}
              onPressOut={() => release(k)}
              style={[
                styles.whiteKey,
                { backgroundColor: pressedKeys.has(k.note) ? whitePressedBg : whiteBg, borderColor: isDark ? '#3a3d4d' : '#c9ccd6' },
              ]}
            >
              {!!k.label && <Text style={styles.cLabel}>{k.label}</Text>}
            </Pressable>
          ))}
        </View>
        {blacks.map(k => (
          <Pressable
            key={k.note}
            onPressIn={() => press(k)}
            onPressOut={() => release(k)}
            style={[
              styles.blackKey,
              { left: k.left, backgroundColor: pressedKeys.has(k.note) ? C.primary : blackBg },
            ]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// Memoized: the practice screen re-renders on every detected note, and 60 keys
// don't need to re-render with it.
export default React.memo(PianoKeyboard);

const styles = StyleSheet.create({
  scroll: { borderWidth: 1, borderRadius: 12, flexGrow: 0 },
  whiteRow: { flexDirection: 'row', height: WHITE_H },
  whiteKey: {
    width: WHITE_W, height: WHITE_H,
    borderWidth: 1, borderTopWidth: 0,
    borderBottomLeftRadius: 5, borderBottomRightRadius: 5,
    justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6,
  },
  cLabel: { fontSize: 10, fontWeight: '600', color: '#9aa0ae' },
  blackKey: {
    position: 'absolute', top: 0,
    width: BLACK_W, height: BLACK_H,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 2 },
  },
});
