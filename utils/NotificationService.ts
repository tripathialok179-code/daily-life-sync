import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks and requests notification permissions.
 */
export const requestNotificationPermissions = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted' || permission.receive !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== 'granted' || permission.receive !== 'granted') {
      console.warn('Local notifications permission denied by user.');
    }
  } catch (e) {
    console.error("Failed to request notification permissions:", e);
  }
};

/**
 * Schedules a local notification for a specific Date.
 */
export const scheduleReminder = async (id: number, title: string, body: string, date: Date) => {
  if (!Capacitor.isNativePlatform()) return;
  
  // Do not schedule notifications in the past
  if (date.getTime() <= Date.now()) return;

  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.receive !== 'granted') return;

    // Ensure the Android channel exists
    await LocalNotifications.createChannel({
      id: 'reminders',
      name: 'Reminders',
      description: 'Task and event reminders',
      importance: 5,
      visibility: 1,
      vibration: true
    });

    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id,
        schedule: { at: date, allowWhileIdle: true },
        channelId: 'reminders',
      }]
    });
  } catch (e) {
    console.error("Failed to schedule notification:", e);
  }
};

/**
 * Cancels a pending notification by its ID.
 */
export const cancelReminder = async (id: number) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (e) {
    console.error("Failed to cancel notification:", e);
  }
};

/**
 * Helper to convert UUID strings into the strict 32-bit integer that Android requires.
 */
export const generateNumericId = (idString: string): number => {
  let idHash = 0;
  for (let i = 0; i < idString.length; i++) {
    idHash = (idHash << 5) - idHash + idString.charCodeAt(i);
    idHash |= 0;
  }
  return Math.abs(idHash) % 2147483647;
};
