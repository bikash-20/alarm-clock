// localStorage helpers — versioned keys for future migrations.

const KEY_ALARMS = 'alarm-clock:v1:alarms';
const KEY_SETTINGS = 'alarm-clock:v1:settings';

export const loadAlarms = (): unknown => {
  try {
    const raw = localStorage.getItem(KEY_ALARMS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveAlarms = (alarms: unknown): void => {
  try {
    localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));
  } catch {
    // Quota exceeded or storage unavailable — fail silently, app stays functional in-memory.
  }
};

export const loadSettings = (): unknown => {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSettings = (settings: unknown): void => {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
};