// Domain types — single source of truth for the alarm data model.

export type Alarm = {
  id: string;
  hour: number;        // 0-23
  minute: number;      // 0-59
  days: number[];      // 0=Sun..6=Sat; [] = one-time
  label: string;
  enabled: boolean;
  oneTime: boolean;
  snoozeUntil: string | null;  // ISO timestamp
  createdAt: string;
};

export type Settings = {
  city: string;
  latitude: number;
  longitude: number;
  ttsRate: number;     // 0.1 - 2.0
  ttsPitch: number;    // 0 - 2
  theme: 'dark' | 'light';
  voiceName: string | null;
};

export type Weather = {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
};

export type Briefing = {
  weather: Weather;
  headlines: string[];
  source: string;
};