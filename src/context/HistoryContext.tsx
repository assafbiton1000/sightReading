import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from './ProfileContext';
import { fetchUserStats, pushUserStats } from '../utils/userStats';
import { pushLeaderboardScore } from '../utils/leaderboard';
import { earnedRankIndex, RANK_MIN_ACCURACY } from '../constants/ranks';

export type SessionMode = 'practice' | 'playback' | 'learning';

interface SessionRecord {
  date: string;      // local calendar day, 'YYYY-MM-DD'
  timestamp: number;
  mode: SessionMode;
  minutes: number;
  correct?: number;  // practice sessions only — drives accuracy
  total?: number;
  level?: number;    // practice sessions only — the sight-reading level, drives rank progression
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
  /** Running total, in points — 1 per tracked minute + 2 per rewarded-ad watch.
   * Persisted separately from `records` so it never shrinks when old records
   * age out of the 90-day retention window. */
  points: number;
  recordSession: (input: { mode: SessionMode; minutes: number; correct?: number; total?: number; level?: number }) => void;
  /** Call when the user finishes watching a rewarded ad on the Support screen. */
  recordAdWatch: () => void;
}

const STORAGE_KEY = '@sightreading/history';
const POINTS_STORAGE_KEY = '@sightreading/points';
const RETENTION_DAYS = 90;
const POINTS_PER_MINUTE = 1;
export const POINTS_PER_AD = 2;

// Debounce for mirroring local changes up to the server — coalesces a practice
// session's point trickle (and its record write) into a single upload.
const SERVER_SYNC_DELAY = 1500;

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

// The streak counts distinct calendar days trained (each local midnight-to-
// midnight day counts once, no matter how many sessions happen within it).
// Skipping a day never zeroes it or breaks a "chain" — it just doesn't add
// another day until you train again, so the number only ever holds or grows.
function computeStreak(dayStrs: Set<string>): number {
  return dayStrs.size;
}

function isSessionRecord(r: unknown): r is SessionRecord {
  return !!r && typeof r === 'object' && typeof (r as SessionRecord).timestamp === 'number';
}

// Unions local and server records by timestamp (each session has a unique ms
// timestamp), keeping the local copy on a tie, then re-applies the 90-day
// retention window so the merged set can't grow unbounded on the server.
function mergeRecords(local: SessionRecord[], server: unknown[]): SessionRecord[] {
  const byTs = new Map<number, SessionRecord>();
  for (const r of server) if (isSessionRecord(r)) byTs.set(r.timestamp, r);
  for (const r of local) byTs.set(r.timestamp, r); // local wins ties
  const cutoff = toDayStr(addDays(new Date(), -RETENTION_DAYS));
  return [...byTs.values()].filter(r => r.date >= cutoff).sort((a, b) => a.timestamp - b.timestamp);
}

