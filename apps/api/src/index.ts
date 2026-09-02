import { Hono } from 'hono';

type Bindings = {
  NEWSAPI_KEY?: string;
  ALLOWED_ORIGIN?: string;
};

// Open-Meteo WMO weather code → human condition.
const WMO: Record<number, string> = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  71: 'Slight Snow', 73: 'Moderate Snow', 80: 'Rain Showers',
  95: 'Thunderstorm', 99: 'Thunderstorm with Hail',
};

const FALLBACK_HEADLINES = [
  'AI Research Lab Announces Breakthrough in Multimodal Models',
  'Tech Giants Report Strong Quarterly Earnings Despite Market Volatility',
  'New Open-Source Framework Gains 10k GitHub Stars in 24 Hours',
];

const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Date': '86400',
});

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.options('*', (c) => {
  const origin = c.env.ALLOWED_ORIGIN ?? '*';
  return c.body(null, 204, cors(origin));
});

app.get('/health', (c) => {
  const origin = c.env.ALLOWED_ORIGIN ?? '*';
  return c.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    200, cors(origin),
  );
});

app.get('/weather', async (c) => {
  const origin = c.env.ALLOWED_ORIGIN ?? '*';
  const lat = Number(c.req.query('lat') ?? '37.7749');
  const lon = Number(c.req.query('lon') ?? '-122.4194');

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return c.json({ detail: 'Invalid lat/lon' }, 400, cors(origin));
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`Open-Meteo ${resp.status}`);
    const data = (await resp.json()) as {
      current: {
        temperature_2m: number;
        weather_code: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
      };
    };

    return c.json(
      {
        city: 'Your Location',
        temperature: Math.round(data.current.temperature_2m),
        condition: WMO[data.current.weather_code] ?? 'Unknown',
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
      },
      200,
      cors(origin),
    );
  } catch (err) {
    return c.json(
      { detail: `Weather service unavailable: ${(err as Error).message}` },
      502,
      cors(origin),
    );
  }
});

app.get('/headlines', async (c) => {
  const origin = c.env.ALLOWED_ORIGIN ?? '*';
  const key = c.env.NEWSAPI_KEY;

  if (!key) {
    return c.json(
      {
        headlines: FALLBACK_HEADLINES,
        source: 'fallback',
        fetchedAt: new Date().toISOString(),
      },
      200,
      cors(origin),
    );
  }

  try {
    const url =
      `https://newsapi.org/v2/top-headlines?category=technology&pageSize=3&apiKey=${key}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`NewsAPI ${resp.status}`);
    const data = (await resp.json()) as {
      status: string;
      articles?: { title?: string | null }[];
      message?: string;
    };

    if (data.status !== 'ok') throw new Error(data.message ?? 'NewsAPI error');

    const titles = (data.articles ?? [])
      .slice(0, 3)
      .map((a) => a.title)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);

    const headlines = [...titles];
    while (headlines.length < 3) {
      headlines.push(FALLBACK_HEADLINES[headlines.length % FALLBACK_HEADLINES.length]!);
    }

    return c.json(
      { headlines, source: 'newsapi', fetchedAt: new Date().toISOString() },
      200,
      cors(origin),
    );
  } catch (err) {
    return c.json(
      {
        headlines: FALLBACK_HEADLINES,
        source: 'fallback',
        fetchedAt: new Date().toISOString(),
        error: (err as Error).message,
      },
      200,
      cors(origin),
    );
  }
});

export default app;