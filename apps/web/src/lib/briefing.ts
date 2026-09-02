import type { Briefing, Settings } from './types';

// Parallel fetch: weather + headlines. Single network round-trip from the user's
// perspective. Falls back to cached weather if API fails (last successful response).

let lastWeather: Briefing['weather'] | null = null;

export const fetchBriefing = async (settings: Settings): Promise<Briefing> => {
  const weatherUrl =
    `/api/weather?lat=${settings.latitude}&lon=${settings.longitude}`;
  const headlinesUrl = '/api/headlines';

  const [weatherRes, headlinesRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(headlinesUrl),
  ]);

  if (!weatherRes.ok) throw new Error(`weather: ${weatherRes.status}`);
  if (!headlinesRes.ok) throw new Error(`headlines: ${headlinesRes.status}`);

  const weather = (await weatherRes.json()) as Briefing['weather'];
  const headlinesPayload = (await headlinesRes.json()) as {
    headlines: string[];
    source: string;
  };

  lastWeather = weather;

  return {
    weather,
    headlines: headlinesPayload.headlines,
    source: headlinesPayload.source,
  };
};

export const fetchBriefingWithFallback = async (
  settings: Settings,
): Promise<Briefing> => {
  try {
    return await fetchBriefing(settings);
  } catch (err) {
    if (lastWeather) {
      return {
        weather: lastWeather,
        headlines: [
          'Briefing service temporarily unavailable',
          'Please check your internet connection',
          'Alarm will repeat at the next interval',
        ],
        source: 'fallback',
      };
    }
    throw err;
  }
};