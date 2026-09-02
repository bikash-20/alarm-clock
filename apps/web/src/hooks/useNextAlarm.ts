import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { nextOccurrence, formatCountdown } from '../lib/time';
import type { Alarm } from '../lib/types';

// Live countdown to the next enabled alarm. Updates every 30s — sub-minute
// resolution isn't useful for hours-out countdowns.

export const useNextAlarm = (): { alarmId: string | null; label: string; countdown: string } | null => {
  const alarms = useStore((s) => s.alarms);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const now = new Date();
  let best: { alarm: Alarm; ts: number } | null = null;

  for (const alarm of alarms) {
    const ts = nextOccurrence(alarm, now);
    if (ts === null) continue;
    if (!best || ts < best.ts) best = { alarm, ts };
  }

  if (!best) return null;
  return {
    alarmId: best.alarm.id,
    label: best.alarm.label || 'Alarm',
    countdown: formatCountdown(best.ts - now.getTime()),
  };
};