import * as Notifications from 'expo-notifications';
import type { UserProfile } from '../../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAILY_RITUAL_NOTIFICATION_ID = 'dodaat_daily_ritual';
const GOLD_CARD_NOTIFICATION_ID = 'dodaat_gold_card';

const NOTIFICATION_TIMES = {
  morning: { hour: 7, minute: 30 },
  midday: { hour: 12, minute: 0 },
  evening: { hour: 19, minute: 0 },
} as const;

const DAILY_NOTIFICATION_COPY = 'Your cards are ready. Do one day at a time.';

/**
 * Request notification permissions.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule (or reschedule) the daily ritual trigger notification.
 */
export async function scheduleDailyRitual(
  time: UserProfile['notificationTime']
): Promise<void> {
  // Cancel existing
  await Notifications.cancelScheduledNotificationAsync(DAILY_RITUAL_NOTIFICATION_ID);

  const { hour, minute } = NOTIFICATION_TIMES[time];

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_RITUAL_NOTIFICATION_ID,
    content: {
      title: 'dodaat',
      body: DAILY_NOTIFICATION_COPY,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Send an immediate local notification when a gold card (voice note) arrives.
 */
export async function notifyGoldCardArrival(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: GOLD_CARD_NOTIFICATION_ID,
    content: {
      title: 'dodaat',
      body: 'Someone needs a moment of your time.',
      sound: false,
    },
    trigger: null, // Immediate
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
