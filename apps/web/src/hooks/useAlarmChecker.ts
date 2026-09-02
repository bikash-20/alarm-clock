import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { shouldTrigger } from '../lib/time';
import { fetchBriefingWithFallback } from '../lib/briefing';
import { playAlarmSound, stopAlarmSound, fireNotification } from '../lib/notifications';
import { useTTS } from './useTTS';

// Single source of trigger logic. Runs every second, fires at most once per
// alarm per minute by checking shouldTrigger (which gates on seconds === 0).

export const useAlarmChecker = (): void => {
  const alarms = useStore((s) => s.alarms);
  const settings = useStore((s) => s.settings);
  const triggerAlarm = useStore((s) => s.triggerAlarm);
  const activeAlarm = useStore((s) => s.activeAlarm);
  const tts = useTTS();

  // Keep latest values without re-running the interval every render.
  const stateRef = useRef({ alarms, settings, activeAlarm, triggerAlarm, tts });
  stateRef.current = { alarms, settings, activeAlarm, triggerAlarm, tts };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const { alarms, settings, activeAlarm, triggerAlarm, tts } = stateRef.current;

      // Don't double-fire while a briefing is already on screen.
      if (activeAlarm) return;

      for (const alarm of alarms) {
        if (!shouldTrigger(alarm, now)) continue;

        playAlarmSound();
        fireNotification('Executive Briefing', alarm.label || 'Your alarm is ringing');

        // Optimistic trigger: show overlay immediately with a placeholder, then
        // hydrate with real briefing. The overlay renders even if API fails.
        triggerAlarm(alarm, {
          weather: { city: settings.city, temperature: 0, condition: 'Loading…', humidity: 0, windSpeed: 0 },
          headlines: ['Fetching latest headlines…', '', ''],
          source: 'loading',
        });

        void (async () => {
          try {
            const briefing = await fetchBriefingWithFallback(settings);
            // Re-check: user might have dismissed during the network wait.
            if (stateRef.current.activeAlarm?.id !== alarm.id) return;
            useStore.setState({ briefing });
            void tts.speak(briefing, settings.city);
          } catch {
            stopAlarmSound();
          }
        })();

        break; // fire one alarm per tick
      }
    };

    // Run once immediately, then on every second boundary.
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
};