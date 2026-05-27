import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string) {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body });
}
