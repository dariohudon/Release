# Release Model Radar

The AI frontier at a glance — a curated tracker of closed flagships, open-weight
leaders, small/edge models, and what's on the horizon. Expandable cards with
specs, strengths vs watch-outs, pricing, and community sentiment — plus a
plain-English definitions library, a lab news feed, and a daily read-only
update checker that surfaces candidates without ever touching the curated
catalog.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge)
![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## Screenshot

![Model Radar mobile](docs/assets/model-radar-mobile.png)

## Project Info

| Item | Details |
|---|---|
| Project Name | release |
| Repo | dariohudon/Release |
| Folder | /var/www/release |
| Domain | release.brightening.ca |
| Port | 3033 |
| PM2 Process | release |
| Tmux Session | release |
| Tmux Launcher | tmux-release |

## Routes

| Route | Page |
|---|---|
| `/` | Model Radar — the curated release tracker |
| `/definitions` | AI Definitions — static, searchable glossary of model-release language |
| `/news` | Lab News — best-effort feed of lab announcements (official RSS first, labelled news search fallback) |
| `/labs/<id>` | Lab profile pages |

Definitions is fully static (`lib/definitions/data.ts`) — edit the file to add
terms. Lab News fetches server-side with a 6-hour revalidate, fails gracefully
per lab, and falls back to a static list of official news pages if nothing is
reachable; it **never updates the curated catalog automatically**. The model
catalog remains hand-curated in `lib/models/data.ts`. A top-right menu on all
three main pages switches between them.

## How it works

- **All data is static** in `lib/models/data.ts` (`LABS` + `MODELS`). No
  backend, no API keys, no network calls — by design. To update the catalog,
  edit that file and rebuild.
- **Verdict triage**: every model carries an editorial verdict — use / watch /
  ignore — shown as a pill on each card and as the primary filter. Edit
  verdicts in `lib/models/data.ts`.
- **Release timeline**: recent months behind a "today" marker, horizon items
  ahead as hollow dots; tap a dot to jump to its card.
- **Map view**: intelligence vs $/M scatter (list/map toggle). Sweet spot =
  top-left. Models without comparable figures are listed below the chart.
- **New since last visit**: returning visitors get a banner + card markers for
  anything released since their previous session (localStorage).
- **For-the-job picker**: chips like "client copy & brand voice" surface the
  top pick(s) for that job, best first (mappings in `JOBS` in the data file).
- **Lab pages**: `/labs/<id>` (e.g. `/labs/anthropic`) — evergreen profile,
  focus areas, official links, and that lab's tracked models. Linked from
  every card drawer.
- **Sections**: Just shipped / Live now / On the horizon (rumored items are
  honestly labelled as estimates).
- **Filtering**: triage buttons + search stay on the page; lab, sort, model
  type, and best-for live in a Filters bottom sheet (modal on desktop) with
  an active-count badge, Apply / Clear all, Escape + backdrop close.
- **Persistence**: last-used filters + view are kept in localStorage.
- **Styling**: design tokens as CSS custom properties in `app/radar.css`
  (dark navy palette, per-lab color rails). Space Grotesk / Inter /
  JetBrains Mono. No Tailwind.

## Native client API

Read-only public JSON endpoints for future native clients (planned SwiftUI
iOS app — see `docs/native-ios-plan.md`). All share one envelope:
`{ ok, generatedAt, count, data }` on success, `{ ok: false, generatedAt,
error, data: null }` on failure. Types live in `lib/api/types.ts`.

| Endpoint | Returns |
|---|---|
| `GET /api/models` | curated catalog + counts by lab / status / verdict |
| `GET /api/labs` | lab id, name, color, model count |
| `GET /api/definitions` | definitions library + categories |
| `GET /api/update-status` | last checker run (timestamp + counts); 404 envelope when no run recorded |
| `GET /api/news` | cleaned lab-news items, 6h revalidate, graceful fallback |

Notes:

- These are **read-only**; no mutation endpoints exist, and nothing here can
  trigger the update checker (cron-only).
- The public model catalog remains curated in `lib/models/data.ts`; the daily
  checker does not auto-update it.
- Candidate files (`data/update-candidates.json`), run logs, and server paths
  are private and are **not exposed** by any endpoint.
- Native clients should consume these endpoints instead of GitHub raw files.

## Daily update checker (read-only)

RMR **does not auto-update the public catalog**. The page stays static and
curated; `lib/models/data.ts` is only ever edited by hand after review.

`npm run check:updates` runs a read-only checker that gathers **candidate**
releases/updates from public, key-free sources (Hugging Face org listings,
the OpenRouter model list, Google News RSS queries) and writes them for
review:

- `data/update-candidates.json` — accumulated candidates, deduped against
  previous runs and against the live catalog
- `docs/model-radar-update-log.md` — appended human-readable run log
- `data/update-status.json` — records the latest checker run (timestamp +
  counts). The top-right header badge reads this file and shows the latest
  successful cron/manual check ("Checked Jun 11, 7:43 PM"); it turns amber
  when sources failed or the last check is older than 36 hours, and shows
  "Not checked yet" when no run is recorded. The page only reads this small
  file — it never runs the checker, and the public catalog still does not
  auto-update.

Candidates carry a lab guess, type (model-card / openrouter / news),
confidence, and a suggested action (`review` / `ignore` / `add-to-catalog` /
`update-existing`). News-only items are never marked add-to-catalog;
rumour-flavoured headlines are downgraded to low confidence. Source failures
are logged and never crash the run. **Human/Claude review is required before
anything is copied into `lib/models/data.ts`.**

To run it daily on the server:

```bash
mkdir -p /var/www/release/logs
crontab -e
# add:
15 7 * * * cd /var/www/release && npm run check:updates >> logs/model-radar-check.log 2>&1
```

## Data caveats

Seed data was verified against the web on June 11, 2026, but figures are
directional — open-weight benchmark numbers are often vendor-reported, and
horizon entries are cadence/rumor estimates, not announcements.

## Development

```bash
cd /var/www/release
npm run dev        # dev server on port 3033
npm run build      # production build
npm run type-check # TypeScript check
npm run lint       # ESLint
```

## Production (PM2)

```bash
pm2 start /var/www/release/ecosystem.config.js
pm2 restart release
```

Health check: `http://localhost:3033/api/health`

## Build log

How this repo got here (all in June 2026, newest first). Every earlier app
remains recoverable from git history.

| Commit | What changed |
|---|---|
| `4729537` | **Last-checked header badge** — `data/update-status.json` written by the checker; top-right badge shows "Checked Jun 11, 7:43 PM" (amber on failed sources / stale >36h, "Not checked yet" fallback); hourly ISR re-read |
| `d160014` | **Definitions + Lab News** — `/definitions` (36-term plain-English glossary, search + category chips), `/news` (official RSS first, labelled news-search fallback, render-always static fallback, 6h revalidate), top-right site menu, taller timeline |
| `4540d77` | **Daily update checker** — `npm run check:updates`: read-only candidate gathering from Hugging Face orgs, OpenRouter, and Google News, deduped against catalog + prior runs; cron-friendly; never edits the catalog |
| `1c112b8` | **Spacing polish** — status-bar eyebrow, "Release Model Radar" title, triage moved into the Filters sheet, 20/40px rhythm, larger section headers |
| `caec9e2` | **Filters bottom sheet** — secondary filters (lab, sort, type, best-for) moved off the page into a mobile bottom sheet / desktop modal with active-count badge; first card above the fold |
| `cc0cc72` | **Hydration crash fix** — timeline SVG renders post-mount (positions derive from `Date.now()`; SSR coordinates could never match the client → React #418 in production) |
| `721e091` | **Triage era** — use/watch/ignore verdicts, release timeline, intelligence-vs-price map view, for-the-job picker, new-since-last-visit, `/labs/<id>` profile pages |
| `1e988aa` | **Model Radar takes over `/`** — release-feed app removed; mobile filter cleanup; 16px inputs to stop iOS focus zoom |
| `e43b155` | **Model Radar lands** — the chat-built tracker integrated at `/models`: catalog split into `lib/models/data.ts`, CSS tokens extracted, localStorage persistence added |
| `0e86a1a` | **AI Release Radar rewrite** — replaced the original Episode Radar (Sonarr + Plex episode tracker) with an AI model release feed (curated timeline + live Hugging Face + news), later superseded by Model Radar |

Before all of this, the repo hosted **Episode Radar**, a Sonarr + Plex episode
tracker (see `docs/milestones/`).
