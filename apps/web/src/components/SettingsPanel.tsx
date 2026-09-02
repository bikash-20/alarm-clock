import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { requestNotificationPermission } from '../lib/notifications';

type Props = { open: boolean; onClose: () => void };

// Common city presets — keeps the form simple. Power users can edit raw lat/lon.
// Grouped by region for scannability.
const PRESETS: { label: string; lat: number; lon: number; region: string }[] = [
  { region: 'South Asia', label: 'Dhaka, Bangladesh', lat: 23.8103, lon: 90.4125 },
  { region: 'South Asia', label: 'Delhi, India', lat: 28.6139, lon: 77.2090 },
  { region: 'South Asia', label: 'Mumbai, India', lat: 19.076, lon: 72.8777 },
  { region: 'South Asia', label: 'Bangalore, India', lat: 12.9716, lon: 77.5946 },
  { region: 'South Asia', label: 'Kolkata, India', lat: 22.5726, lon: 88.3639 },
  { region: 'South Asia', label: 'Chennai, India', lat: 13.0827, lon: 80.2707 },
  { region: 'South Asia', label: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011 },
  { region: 'South Asia', label: 'Colombo, Sri Lanka', lat: 6.9271, lon: 79.8612 },
  { region: 'South Asia', label: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.324 },
  { region: 'Americas', label: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { region: 'Americas', label: 'New York', lat: 40.7128, lon: -74.006 },
  { region: 'Europe', label: 'London', lat: 51.5074, lon: -0.1278 },
  { region: 'Europe', label: 'Berlin', lat: 52.52, lon: 13.405 },
  { region: 'Asia Pacific', label: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { region: 'Asia Pacific', label: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { region: 'Middle East', label: 'Dubai', lat: 25.2048, lon: 55.2708 },
];

export const SettingsPanel = ({ open, onClose }: Props) => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [notifStatus, setNotifStatus] = useState<string>('');

  const requestNotif = async () => {
    const result = await requestNotificationPermission();
    setNotifStatus(result);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          >
            <header className="drawer__head">
              <h2 className="drawer__title">Settings</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </header>

            <section className="settings-section">
              <h3 className="settings-section__title">Location</h3>
              <label className="field">
                <span className="field__label">City</span>
                <select
                  className="field__input"
                  value={settings.city}
                  onChange={(e) => {
                    const preset = PRESETS.find((p) => p.label === e.target.value);
                    if (preset) {
                      updateSettings({ city: preset.label, latitude: preset.lat, longitude: preset.lon });
                    } else {
                      updateSettings({ city: e.target.value });
                    }
                  }}
                >
                  {Object.entries(
                    PRESETS.reduce<Record<string, typeof PRESETS>>((acc, p) => {
                      (acc[p.region] ??= []).push(p);
                      return acc;
                    }, {}),
                  ).map(([region, cities]) => (
                    <optgroup key={region} label={region}>
                      {cities.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </section>

            <section className="settings-section">
              <h3 className="settings-section__title">Briefing voice</h3>
              <label className="field">
                <span className="field__label">Speech rate: {settings.ttsRate.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={settings.ttsRate}
                  onChange={(e) => updateSettings({ ttsRate: Number(e.target.value) })}
                />
              </label>
            </section>

            <section className="settings-section">
              <h3 className="settings-section__title">Notifications</h3>
              <button className="ghost-btn" onClick={requestNotif}>
                {notifStatus
                  ? `Status: ${notifStatus}`
                  : 'Enable browser notifications'}
              </button>
            </section>

            <section className="settings-section">
              <h3 className="settings-section__title">About</h3>
              <p className="settings-section__note">
                Weather from Open-Meteo. Headlines from NewsAPI (with offline fallback).
                Briefing spoken via your browser's built-in voice.
              </p>
            </section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};