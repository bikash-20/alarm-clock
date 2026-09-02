# Briefing — Executive Alarm Clock

> **Wake up informed.** When your alarm fires, the app reads you the weather and today's top tech headlines aloud — using your browser's built-in voice.

A full-stack PWA that runs entirely on Cloudflare's free tier. No servers to manage, no cold starts, $0/month at any scale you'd reasonably use.

---

## Program Context

This project was built as **Task 5 of the Arithmatrix Virtual Internship Program (AVIP) 2026**, delivered by **B.Y.T.E — Build Your Tech Expertise**, the official R&D and educational wing of the Arithmatrix ecosystem.

The brief: take a PRD for a React + Vite + FastAPI alarm app and ship it — from monorepo scaffold to live deployment on free-tier infrastructure.

**What AVIP 2026 trains you to do:**
- Read a real product requirements document
- Make senior engineering decisions (single platform vs split, build tooling, state management)
- Deploy a production app on actual free-tier infrastructure
- Treat UI/UX as a first-class concern, not an afterthought

> *"Traditional education teaches you theory; we train you for the deep-tech trenches. The industry doesn't care about what you memorized; it cares about what you can execute, deploy, and scale."* — AVIP 2026, B.Y.T.E

---

## Features

- **Unlimited alarms** — recurring (daily, weekdays, weekends, custom days) or one-time
- **Live weather** for your city (Open-Meteo, no API key needed)
- **Top 3 tech headlines** at alarm time (NewsAPI, with offline fallback)
- **Voice briefing** — browser TTS reads the weather + headlines aloud
- **Snooze 5 min** / **Dismiss** buttons
- **Installable PWA** — works on iOS, Android, desktop, tablet
- **Dark & light themes** with a hand-tuned Dark Academia / Coastal Earth palette
- **Offline-capable** — alarm sound, shell, and previously-cached briefings all work without network
- **localStorage persistence** — alarms survive refreshes and restarts
- **Browser notifications** when alarms fire (with permission)
- **South Asian city presets** — Dhaka, Delhi, Mumbai, Bangalore, Kolkata, Chennai, Karachi, Colombo, Kathmandu

---

## Architecture

```
+--------------------------------------------------------------+
|                       Cloudflare Edge                         |
|  +------------------------+   +--------------------------+   |
|  |  Pages (Frontend)      |   |  Workers (Backend API)   |   |
|  |  React + Vite SPA      |   |  Hono on Workers         |   |
|  |  - PWA / Service Worker|   |  - /api/weather          |   |
|  |  - Static assets + CDN |   |  - /api/headlines        |   |
|  |  - HTTPS by default    |   |  - /api/health           |   |
|  +------------------------+   +--------------------------+   |
+--------------------------------------------------------------+
              |                              |
              |  HTTPS                       |  HTTPS
              |  /api/* -> Worker            |  Upstream fetches
              v                              v
       +--------------+              +----------------+
       |   Browser    |              |  Open-Meteo    |
       |  - Web Speech|              |  NewsAPI       |
       |  - localStorage             +----------------+
       |  - Notifications
       +--------------+
```

**One platform, one URL, zero cold starts.** Single deploy, global edge.

### Why Cloudflare Workers instead of the PRD's Python FastAPI?

- Workers runs JavaScript/TypeScript natively; Python on Workers is still experimental
- Sub-millisecond cold starts (Render free tier = 30-50s cold start)
- 100k requests/day free
- The weather/headlines proxy is the perfect shape for Workers — fetch external APIs, return JSON

### Trade-offs made

| PRD requirement | What I shipped | Why |
|---|---|---|
| Vercel + Render (split deploy) | Cloudflare Pages + Workers | Single platform, no cold starts, $0 |
| FastAPI (Python) | Hono on Workers (TypeScript) | Same API shape, faster, no Python runtime needed |
| 5+ separate hooks + Context API | Zustand store + 4 focused hooks | Less re-rendering, simpler mental model |
| TailwindCSS / styled-components | One hand-tuned `styles.css` with CSS variables | Smaller bundle, more control over the palette |
| External `requirements.txt` | All TS, all in one monorepo | One `npm install`, one `npm run dev` |

---

## Tech Stack

