# Release Model Radar — iOS

A native SwiftUI iOS app for tracking AI model releases. It consumes the
public, read-only [Release Model Radar](https://release.brightening.ca) API.
The web/API app remains the source of truth — this app does **not** own or
duplicate the model catalog; catalog updates happen upstream and appear here
on the next fetch.

## Features

| Tab | What it does |
|---|---|
| **Radar** | Release timeline (lab-colored dots, today marker, tap-to-detail) and the model list grouped by release state — Just shipped / Live now / On the horizon — with at-a-glance usefulness pills. Tap a model for the full detail screen: specs, strengths, watch-outs, guidance, community signal, lab link. |
| **Labs** | Every tracked lab with its color and model count. Star a lab to favourite it (stored on device); a favourites filter and an in-app “New info” dot show when a favourited lab's public data changed since your last refresh. A **Lab Activity** sheet lists what changed and why (tracked local signals only), with “Mark all seen”, per-lab acknowledge, and tap-to-jump that scrolls to and briefly highlights the lab's row. |
| **Definitions** | Searchable plain-English glossary of model-release language; tap a term to expand. |
| **News** | Recent lab announcements, newest first, with official vs news-search source tags. |
| **Settings** | Tune Radar preferences (view, edit, reset) and app info. |

Also: a runtime **"Checked …" badge** in the Radar toolbar showing when the
upstream radar last checked its sources, and a first-launch **Tune Radar
onboarding** — two quick questions, fully skippable, editable or resettable
later in Settings.

The app keeps the **last successful response for every endpoint on device**,
so Radar, Labs, Definitions, and News still render without a connection — a
gentle "Offline — last updated …" notice appears whenever cached data is
being shown (even when the cached list is empty).

## The three guidance layers

| Layer | Where | Meaning |
|---|---|---|
| **USE / WATCH / IGNORE** | pill on list cards & detail | Quick public usefulness label, at a glance. **Not personalized** — every user sees the same label. |
| **USEFUL FOR** | detail screen | The generic public reasoning behind that label. |
| **WHY IT MATTERS TO YOU** | detail screen | The personalized layer: one short explanation computed **on this device** from your two Tune Radar choices. If preferences are skipped or reset, this section becomes a gentle Settings prompt instead. |

## Privacy & local-only behaviour

- No account required; no sign-in exists.
- No API keys in the app — every endpoint it reads is public.
- Tune Radar preferences are stored locally in UserDefaults and are
  **never sent to a server**.
- Personalization is computed entirely on device; there is no backend
  personalization, no analytics, no tracking.
- The app is read-only: it has no mutation routes and cannot change
  anything upstream.
- Lab favourites are stored locally and never synced to a server.
- The app keeps the last successful API responses on device so it still
  works offline, with a gentle “Offline — last updated …” notice. The
  cache holds only public data and never overwrites good data with a
  failed request.
- New-info indicators are in-app only — no system notifications, and the
  app never requests notification permissions.

## Development status

**Locked**

- Phase 3 — iOS MVP baseline (`mvp-ios-phase-3-lock`)
- Phase 4 — Tune Radar onboarding & settings (`phase-4-tune-radar-settings-lock`)
- Phase 5 — Personalized recommendation layer (`phase-5-personalized-recommendation-lock`)
- Phase 6 — Offline cache + lab favourites (`phase-6-offline-cache-lab-favourites-lock`)
- Phase 6B — Cache/favourites/accessibility hardening + unit-test target
  (`phase-6b-cache-favourites-hardening-lock`)
- Phase 6B.1 — Test & cache hardening (`phase-6b1-test-cache-hardening-lock`)
- Phase 6C — Favourite Lab Activity surface
  (`phase-6c-favourite-lab-activity-lock`)

**Future**

- Phase 7 — iPad polish / NavigationSplitView
- Phase 8 — Widgets + daily check notifications
- Phase 9 — App Store / TestFlight readiness

## Developer notes

- Requirements: Xcode 16+, iOS 17.0+ deployment target, no external
  dependencies (pure SwiftUI + Foundation).
- Open `ReleaseModelRadar.xcodeproj`, pick an iPhone simulator, ⌘R.
  Simulators need no signing; a device needs your team under
  Signing & Capabilities.
- Run the unit tests with ⌘U (`ReleaseModelRadarTests` — cache policy,
  disk persistence, favourites/indicator and lab-activity behaviour).
- **No server setup required** — the app talks to the public web/API
  project, which is developed and deployed separately.
- Do not add secrets or API keys to this app; nothing it does needs them.
- If Xcode ever refuses the project file (it was authored outside Xcode):
  create a fresh iOS App project named `ReleaseModelRadar` and drag this
  repo's `ReleaseModelRadar/` folder contents in — every Swift file is
  self-contained.

Architecture notes and the phase plan live in `docs/ios-mvp-plan.md`.
