import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();

  if (!granted) {
    const permission = await requestPermission();
    granted = permission === 'granted';
  }

  return granted;
}

export async function sendReminderNotification(title: string, body: string): Promise<void> {
  const granted = await ensureNotificationPermission();

  if (granted) {
    sendNotification({ title, body });
  }
}