### Frontend
- **React 18** — UI framework, components
- **Vite 6** — build tool, dev server with HMR
- **TypeScript 5** — strict mode, end-to-end type safety
- **Zustand 5** — state management (one 80-line file replaces PRD's Context + 5 hooks)
- **Framer Motion** — spring-physics entrances for the briefing overlay and modal
- **Web Speech API** — `speechSynthesis` for the voice briefing (built into every browser)
- **Service Worker** — offline shell, PWA installation, push notifications
- **Notification API** — system notifications on alarm trigger
- **HTML5 Audio** — alarm tone playback

### Backend
- **Hono 4** — minimal API framework on Cloudflare Workers
- **Cloudflare Workers** — serverless edge runtime, V8 isolates

### External APIs (proxied through backend)
- **Open-Meteo** — weather (no API key required)
- **NewsAPI** — tech headlines (optional; static fallback if no key)

### Deployment
- **Cloudflare Pages** — frontend hosting + global CDN
- **Cloudflare Workers** — backend API hosting
- **Wrangler** — deploy CLI

---

## Monorepo Structure

```
alarm-clock/
├── apps/
│   ├── api/                          # Cloudflare Worker
│   │   ├── src/
│   │   │   └── index.ts             # ~140 LOC, 3 routes + CORS + fallback
│   │   ├── wrangler.toml            # Worker config + ALLOWED_ORIGIN
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # React + Vite SPA
│       ├── public/
│       │   ├── manifest.webmanifest  # PWA manifest with shortcuts
│       │   ├── sw.js                 # Service worker (offline shell)
│       │   ├── alarm.wav             # Synthesized alert tone
│       │   ├── apple-touch-icon.png  # iOS home screen
│       │   ├── favicon-{16,32,48}.png
│       │   └── icons/
│       │       ├── icon.svg          # Master vector logo
│       │       ├── icon-{192,512,1024}.png
│       │       └── icon-maskable-512.png  # Android adaptive
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── store.ts              # Zustand store (~80 lines)
│       │   ├── styles.css            # Single hand-tuned stylesheet
│       │   ├── components/
│       │   │   ├── Header.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── AlarmCard.tsx
│       │   │   ├── AlarmModal.tsx
│       │   │   ├── BriefingOverlay.tsx
│       │   │   ├── SettingsPanel.tsx
│       │   │   ├── InstallPrompt.tsx
│       │   │   └── WeatherWidget.tsx
│       │   ├── hooks/
│       │   │   ├── useAlarmChecker.ts  # 1s interval trigger loop
│       │   │   ├── useTTS.ts           # Web Speech wrapper
│       │   │   ├── useTheme.ts
│       │   │   ├── useNextAlarm.ts     # Live countdown banner
│       │   │   └── useInstallPrompt.ts # PWA install capture
│       │   └── lib/
│       │       ├── types.ts
│       │       ├── time.ts          # Pure time-math functions
│       │       ├── briefing.ts      # Parallel API fetch
│       │       ├── storage.ts       # localStorage helpers
│       │       └── notifications.ts # Audio + notification helpers
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── package.json                     # Workspaces + dev/build/deploy scripts
└── README.md
```

**Total authored code: ~1,000 lines** — the senior-engineer bar.

---

## Local Development

Requires **Node 20+**. From the project root:

```bash
npm install      # one-time
npm run dev      # API on :8787, web on :5173
```

Open http://localhost:5173 — the Vite dev server proxies `/api/*` to the local Worker.

### Optional: live headlines

By default, `/api/headlines` returns static fallback headlines. To use live NewsAPI headlines:

```bash
echo 'NEWSAPI_KEY=your_key_here' > apps/api/.dev.vars
```

Get a free key at https://newsapi.org (100 requests/day).

---

## Deploy to Cloudflare

Free tier. No credit card. ~10 minutes total.

### One-time setup

1. Sign up at https://dash.cloudflare.com/sign-up
2. Login Wrangler: `npx wrangler login` (opens browser)

### Deploy the API

```bash
cd apps/api
npx wrangler deploy
```

Note the URL — e.g. `https://alarm-clock-api.YOUR-SUBDOMAIN.workers.dev`

### Deploy the frontend

```bash
cd ../web
npm run build
npx wrangler pages deploy dist --project-name alarm-clock
```

First deploy creates the Pages project automatically. Note the URL — e.g. `https://YOUR-PROJECT.pages.dev`.

### Wire them together

Edit `apps/api/wrangler.toml`. The default `ALLOWED_ORIGIN = "*"` works for public deployments since the API has no auth/cookies. For stricter security, list your exact Pages URLs comma-separated.

### Optional: add NewsAPI key (Cloudflare dashboard)

1. Cloudflare dashboard → **Workers & Pages** → `alarm-clock-api` → **Settings** → **Variables and Secrets**
2. Add variable: `NEWSAPI_KEY` = your key
3. Re-deploy the API

---

## Testing the Briefing Pipeline

1. Open your deployed app
2. Open Settings → **Location** → pick a city (Dhaka, Delhi, etc.)
3. Click **Add alarm**, set it for **1 minute from now**, click Create
4. When the alarm fires:
   - Audible alert tone plays
   - Full-screen briefing overlay slides in with weather + 3 headlines
   - Browser TTS speaks the briefing aloud
   - Snooze 5m / Dismiss buttons work
5. Refresh the page → alarm is still scheduled (localStorage)
6. Toggle the theme icon → dark / light with smooth CSS variable transition

---

## Design System

### Palette — *"Dark Academia / Desert Dusk"*

| Token | Dark mode | Light mode | Source |
|---|---|---|---|
| `--bg` (canvas) | `#10232a` | `#ece2d4` | Deep navy-teal / Warm cream |
| `--bg-elev-2` (input) | `#1d333d` | `#e3d6c4` | Slate / Clay-tinted |
| `--text` | `#d3c3b9` | `#10232a` | Soft beige / Deep navy-teal |
| `--text-muted` | `#a79e9c` | `#3d4d55` | Warm taupe / Dark slate |
| `--accent` | `#b58863` | `#946b4d` | Warm tan/camel |
| `--border` | `#2f4450` | `#c9b9a4` | Mid-slate / Aged-paper |

### Typography

- **Body:** Inter — clean, optimized for screens
- **Display:** Fraunces (italic serif) — used for titles, eyebrows, and numeric counters
- Letter-spacing: -0.015em on display text for tight, editorial feel
- Uppercase eyebrows with 0.12-0.18em tracking — book-chapter kicker style

### Refinements

- Subtle SVG film-grain overlay on dark mode (`mix-blend-mode: overlay`)
- Spring-curve toggle switch with overshooting thumb
- Hairline accent stripe on alarm card hover
- Letter-spaced uppercase section headers
- Italic serif numerals for time displays
- iOS safe-area-aware positioning for the install prompt

---

## PWA Coverage

The install prompt and icons cover every major platform:

| Platform | Mechanism |
|---|---|
| **Chrome / Edge (Android + Desktop)** | Native `beforeinstallprompt` → one-tap install |
| **iOS Safari** | Custom hint to use Share → Add to Home Screen |
| **Android adaptive icons** | `icon-maskable-512.png` with safe-zone content |
| **iOS Home Screen** | `apple-touch-icon.png` (180x180) + `apple-mobile-web-app-capable` |
| **Windows tile** | `msapplication-TileImage` + `msapplication-TileColor` |
| **High-DPI favicons** | 16, 32, 48px variants |

`sessionStorage` remembers dismissal — the banner won't pester you after first close.

---

## Engineering Decisions

### State management: Zustand, not Context

The PRD specified React Context. I chose Zustand because:
- Context re-renders every consumer on any state change
- Zustand's selectors + `subscribeWithSelector` give surgical re-renders
- One 80-line store file replaces the PRD's Context provider + 5 consumer hooks
- The store also persists to localStorage on every mutation — single source of truth

### One interval, one trigger path

`useAlarmChecker` is the single source of trigger logic:
- Single `setInterval` running every second
- Pure function `shouldTrigger(alarm, now)` decides whether to fire
- Optimistic trigger: overlay shows immediately, then hydrates with API response
- One-time alarms auto-disable after firing
- Snoozed alarms reschedule themselves via `snoozeUntil`

### TTS: native, with Chrome workarounds

- Browser's built-in `speechSynthesis` — no library, no model download
- Voice pre-loading on first use (Chrome returns empty voice array initially)
- 10-second resume interval works around Chrome's 15-second utterance bug
- Reuses the same voice across renders (no re-selection flicker)

### Backend: 140 lines total

Three routes, one file, one `wrangler.toml`. No ORM, no validation library, no auth layer. The PRD didn't need them.

---

## Performance Budget

| Bundle | Raw | Gzipped |
|---|---|---|
| Frontend JS | 292 kB | 95 kB |
| Frontend CSS | 15.4 kB | 3.8 kB |
| Worker | 66 kB | 17 kB |
| First paint target | < 2s | Yes |
| Time to interactive target | < 3s | Yes |
| Alarm drift target | < 1s | Yes (1s interval, gates on `seconds === 0`) |

---

## Contributing

This is an internship deliverable, not a maintained project. If you're another AVIP 2026 intern and want to fork it for your own task:

1. Click **Use this template** on GitHub
2. `npm install` and `npm run dev` — works out of the box
3. Read `apps/api/wrangler.toml` and `apps/web/public/manifest.webmanifest` for the deploy config

---

## License

MIT — do whatever you want with it.

---

## Author

**bikash-20** — AVIP 2026 intern, Arithmatrix B.Y.T.E program.

Built as Task 5 of the Arithmatrix Virtual Internship Program (AVIP) 2026.

---

> *"You cannot build a hyper-scale artificial intelligence app if you don't know how to pour the foundational concrete. AVIP 2026 is your proving ground."* — Arithmatrix B.Y.T.E