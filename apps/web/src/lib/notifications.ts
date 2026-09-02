// Browser notifications + audio alert. Both are best-effort — browsers gate them
// behind permissions and may silently fail.

const ALARM_SOUND_URL = '/alarm.wav';

let audioEl: HTMLAudioElement | null = null;

const getAudio = (): HTMLAudioElement => {
  if (!audioEl) {
    audioEl = new Audio(ALARM_SOUND_URL);
    audioEl.loop = true;
    audioEl.preload = 'auto';
  }
  return audioEl;
};

export const playAlarmSound = (): void => {
  try {
    void getAudio().play();
  } catch {
    // Autoplay blocked — user gesture required.
  }
};

export const stopAlarmSound = (): void => {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
};

export const fireNotification = (title: string, body: string): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon.svg', tag: 'alarm' });
  } catch {
    // ignore
  }
};