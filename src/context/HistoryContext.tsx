import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionMode = 'practice' | 'playback' | 'learning';

interface SessionRecord {
  date: string;      // local calendar day, 'YYYY-MM-DD'
  timestamp: number;
  mode: SessionMode;
  minutes: number;
  correct?: number;  // practice sessions only — drives accuracy
  total?: number;
}

export interface HistoryStats {
  streak: number;
  todayMinutes: number;
  weekMinutes: number;
  avgAccuracy: number | null; // 0..100, null until at least one practice session exists
  totalSessions: number;
}

interface HistoryCtx {
  loaded: boolean;
  stats: HistoryStats;
  recordSession: (input: { mode: SessionMode; minutes: number; correct?: number; total?: number }) => void;
}

const STORAGE_KEY = '@sightreading/history';
const RETENTION_DAYS = 90;

function toDayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// A streak is "alive" as long as the most recent training day is today or
// yesterday — practicing today isn't required to keep it, only to extend it.
// It only resets to 0 once a full day has been skipped entirely.
function computeStreak(dayStrs: Set<string>): number {
  const today = new Date();
  const todayStr = toDayStr(today);
  const yesterdayStr = toDayStr(addDays(today, -1));

  let anchor: Date;
  if (dayStrs.has(todayStr)) anchor = today;
  else if (dayStrs.has(yesterdayStr)) anchor = addDays(today, -1);
  else return 0;

  let streak = 0;
  let cursor = anchor;
  while (dayStrs.has(toDayStr(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const Ctx = createContext<HistoryCtx | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecords(parsed);
        } catch (_) {}
      })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const recordSession = useCallback((input: { mode: SessionMode; minutes: number; correct?: number; total?: number }) => {
    if (!(input.minutes > 0)) return;
    const now = new Date();
    const record: SessionRecord = {
      date: toDayStr(now),
      timestamp: now.getTime(),
      mode: input.mode,
      minutes: input.minutes,
      correct: input.correct,
      total: input.total,
    };
    setRecords(prev => {
      const cutoff = toDayStr(addDays(now, -RETENTION_DAYS));
      const next = [...prev.filter(r => r.date >= cutoff), record];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const stats = useMemo<HistoryStats>(() => {
    const todayStr = toDayStr(new Date());
    const weekStartStr = toDayStr(addDays(new Date(), -6));
    const dayStrs = new Set(records.map(r => r.date));

    let todayMinutes = 0;
    let weekMinutes = 0;
    let sumCorrect = 0;
    let sumTotal = 0;

    for (const r of records) {
      if (r.date === todayStr) todayMinutes += r.minutes;
      if (r.date >= weekStartStr) weekMinutes += r.minutes;
      if (r.mode === 'practice' && typeof r.correct === 'number' && typeof r.total === 'number' && r.total > 0) {
        sumCorrect += r.correct;
        sumTotal += r.total;
      }
    }

    return {
      streak: computeStreak(dayStrs),
      todayMinutes,
      weekMinutes,
      avgAccuracy: sumTotal > 0 ? Math.round((sumCorrect / sumTotal) * 100) : null,
      totalSessions: records.length,
    };
  }, [records]);

  return <Ctx.Provider value={{ loaded, stats, recordSession }}>{children}</Ctx.Provider>;
}

export function useHistory(): HistoryCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHistory must be inside HistoryProvider');
  return ctx;
}
