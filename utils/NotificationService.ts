import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Utility to parse YYYY-MM-DD date string and optional HH:MM time into a local Date object.
 * Prevents UTC timezone shift issues.
 */
export const parseLocalDateAndTime = (dateStr: string, timeStr?: string | null): Date => {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];
  
  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const timeParts = timeStr.split(':').map(Number);
    hours = timeParts[0] || 0;
    minutes = timeParts[1] || 0;
  }
  
  return new Date(year, month, day, hours, minutes, 0, 0);
};

/**
 * Checks and requests notification permissions.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display === 'granted') {
      return true;
    } else {
      console.warn('Local notifications permission denied by user.');
      return false;
    }
  } catch (e) {
    console.error("Failed to request notification permissions:", e);
    return false;
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
    if (permission.display !== 'granted') return;

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

/**
 * Global synchronization helper for scheduling notifications for all active tasks.
 */
export const syncCapacitorNotifications = async (todos: any[]) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    await LocalNotifications.createChannel({
      id: 'reminders',
      name: 'Reminders',
      description: 'Task and event reminders',
      importance: 5,
      visibility: 1,
      vibration: true
    });

    const now = new Date();
    const notificationsToSchedule = [];

    for (const todo of todos) {
      if (todo.archived || !todo.time || !todo.dueDate || todo.completed) continue;

      const scheduleTime = parseLocalDateAndTime(todo.dueDate, todo.time);
      if (scheduleTime > now) {
        notificationsToSchedule.push({
          title: todo.title,
          body: todo.description || 'Task is due now! 🔔',
          id: generateNumericId(todo.id),
          schedule: { at: scheduleTime, allowWhileIdle: true },
          channelId: 'reminders',
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (e) {
    console.error("Failed to sync notifications:", e);
  }
};
