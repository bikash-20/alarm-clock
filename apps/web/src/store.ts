import { create } from 'zustand';
import type { Alarm, Settings, Briefing } from './lib/types';
import { loadAlarms, saveAlarms, loadSettings, saveSettings } from './lib/storage';

// Defaults — single point of change.
const DEFAULT_SETTINGS: Settings = {
  city: 'San Francisco',
  latitude: 37.7749,
  longitude: -122.4194,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  theme: 'dark',
  voiceName: null,
};

const isAlarmArray = (x: unknown): x is Alarm[] =>
  Array.isArray(x) && x.every((a) => typeof a === 'object' && a !== null && 'id' in a);

const isSettings = (x: unknown): x is Settings =>
  typeof x === 'object' && x !== null && 'city' in x;

type State = {
  alarms: Alarm[];
  settings: Settings;
  activeAlarm: Alarm | null;
  briefing: Briefing | null;
  loading: boolean;
  // Actions
  addAlarm: (data: Omit<Alarm, 'id' | 'enabled' | 'snoozeUntil' | 'createdAt'>) => void;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  snoozeAlarm: (id: string, minutes?: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  triggerAlarm: (alarm: Alarm, briefing: Briefing) => void;
  dismissAlarm: () => void;
};

export const useStore = create<State>((set, get) => ({
  alarms: (() => {
    const loaded = loadAlarms();
    return isAlarmArray(loaded) ? loaded : [];
  })(),
  settings: (() => {
    const loaded = loadSettings();
    return isSettings(loaded) ? { ...DEFAULT_SETTINGS, ...loaded } : DEFAULT_SETTINGS;
  })(),
  activeAlarm: null,
  briefing: null,
  loading: false,

  addAlarm: (data) => {
    const alarm: Alarm = {
      ...data,
      id: crypto.randomUUID(),
      enabled: true,
      snoozeUntil: null,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const next = [...s.alarms, alarm];
      saveAlarms(next);
      return { alarms: next };
    });
  },

  updateAlarm: (id, patch) => {
    set((s) => {
      const next = s.alarms.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveAlarms(next);
      return { alarms: next };
    });
  },

  deleteAlarm: (id) => {
    set((s) => {
      const next = s.alarms.filter((a) => a.id !== id);
      saveAlarms(next);
      return { alarms: next };
    });
  },

  toggleAlarm: (id) => {
    set((s) => {
      const next = s.alarms.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a,
      );
      saveAlarms(next);
      return { alarms: next };
    });
  },

  snoozeAlarm: (id, minutes = 5) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString();
    get().updateAlarm(id, { snoozeUntil: until });
  },

  updateSettings: (patch) => {
    set((s) => {
      const next = { ...s.settings, ...patch };
      saveSettings(next);
      // Apply theme to document immediately.
      document.documentElement.dataset.theme = next.theme;
      return { settings: next };
    });
  },

  triggerAlarm: (alarm, briefing) => {
    set({ activeAlarm: alarm, briefing, loading: false });
    // Disable one-time alarms after firing.
    if (alarm.oneTime || alarm.days.length === 0) {
      get().updateAlarm(alarm.id, { enabled: false });
    }
  },

  dismissAlarm: () => {
    const { activeAlarm } = get();
    if (activeAlarm?.snoozeUntil && Date.parse(activeAlarm.snoozeUntil) > Date.now()) {
      // Snoozed — clear snooze flag so it can re-fire on schedule next time.
      get().updateAlarm(activeAlarm.id, { snoozeUntil: null });
    }
    set({ activeAlarm: null, briefing: null });
  },
}));