import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily practice reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// This app only ever schedules this one recurring reminder, so cancelling
// everything before rescheduling is simpler and just as correct as tracking
// a notification id to cancel selectively.
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyReminder(time: string, title: string, body: string): Promise<void> {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  await cancelDailyReminder();
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
}

// Reconciles the OS-level scheduled notification with the user's settings.
// Called whenever `enabled` or `time` changes: turning the switch off (or
// permission being denied) cancels everything; turning it on or changing the
// time cancels-then-reschedules via scheduleDailyReminder.
export async function syncDailyReminder(
  enabled: boolean,
  time: string,
  title: string,
  body: string
): Promise<'scheduled' | 'cancelled' | 'permission-denied'> {
  if (!enabled) {
    await cancelDailyReminder();
    return 'cancelled';
  }
  const granted = await requestNotificationPermission();
  if (!granted) {
    await cancelDailyReminder();
    return 'permission-denied';
  }
  await scheduleDailyReminder(time, title, body);
  return 'scheduled';
}
