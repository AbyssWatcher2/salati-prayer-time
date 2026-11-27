import type { PrayerId } from '../types/prayer';

export type NotificationPermState = NotificationPermission | 'unsupported';

export function getNotificationPermission(): NotificationPermState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function triggerDeviceVibration(overdue: boolean): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(overdue ? [280, 120, 280, 120, 400] : [220, 120, 220]);
  }
}

export interface PrayerNotificationPayload {
  title: string;
  body: string;
  dateKey: string;
  prayerIds: PrayerId[];
  overdue: boolean;
}

export async function sendPrayerNotification(payload: PrayerNotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & {
    vibrate?: number[];
    renotify?: boolean;
    actions?: Array<{ action: string; title: string }>;
  } = {
    body: payload.body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: 'salati-prayer-reminder',
    renotify: true,
    requireInteraction: true,
    vibrate: payload.overdue ? [280, 120, 280, 120, 400] : [220, 120, 220],
    data: {
      dateKey: payload.dateKey,
      prayerIds: payload.prayerIds,
    },
    actions: [
      { action: 'mark-prayed', title: '✓ صليت' },
      { action: 'snooze-15', title: 'بعد ربع ساعة' },
    ],
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(payload.title, options);
        return true;
      }
    } catch {
      // Fallback below
    }
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: './icons/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'salati-prayer-reminder',
    });
    return true;
  } catch {
    return false;
  }
}
