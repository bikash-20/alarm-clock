import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { stopAlarmSound } from '../lib/notifications';
import { useTTS } from '../hooks/useTTS';
import { useEffect } from 'react';

export const BriefingOverlay = () => {
  const activeAlarm = useStore((s) => s.activeAlarm);
  const briefing = useStore((s) => s.briefing);
  const dismissAlarm = useStore((s) => s.dismissAlarm);
  const snoozeAlarm = useStore((s) => s.snoozeAlarm);
  const settings = useStore((s) => s.settings);
  const tts = useTTS();

  // Speak when overlay opens (briefing arrives after, so we listen for it).
  useEffect(() => {
    if (activeAlarm && briefing && briefing.source !== 'loading') {
      void tts.speak(briefing, settings.city);
    }
    if (!activeAlarm) tts.stop();
  }, [activeAlarm, briefing, settings.city, tts]);

  const handleDismiss = () => {
    stopAlarmSound();
    tts.stop();
    dismissAlarm();
  };

  const handleSnooze = () => {
    if (!activeAlarm) return;
    stopAlarmSound();
    tts.stop();
    snoozeAlarm(activeAlarm.id, 5);
    dismissAlarm();
  };

  return (
    <AnimatePresence>
      {activeAlarm && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-title"
        >
          <motion.div
            className="briefing-card"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <header className="briefing-card__head">
              <p className="briefing-card__eyebrow">Executive briefing</p>
              <h2 id="briefing-title" className="briefing-card__title">
                {activeAlarm.label || 'Good morning'}
              </h2>
              <p className="briefing-card__time">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </header>

            <section className="weather-card" aria-label="Weather">
              <span className="weather-card__icon" aria-hidden="true">🌤️</span>
              <div>
                <p className="weather-card__temp">{briefing?.weather.temperature ?? '—'}°C</p>
                <p className="weather-card__city">{briefing?.weather.city ?? settings.city}</p>
                <p className="weather-card__cond">{briefing?.weather.condition ?? 'Loading…'}</p>
              </div>
            </section>

            <section aria-label="Headlines">
              <h3 className="briefing-section__title">Top tech headlines</h3>
              <ol className="headline-list">
                {(briefing?.headlines ?? ['', '', '']).map((h, i) => (
                  <li key={i} className="headline">
                    {h || <span className="headline--placeholder">Loading…</span>}
                  </li>
                ))}
              </ol>
              {briefing?.source === 'fallback' && (
                <p className="briefing-card__note">
                  Live headlines unavailable — showing cached briefing.
                </p>
              )}
            </section>

            <footer className="briefing-card__actions">
              <button className="primary-btn primary-btn--ghost" onClick={handleSnooze}>
                Snooze 5m
              </button>
              <button className="primary-btn" onClick={handleDismiss}>
                Dismiss
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};