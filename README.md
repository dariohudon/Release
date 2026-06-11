# Model Radar

The AI frontier at a glance — a curated tracker of closed flagships, open-weight
leaders, small/edge models, and what's on the horizon. Expandable cards with
specs, strengths vs watch-outs, pricing, and community sentiment.

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

## History

This repo previously hosted Episode Radar (Sonarr + Plex tracker), then the
AI Release Radar feed (June 2026), before becoming Model Radar. Both earlier
apps are preserved in git history.
