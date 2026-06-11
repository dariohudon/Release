# Release Model Radar iOS Plan

Recommended repo: `dariohudon/release-model-radar-ios`
Recommended app name: **Release Model Radar**
Bundle name suggestion: `ReleaseModelRadar`

## Architecture

- The RMR web app (this repo) remains the **source of truth**.
- The iOS app consumes the read-only JSON API on `https://release.brightening.ca`
  — no GitHub raw files, no copy/paste between projects.
- The cron/update checker remains server-side only; the app never triggers it.
- Candidate review (`data/update-candidates.json`, run logs) remains private
  and is not reachable through any API.

## API contract

All endpoints return the shared envelope (see `lib/api/types.ts`):

```json
{ "ok": true, "generatedAt": "ISO", "count": 0, "data": {} }
{ "ok": false, "generatedAt": "ISO", "error": "short safe message", "data": null }
```

| Endpoint | Data | Freshness |
|---|---|---|
| `GET /api/models` | curated catalog + counts by lab/status/verdict | static, changes on deploy |
| `GET /api/labs` | lab id, name, color, model count | static, changes on deploy |
| `GET /api/definitions` | definitions library + categories | static, changes on deploy |
| `GET /api/update-status` | last checker run: timestamp + counts | updated by daily cron |
| `GET /api/news` | cleaned lab-news items (official feeds first) | revalidated every 6h |

## Phase 1 — SwiftUI MVP

Consume:

- `/api/models` — the radar list (sections by `status`, triage by `verdict`)
- `/api/labs` — colors and grouping
- `/api/definitions` — searchable glossary
- `/api/update-status` — "Checked …" freshness badge

Keep models/labs/definitions decoded into simple `Codable` structs mirroring
the TypeScript interfaces in `lib/models/data.ts` and `lib/definitions/data.ts`.

## Phase 2

- Offline cache (persist last good API responses)
- Saved/favourite models
- Better iPad layout
- Background refresh if appropriate (BGAppRefreshTask)

## Phase 3

- Widgets (latest release / last-checked)
- Local notifications for "daily check completed" (poll `/api/update-status`)
- Optional push notifications later (would require server work — out of scope)

## Security / privacy notes

- The public app may reference the `release.brightening.ca` API domain — that
  is fine; it is already public.
- Do not expose Leonard/server internals (paths, cron lines, PM2 names) in
  the app or its repo.
- Candidates and logs are never exposed by the API; do not add endpoints
  for them.
- No secrets in the iOS app — every endpoint is public read-only, no keys.
