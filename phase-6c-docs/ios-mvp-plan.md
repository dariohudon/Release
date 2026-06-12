# Release Model Radar iOS — architecture notes

## Principles

- **The web app is the source of truth.** This app never duplicates the
  catalog; it renders whatever `release.brightening.ca` serves. Catalog
  edits happen in the web repo (`lib/models/data.ts`) and flow here on the
  next fetch.
- **Read-only.** The public API has no mutation endpoints and this app adds
  none. The daily update checker stays cron-only on the server; the app only
  reads its status summary.
- **Nothing private.** No server paths, no candidate-review files, no logs,
  no keys. Everything the app touches is already public.

## API contract

Base: `https://release.brightening.ca`

Envelope (see the web repo's `lib/api/types.ts`):

```json
{ "ok": true, "generatedAt": "ISO", "count": 0, "data": {} }
{ "ok": false, "generatedAt": "ISO", "error": "short safe message", "data": null }
```

| Endpoint | Swift payload type | Used by |
|---|---|---|
| `/api/models` | `ModelsPayload` | Radar tab |
| `/api/labs` | `LabsPayload` | Labs tab + lab colors on Radar |
| `/api/definitions` | `DefinitionsPayload` | Definitions tab |
| `/api/update-status` | `UpdateStatus` | toolbar badge (404 envelope = "Not checked yet") |
| `/api/news` | `NewsPayload` | News tab |

## MVP structure

```
ReleaseModelRadar/
  ReleaseModelRadarApp.swift   app entry, TabView, dark scheme
  Theme.swift                  radar.css tokens + date helpers
  API/
    APIClient.swift            actor, async/await, envelope decode,
                               in-memory last-good-response fallback
    APIModels.swift            Decodable mirrors of the TS interfaces
  Components/
    StateViews.swift           LoadingView, ErrorView(retry), Pill
    StatusBadge.swift          last-checked toolbar badge
  Features/
    Models/ModelsView.swift    grouped catalog list
    Models/ModelDetailView.swift
    Labs/LabsView.swift
    Definitions/DefinitionsView.swift  (searchable, expandable)
    News/NewsView.swift
```

State pattern: each screen owns `@State var state: Loadable<Payload>` and a
`load(force:)` — no view-model layer yet; introduce one if a
later phase genuinely needs it.

## Roadmap

- Phase 3 — ✅ locked: iOS MVP baseline (`mvp-ios-phase-3-lock`)
- Phase 4 — ✅ locked: Settings tab + Tune Radar onboarding
  (`phase-4-tune-radar-settings-lock`); two questions, UserDefaults-only,
  skippable, editable/resettable
- Phase 5 — ✅ locked: personalized "Why it matters to you" layer
  (`phase-5-personalized-recommendation-lock`)
- Phase 6 — ✅ locked: persistent offline cache (last-good responses on
  disk via `LocalAPIResponseCache`, written only after successful decode,
  gentle "Offline — last updated …" notices even for empty cached
  payloads) + lab favourites with in-app new-info indicators
  (`LabFavoritesStore`, UserDefaults-only, no system notifications, no
  permission prompts, no backend sync)
  (`phase-6-offline-cache-lab-favourites-lock`)
- Phase 6B — ✅ locked: hardening — `ReleaseModelRadarTests` unit-test
  target (cache policy, disk persistence, favourites/indicator behaviour),
  SHA-256 collision-resistant cache filenames, automatic cleanup of
  favourites whose lab id disappears upstream, cached-data note in the
  update-status detail alert, and VoiceOver value/hint/selected traits on
  the favourite star
  (`phase-6b-cache-favourites-hardening-lock`)
- Phase 6B.1 — ✅ locked: test & cache hardening — 17.0 test deployment
  target, strengthened tests (HTTP-200 `ok:false` handling, disk cache
  survives recreation, teardown removes only test-created cache dirs),
  and the empty-payload guard so one empty successful response can't wipe
  favourites or snapshots
  (`phase-6b1-test-cache-hardening-lock`)
- Phase 6C — ✅ locked: Favourite Lab Activity — in-app Lab Activity sheet
  with a local activity model whose reasons come only from tracked local
  signals (model count changed / latest news headline changed), "Mark all
  seen" and per-lab acknowledge, tap-to-jump that lifts filters and
  scrolls to + briefly highlights the lab row, empty states with
  cached/offline context, migration of legacy new-info flags (honest
  fallback reason, no invented timestamp), and unit tests passing
  (`phase-6c-favourite-lab-activity-lock`)
- Phase 7 — iPad polish / NavigationSplitView
- Phase 8 — widgets + daily check notifications (poll `/api/update-status`)
- Phase 9 — App Store / TestFlight readiness

## Appearance note

The app intentionally sets `.preferredColorScheme(.dark)`: every design
token mirrors the web app's dark navy palette, and system-light chrome over
those hardcoded surfaces would render broken (dark text on dark panels).
Honouring the system appearance properly means a semantic/light token set —
a deliberate later-phase task, not a quick toggle.

## Release status

App Store signing/distribution is **not** set up yet. The MVP baseline can
still be locked after review — signing is a release task, not an MVP task.

## Security / privacy

- The API domain in the binary is fine — it is public.
- Never reference private server internals (host names, paths, cron lines,
  process names, or server-only runtime files) in code, strings, or docs here.
- No secrets exist in this app; keep it that way.
