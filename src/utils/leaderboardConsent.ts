import { useEffect, useSyncExternalStore } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLeaderboardChoiceStore, type LbChoice, type SaveStatus } from './leaderboardChoice';
import type { T } from './i18n';

export const leaderboardChoice = createLeaderboardChoiceStore(AsyncStorage);

/** undefined while loading (or signed out), null = not chosen yet, else the choice. */
export function useLeaderboardChoice(userId: string | null | undefined): LbChoice | null | undefined {
  useEffect(() => { if (userId) leaderboardChoice.load(userId); }, [userId]);
  return useSyncExternalStore(
    leaderboardChoice.subscribe,
    () => (userId ? leaderboardChoice.get(userId) : undefined),
  );
}

/** Save status of a choice made in this launch (undefined if none was made). */
export function useLeaderboardSaveStatus(userId: string | null | undefined): SaveStatus | undefined {
  return useSyncExternalStore(
    leaderboardChoice.subscribe,
    () => (userId ? leaderboardChoice.saveStatus(userId) : undefined),
  );
}

// Apply a choice (effective immediately in memory) and tell the user plainly
// if it could not be saved. "Try again" runs only on a tap — no automatic loop.
export async function chooseLeaderboard(userId: string, choice: LbChoice, t: T): Promise<void> {
  const result = await leaderboardChoice.setChoice(userId, choice);
  if (result === 'failed') alertSaveFailed(userId, choice, t);
}

export function alertSaveFailed(userId: string, choice: LbChoice, t: T): void {
  Alert.alert(t.lbSaveFailedTitle, choice === 'out' ? t.lbSaveFailedOut : t.lbSaveFailedIn, [
    { text: t.okBtn, style: 'cancel' },
    {
      text: t.lbRetryBtn,
      onPress: () => {
        leaderboardChoice.retrySave(userId).then(r => { if (r === 'failed') alertSaveFailed(userId, choice, t); });
      },
    },
  ]);
}
