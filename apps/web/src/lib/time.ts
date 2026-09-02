import type { Alarm } from './types';

// Time math: single source of truth. Used by the checker hook and the
// "next alarm" banner. Pure functions only — no Date.now() side effects here.

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;

export const formatTime = (h: number, m: number): string => {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const format12h = (h: number, m: number): string => {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDays = (days: number[]): string => {
  if (days.length === 0) return 'One-time';
  if (days.length === 7) return 'Daily';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && [0, 6].every((d) => days.includes(d))) return 'Weekends';
  return days.map((d) => DAY_LABELS[d]).join(', ');
};

// Compute the next firing timestamp for an alarm, given current time.
// Returns null when the alarm is disabled or past snooze window.
export const nextOccurrence = (alarm: Alarm, now: Date): number | null => {
  if (!alarm.enabled) return null;

  // Snooze overrides schedule.
  if (alarm.snoozeUntil) {
    const snoozeTime = Date.parse(alarm.snoozeUntil);
    if (snoozeTime > now.getTime()) return snoozeTime;
  }

  const candidate = new Date(now);
  candidate.setHours(alarm.hour, alarm.minute, 0, 0);

  if (alarm.oneTime || alarm.days.length === 0) {
    // One-time: fires once at the next matching wall-clock time.
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate.getTime();
  }

  // Recurring: search forward up to 7 days for the next scheduled day-of-week.
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }

  for (let i = 0; i < 7; i++) {
    const day = candidate.getDay();
    if (alarm.days.includes(day)) return candidate.getTime();
    candidate.setDate(candidate.getDate() + 1);
  }
  return null;
};

// True when the alarm should fire *this second*. Compares only H:M, not seconds
// — the checker hook runs every second and we want it to fire on the 00-second mark.
export const shouldTrigger = (alarm: Alarm, now: Date): boolean => {
  if (!alarm.enabled) return false;
  if (alarm.snoozeUntil && Date.parse(alarm.snoozeUntil) > now.getTime()) return false;
  if (now.getSeconds() !== 0) return false;
  if (now.getHours() !== alarm.hour || now.getMinutes() !== alarm.minute) return false;

  if (alarm.oneTime || alarm.days.length === 0) return true;
  return alarm.days.includes(now.getDay());
};

export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return 'now';
  const totalMin = Math.floor(ms / MS_PER_MIN);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const MS_DAY = MS_PER_DAY;