const Ctx = createContext<HistoryCtx | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { profile, syncRank } = useProfile();
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [points, setPoints] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // The user id whose server stats we've already pulled + merged. Gates the
  // write-through effect so it can never fire (and clobber the server) before
  // hydration — the bug that used to zero a user's leaderboard score on reinstall.
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  // Latest local state, read inside the async hydration without re-triggering it.
  const recordsRef = useRef(records);
  const pointsRef = useRef(points);
  recordsRef.current = records;
  pointsRef.current = points;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(POINTS_STORAGE_KEY),
    ])
      .then(([rawRecords, rawPoints]) => {
        if (cancelled) return;
        if (rawRecords) {
          try {
            const parsed = JSON.parse(rawRecords);
            if (Array.isArray(parsed)) setRecords(parsed);
          } catch (_) {}
        }
        if (rawPoints) {
          const n = parseFloat(rawPoints);
          if (!Number.isNaN(n)) setPoints(n);
        }
      })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Server hydration: on sign-in, pull the user's stored stats and merge them
  // into local state (union of records, max of points — a reinstall starts
  // local at 0, so the server value wins and nothing is lost). The merged
  // result is then written back through the effect below. Runs once per user.
  useEffect(() => {
    if (!loaded) return;
    const uid = profile?.id ?? null;
    if (!uid) { setHydratedUserId(null); return; } // signed out — keep local data as-is
    if (hydratedUserId === uid) return;
    let cancelled = false;
    (async () => {
      const server = await fetchUserStats(uid);
      if (cancelled) return;
      const merged = mergeRecords(recordsRef.current, server?.records ?? []);
      // Points can exceed record-minutes (rewarded ads add points with no record),
      // so never reconstruct purely from records — take the largest of every
      // source instead, which recovers minute-points from the merged records too.
      const minutePoints = merged.reduce((sum, r) => sum + r.minutes * POINTS_PER_MINUTE, 0);
      const mergedPoints = Math.max(pointsRef.current, server?.points ?? 0, minutePoints);
      setRecords(merged);
      setPoints(mergedPoints);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      AsyncStorage.setItem(POINTS_STORAGE_KEY, String(mergedPoints)).catch(() => {});
      setHydratedUserId(uid);
    })();
    return () => { cancelled = true; };
  }, [loaded, profile, hydratedUserId]);

  // Write-through: mirror local changes up to the server (private stats + the
  // public leaderboard projection). Gated on hydratedUserId so it only ever
  // runs for a user whose server data we've already merged in — this is the
  // single writer of the leaderboard, replacing the old duplicate push effects.
  useEffect(() => {
    if (!profile || hydratedUserId !== profile.id) return;
    const snapshotPoints = points;
    const snapshotRecords = records;
    const id = setTimeout(() => {
      pushUserStats(profile.id, snapshotPoints, snapshotRecords);
      pushLeaderboardScore(profile.id, profile.name, snapshotPoints);
    }, SERVER_SYNC_DELAY);
    return () => clearTimeout(id);
  }, [profile, hydratedUserId, points, records]);

  // Rank earned from qualifying (≥90%) sight-reading sessions: the count drives
  // the Beginner→Intermediate step, the hardest completed level drives the rest.
  const earnedRank = useMemo(() => {
    let qualifyingCount = 0;
    let maxQualifyingLevel = 0;
    for (const r of records) {
      if (r.mode !== 'practice' || typeof r.correct !== 'number' || typeof r.total !== 'number' || r.total <= 0) continue;
      if (r.correct / r.total < RANK_MIN_ACCURACY) continue;
      qualifyingCount++;
      if (typeof r.level === 'number') maxQualifyingLevel = Math.max(maxQualifyingLevel, r.level);
    }
    return earnedRankIndex({ qualifyingCount, maxQualifyingLevel });
  }, [records]);

  // Push a newly-earned (higher) rank to the server. The sync-rank function only
  // ever raises the stored rank, so re-sending is harmless; the ref just avoids
  // redundant calls. Resets when the signed-in user changes.
  const rankSync = useRef<{ uid: string | null; synced: number }>({ uid: null, synced: -1 });
  useEffect(() => {
    if (!profile || hydratedUserId !== profile.id) return;
    const st = rankSync.current;
    if (st.uid !== profile.id) { st.uid = profile.id; st.synced = -1; }
    if (earnedRank <= st.synced) return;
    st.synced = earnedRank;
    const id = setTimeout(() => { syncRank(earnedRank); }, SERVER_SYNC_DELAY);
    return () => clearTimeout(id);
  }, [profile, hydratedUserId, earnedRank, syncRank]);

  const addPoints = useCallback((amount: number) => {
    setPoints(prev => {
      const next = prev + amount;
      AsyncStorage.setItem(POINTS_STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordSession = useCallback((input: { mode: SessionMode; minutes: number; correct?: number; total?: number; level?: number }) => {
    if (!(input.minutes > 0)) return;
    const now = new Date();
    const record: SessionRecord = {
      date: toDayStr(now),
      timestamp: now.getTime(),
      mode: input.mode,
      minutes: input.minutes,
      correct: input.correct,
      total: input.total,
      level: input.level,
    };
    setRecords(prev => {
      const cutoff = toDayStr(addDays(now, -RETENTION_DAYS));
      const next = [...prev.filter(r => r.date >= cutoff), record];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    addPoints(input.minutes * POINTS_PER_MINUTE);
  }, [addPoints]);

  const recordAdWatch = useCallback(() => {
    addPoints(POINTS_PER_AD);
  }, [addPoints]);

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

  return <Ctx.Provider value={{ loaded, stats, points, recordSession, recordAdWatch }}>{children}</Ctx.Provider>;
}

export function useHistory(): HistoryCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHistory must be inside HistoryProvider');
  return ctx;
}
