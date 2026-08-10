// Przypomnienia o wydarzeniach (dzień wcześniej, 9:00) — Faza 2 dokumentu.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Remindable { id: string; title: string; date: string; }

export function initNotifications() {
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
    Notifications.setNotificationChannelAsync('przypomnienia', {
      name: 'Przypomnienia',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.status === 'granted';
}

async function scheduleOne(e: Remindable): Promise<void> {
  const at = new Date(e.date + 'T09:00:00');
  at.setDate(at.getDate() - 1);
  if (at.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: e.id,
    content: {
      title: `📅 Jutro: ${e.title}`,
      body: 'Zajrzyj do zakładki Kalendarz po szczegóły.',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
}

/** Przebudowuje harmonogram przypomnień dla wszystkich przyszłych wydarzeń. */
export async function syncEventReminders(events: Remindable[]): Promise<boolean> {
  try {
    const ok = await ensurePermissions();
    if (!ok) return false;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const e of events) await scheduleOne(e);
    return true;
  } catch {
    return false;
  }
}
