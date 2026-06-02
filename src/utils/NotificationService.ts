import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Deterministically converts a string (like a UUID) into a safe 32-bit positive integer.
 * Android requires integer IDs for notifications.
 */
export const stringToNumericId = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 2147483647; // Ensure positive within 32-bit limit
};

/**
 * Checks and strictly requests native notification permissions.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted' || status.receive !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted' && request.receive === 'granted';
    }
    return true;
  } catch (e) {
    console.warn("Failed to request notification permissions:", e);
    return false;
  }
};

/**
 * Schedules an exact offline alarm using the native Android OS.
 */
export const scheduleReminder = async (id: number, title: string, body: string, date: Date) => {
  if (!Capacitor.isNativePlatform()) return;
  
  // Do not schedule if the date is in the past
  if (date.getTime() <= new Date().getTime()) {
      return;
  }

  try {
    // Android 13+ requirement: Channels
    await LocalNotifications.createChannel({
      id: 'reminders',
      name: 'Reminders',
      description: 'High priority task reminders',
      importance: 5,
      visibility: 1,
      vibration: true
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: date, allowWhileIdle: true },
          channelId: 'reminders'
        }
      ]
    });
    console.log(`[NotificationService] Scheduled native notification ${id} for ${date.toISOString()}`);
  } catch (e) {
    console.error(`[NotificationService] Failed to schedule reminder ${id}:`, e);
  }
};

/**
 * Cancels a pending notification natively via the Android OS.
 */
export const cancelReminder = async (id: number) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id }]
    });
    console.log(`[NotificationService] Cancelled native notification ${id}`);
  } catch (e) {
    console.error(`[NotificationService] Failed to cancel reminder ${id}:`, e);
  }
};
