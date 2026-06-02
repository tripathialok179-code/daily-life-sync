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
    hash = hash | 0; // Strict 32-bit signed integer conversion
  }
  const finalId = Math.abs(hash) % 2147483647;
  return finalId === 0 ? 1 : finalId; // Guarantee strictly > 0 and < max 32-bit
};

/**
 * Checks and strictly requests native notification permissions.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      const granted = request.display === 'granted';
      if (granted) {
        // Immediate 5-second test notification
        const testDate = new Date();
        testDate.setSeconds(testDate.getSeconds() + 5);
        scheduleReminder(999999999, "Permissions Working!", "Native alarm successfully registered.", testDate);
      }
      return granted;
    }
    return true;
  } catch (e: any) {
    console.warn("Failed to request notification permissions:", e);
    alert(`Notification Error: ${JSON.stringify(e.message || e)}`);
    return false;
  }
};

/**
 * Schedules an exact offline alarm using the native Android OS.
 */
export const scheduleReminder = async (id: number, title: string, body: string, date: Date) => {
  if (!Capacitor.isNativePlatform()) return;
  
  const now = new Date();
  console.log(`[Safety Log] Native scheduling calculation: Current Time: ${now.toISOString()} | Target Time: ${date.toISOString()}`);
  
  // Do not schedule if the date is in the past
  if (date.getTime() <= now.getTime()) {
      console.warn(`[Safety Log] Dropped native notification ${id} because it evaluates to the past.`);
      return;
  }

  try {
    // Rotate channel ID to bypass OS permanent caching of old configurations
    await LocalNotifications.createChannel({
      id: 'daily-life-tasks-v1',
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
          channelId: 'daily-life-tasks-v1'
        }
      ]
    });
    console.log(`[NotificationService] Scheduled native notification ${id} for ${date.toISOString()}`);
  } catch (e: any) {
    console.error(`[NotificationService] Failed to schedule reminder ${id}:`, e);
    alert(`Notification Error: ${JSON.stringify(e.message || e)}`);
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
  } catch (e: any) {
    console.error(`[NotificationService] Failed to cancel reminder ${id}:`, e);
    alert(`Notification Error: ${JSON.stringify(e.message || e)}`);
  }
};
