import { Hono } from 'hono';

type Bindings = {
  NEWSAPI_KEY?: string;
  ALLOWED_ORIGIN?: string;       // Comma-separated list, e.g. "https://x.pages.dev,https://y.pages.dev"
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

// Resolve the allowed origin for an incoming request.
// Supports: wildcard "*", single URL, comma-separated list of URLs.
// Falls back to echoing the request origin if it's in the whitelist.
const resolveOrigin = (allowed: string | undefined, requestOrigin: string | null): string => {
  if (!allowed || allowed === '*') return '*';
  const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes('*')) return '*';
  if (requestOrigin && list.includes(requestOrigin)) return requestOrigin;
  return list[0] ?? '*';
};

const corsHeaders = (allowed: string | undefined, requestOrigin: string | null) => {
  const origin = resolveOrigin(allowed, requestOrigin);
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.options('*', (c) => {
  return c.body(null, 204, corsHeaders(c.env.ALLOWED_ORIGIN, c.req.header('origin') ?? null));
});

app.get('/health', (c) => {
  return c.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    200,
    corsHeaders(c.env.ALLOWED_ORIGIN, c.req.header('origin') ?? null),
  );
});

app.get('/weather', async (c) => {
  const headers = corsHeaders(c.env.ALLOWED_ORIGIN, c.req.header('origin') ?? null);
  const lat = Number(c.req.query('lat') ?? '37.7749');
  const lon = Number(c.req.query('lon') ?? '-122.4194');

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return c.json({ detail: 'Invalid lat/lon' }, 400, headers);
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
      headers,
    );
  } catch (err) {
    return c.json(
      { detail: `Weather service unavailable: ${(err as Error).message}` },
      502,
      headers,
    );
  }
});

app.get('/headlines', async (c) => {
  const headers = corsHeaders(c.env.ALLOWED_ORIGIN, c.req.header('origin') ?? null);
  const key = c.env.NEWSAPI_KEY;

  if (!key) {
    return c.json(
      {
        headlines: FALLBACK_HEADLINES,
        source: 'fallback',
        fetchedAt: new Date().toISOString(),
      },
      200,
      headers,
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
      headers,
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
      headers,
    );
  }
});

export default app;