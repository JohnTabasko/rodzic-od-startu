import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Remindable {
  id: string;
  title: string;
  date: string;
}

const CHANNEL_ID = 'przypomnienia';
let initialized = false;

export function initNotifications(): void {
  if (initialized) return;
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Przypomnienia',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (current.status === 'denied') return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}

function reminderDate(isoDate: string): Date | null {
  const date = new Date(`${isoDate}T09:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() - 1);
  return date.getTime() > Date.now() ? date : null;
}

async function scheduleOne(event: Remindable): Promise<void> {
  const date = reminderDate(event.date);
  if (!date) return;

  await Notifications.scheduleNotificationAsync({
    identifier: event.id,
    content: {
      title: `📅 Jutro: ${event.title}`,
      body: 'Zajrzyj do zakładki Kalendarz po szczegóły.',
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

/** Rebuilds reminders for all future events. */
export async function syncEventReminders(events: Remindable[]): Promise<boolean> {
  try {
    initNotifications();
    if (!(await ensurePermissions())) return false;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Promise.all(events.map((event) => scheduleOne(event)));
    return true;
  } catch {
    return false;
  }
}
