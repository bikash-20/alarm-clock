import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import type { Weather } from '../lib/types';

// Compact weather chip shown on the dashboard. Fetches on mount and every
// 10 minutes. Silently degrades to a placeholder if offline.

const REFRESH_MS = 10 * 60_000;

export const WeatherWidget = () => {
  const city = useStore((s) => s.settings.city);
  const lat = useStore((s) => s.settings.latitude);
  const lon = useStore((s) => s.settings.longitude);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const data = (await res.json()) as Weather;
        if (!cancelled) {
          setWeather({ ...data, city });
          setLoading(false);
        }
      } catch (err) {
        console.warn('[WeatherWidget] fetch failed:', err);
        if (!cancelled) setLoading(false);
      }
    };

    void fetchWeather();
    const id = window.setInterval(fetchWeather, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [lat, lon, city]);

  if (loading) {
    return (
      <div className="weather-widget weather-widget--loading">
        <span className="weather-widget__icon" aria-hidden="true">⛅</span>
        <div className="weather-widget__body">
          <span className="weather-widget__temp loading-pulse">—°</span>
          <span className="weather-widget__cond loading-pulse">Fetching weather…</span>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="weather-widget weather-widget--error">
        <span className="weather-widget__icon" aria-hidden="true">🌫️</span>
        <div className="weather-widget__body">
          <span className="weather-widget__temp">—°</span>
          <span className="weather-widget__cond">Weather unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="weather-widget"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="weather-widget__icon" aria-hidden="true">
        {iconFor(weather.condition)}
      </span>
      <div className="weather-widget__body">
        <span className="weather-widget__temp">{weather.temperature}°C</span>
        <span className="weather-widget__cond">
          {weather.condition} · {weather.city}
        </span>
      </div>
    </motion.div>
  );
};

const iconFor = (condition: string): string => {
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sunny')) return '☀️';
  if (c.includes('partly')) return '⛅';
  if (c.includes('overcast') || c.includes('cloud')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('fog')) return '🌫️';
  return '🌤️';
};