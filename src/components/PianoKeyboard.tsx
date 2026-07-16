import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, PanResponder } from 'react-native';
import { midiToFreq } from '../utils/musicTheory';
import { useTheme, useIsDark } from '../utils/theme';

// On-screen piano keyboard — the app's "MIDI keyboard" input source. Every tap
// is a perfectly discrete strike (unlike the mic's continuous pitch stream), so
// the parent can feed taps straight into the practice engine with no ring/repeat
// disambiguation at all. Black keys are included even though exercises only
// generate naturals: hitting one is a real, honest wrong note.
//
// Two hard-won rules of this component:
// 1. The whole keyboard is forced LTR. In the app's RTL languages (Hebrew,
//    Arabic) React Native mirrors rows and swaps absolute left/right, which
//    scrambled the keys against their labels and put black keys over the
//    wrong whites — a piano's low-notes-left order is universal, not textual.
// 2. The keys themselves never scroll. A drag that starts on a key used to
//    fire that key's note on touch-down (an instrument must respond on press),
//    which in Practice consumed the current note as "wrong". Scrolling happens
//    only on the dedicated drag strip above the keys; tapping the strip's ends
//    jumps a whole octave.

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

  // ── Drag-strip scrolling (the ScrollView itself has scrollEnabled=false) ──
  const contentW = whites.length * WHITE_W;
  const scrollXRef = useRef(0);
  const dragStartXRef = useRef(0);
  const viewportWRef = useRef(0);
  const stripWRef = useRef(0);

  const clampScrollTo = useCallback((x: number, animated: boolean) => {
    const maxX = Math.max(0, contentW - viewportWRef.current);
    const clamped = Math.min(maxX, Math.max(0, x));
    scrollXRef.current = clamped;
    scrollRef.current?.scrollTo({ x: clamped, animated });
  }, [contentW]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { dragStartXRef.current = scrollXRef.current; },
    onPanResponderMove: (_, g) => {
      // Dragging the strip drags the keyboard itself: strip left → higher keys.
      clampScrollTo(dragStartXRef.current - g.dx, false);
    },
    onPanResponderRelease: (e, g) => {
      // A tap (no real drag) on the strip's ends jumps a whole octave.
      if (Math.abs(g.dx) < 8) {
        const octave = 7 * WHITE_W;
        const dir = e.nativeEvent.locationX < stripWRef.current / 2 ? -1 : 1;
        clampScrollTo(scrollXRef.current + dir * octave, true);
      }
    },
  }), [clampScrollTo]);

  useEffect(() => {
    const idx = whites.findIndex(w => w.note === initialNote);
    if (idx > 0) {
      // Leave a little context to the left of the target key.
      const x = Math.max(0, (idx - 3) * WHITE_W);
      scrollXRef.current = x;
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
    <View style={[styles.wrapper, { borderColor: C.border, backgroundColor: C.card }]}>
      {/* Scroll strip — the ONLY place that scrolls the keyboard. Drag to slide,
          tap an end to jump an octave. */}
      <View
        {...panResponder.panHandlers}
        onLayout={e => { stripWRef.current = e.nativeEvent.layout.width; }}
        style={[styles.strip, { backgroundColor: isDark ? '#2a2d3d' : '#e6e8f0' }]}
      >
        <Text style={[styles.stripChevron, { color: C.muted }]}>◀</Text>
        <View style={styles.stripGrip}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.stripDot, { backgroundColor: C.muted }]} />
          ))}
        </View>
        <Text style={[styles.stripChevron, { color: C.muted }]}>▶</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        scrollEnabled={false}
        onLayout={e => { viewportWRef.current = e.nativeEvent.layout.width; }}
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={{ width: contentW, height: WHITE_H, direction: 'ltr' }}>
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
    </View>
  );
}

// Memoized: the practice screen re-renders on every detected note, and 60 keys
// don't need to re-render with it.
export default React.memo(PianoKeyboard);

const styles = StyleSheet.create({
  // direction:'ltr' everywhere — a piano is low-left/high-right in every language;
  // without this, RTL locales mirror the rows and swap the blacks' absolute lefts.
  wrapper: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', direction: 'ltr' },
  strip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 28, paddingHorizontal: 14, direction: 'ltr',
  },
  stripChevron: { fontSize: 13, fontWeight: '700' },
  stripGrip: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  stripDot: { width: 5, height: 5, borderRadius: 2.5, opacity: 0.55 },
  scroll: { flexGrow: 0, direction: 'ltr' },
  whiteRow: { flexDirection: 'row', height: WHITE_H, direction: 'ltr' },
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
