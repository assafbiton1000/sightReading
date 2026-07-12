import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import {
  NotePosition,
  SYSTEM_H_SINGLE, SYSTEM_H_GRAND,
  CURSOR_TOP_OFFSET, CURSOR_HEIGHT_SINGLE, CURSOR_HEIGHT_GRAND,
} from './SheetMusic';

/** Vertical placement for a given staff line, reading the SAME numbers SheetMusic
 * itself draws with — this is what used to drift out of sync and misalign the
 * cursor on every line after the first one. */
export function getCursorMetrics(isGrand: boolean, staffScale: number) {
  const systemH = (isGrand ? SYSTEM_H_GRAND : SYSTEM_H_SINGLE) * staffScale;
  const height = (isGrand ? CURSOR_HEIGHT_GRAND : CURSOR_HEIGHT_SINGLE) * staffScale;
  const topOffset = CURSOR_TOP_OFFSET * staffScale;
  return { systemH, height, topOffset };
}

export interface PlaybackCursorHandle {
  /**
   * Snap to note `idx`'s position, then — if `nextIdx` is given and lands on the
   * same staff line — glide smoothly and linearly toward it over `durationMs`.
   * Call this exactly when note `idx` becomes current; the glide is timed to land
   * exactly when the caller will next call activate() for `nextIdx`, so the line
   * is always moving and never stops mid-line. Crossing a line break is a snap,
   * not a glide — animating both X and a staff-line jump at once would look worse.
   */
  activate: (idx: number, nextIdx: number | null, durationMs: number) => void;
  /** Feed this straight into SheetMusic's onNotePositions prop. */
  setPositions: (positions: NotePosition[]) => void;
  reset: () => void;
}

export function usePlaybackCursor(): [PlaybackCursorHandle, Animated.Value, number] {
  const cursorXAnim = useRef(new Animated.Value(-100)).current;
  const [cursorLineIdx, setCursorLineIdx] = useState(0);
  const cursorLineIdxRef = useRef(0);
  const notePositionsRef = useRef<NotePosition[]>([]);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const setPositions = useCallback((positions: NotePosition[]) => {
    notePositionsRef.current = positions;
  }, []);

  const reset = useCallback(() => {
    animRef.current?.stop();
    cursorXAnim.stopAnimation();
    cursorXAnim.setValue(-100);
    cursorLineIdxRef.current = 0;
    setCursorLineIdx(0);
  }, [cursorXAnim]);

  const activate = useCallback((idx: number, nextIdx: number | null, durationMs: number) => {
    const pos = notePositionsRef.current.find(p => p.idx === idx);
    if (!pos) return;

    if (pos.lineIdx !== cursorLineIdxRef.current) {
      cursorLineIdxRef.current = pos.lineIdx;
      setCursorLineIdx(pos.lineIdx);
    }

    animRef.current?.stop();
    cursorXAnim.stopAnimation();
    // Always snap to the note that's actually current first — this is what stops
    // any small drift between the metronome/timeout clock and the animation clock
    // from accumulating over a long exercise.
    cursorXAnim.setValue(pos.x);

    const nextPos = nextIdx != null ? notePositionsRef.current.find(p => p.idx === nextIdx) : undefined;
    if (nextPos && nextPos.lineIdx === pos.lineIdx && durationMs > 0) {
      const anim = Animated.timing(cursorXAnim, {
        toValue: nextPos.x,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      animRef.current = anim;
      anim.start();
    }
  }, [cursorXAnim]);

  return [{ activate, setPositions, reset }, cursorXAnim, cursorLineIdx];
}

interface Props {
  cursorXAnim: Animated.Value;
  lineIdx: number;
  isGrand: boolean;
  staffScale: number;
  color: string;
  visible: boolean;
}

export default function PlaybackCursor({ cursorXAnim, lineIdx, isGrand, staffScale, color, visible }: Props) {
  if (!visible) return null;
  const { systemH, height, topOffset } = getCursorMetrics(isGrand, staffScale);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cursor,
        {
          backgroundColor: color,
          top: lineIdx * systemH + topOffset,
          height,
          transform: [{ translateX: cursorXAnim }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cursor: { position: 'absolute', width: 2.5, opacity: 0.75, borderRadius: 2 },
});
