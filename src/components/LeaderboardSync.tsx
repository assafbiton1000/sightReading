import { useEffect, useRef } from 'react';
import { useHistory } from '../context/HistoryContext';
import { useProfile } from '../context/ProfileContext';
import { pushLeaderboardScore } from '../utils/leaderboard';

// Mirrors the signed-in user's local point total to the global leaderboard.
// Renders nothing — it exists so every user who signs in appears on the board
// automatically, without any screen having to remember to push. Debounced so
// a practice session's point trickle becomes a single write, and re-pushed on
// sign-in so a fresh device uploads its locally accumulated points.
export default function LeaderboardSync() {
  const { loaded, points } = useHistory();
  const { profile } = useProfile();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loaded || !profile) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushLeaderboardScore(profile.id, profile.name, points);
    }, 2000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [loaded, points, profile]);

  return null;
}
