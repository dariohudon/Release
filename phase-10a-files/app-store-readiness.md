# App Store / TestFlight readiness — Release Model Radar iOS

Status: readiness REVIEW done (Phase 9); submission work remains. The app
is feature-locked for v1.0, but before submission the following are still
open: privacy policy URL, server/CDN log retention verification (decides
the privacy label), App Store metadata entry, final app icon/assets,
App Group setup in the Apple Developer portal, archive/validate/upload,
and TestFlight review. Everything below reflects the code as of
`phase-8b-widget-foundation-lock` plus this pass.

## Current app scope

- Native SwiftUI app (iOS 17.0+, iPhone + iPad) consuming the public,
  read-only Release Model Radar API at `release.brightening.ca`. The
  web/API project is the source of truth; the app never owns or edits the
  catalog.
- Tabs: Radar — in-app heading "Today" (timeline + curated model list +
  detail), Labs (favourites, Lab Activity), Definitions (searchable
  glossary), News, Settings. Inside the app the main screen leads with
  what the user is doing ("Today"); the product name appears on identity
  surfaces (About, widget, notification title). The product is NOT
  renamed.
- Three guidance layers: USE/WATCH/IGNORE (public, never personalized),
  USEFUL FOR (public reasoning), WHY IT MATTERS TO YOU (computed on
  device from Tune Radar answers).
- Offline cache of last successful responses with explicit
  "Offline — last updated …" notices.
- iPad: NavigationSplitView layouts for Radar and Definitions, readable
  widths elsewhere; iPhone keeps the original tab/stack flow.
- Opt-in local daily reminder notification (Settings).
- Read-only WidgetKit status widget (small/medium) fed by an App Group
  snapshot the app saves.

## Permissions used

- **User Notifications** (alert + sound) — optional, requested ONLY when
  the user turns on the daily reminder in Settings. Never requested at
  launch. Fully usable without it.
- Nothing else. No location, camera, photos, contacts, microphone,
  health, motion, Bluetooth, or local network APIs anywhere in the
  binary.

## Data stored locally (never leaves the device)

- **API response cache** — last successful public API payloads
  (Library/Caches; purgeable).
- **UserDefaults** — Tune Radar answers, lab favourites, lab activity
  records and snapshots, daily-reminder enabled/time.
- **App Group UserDefaults** (`group.com.octopusandson.ReleaseModelRadar`)
  — the widget snapshot: last checker run time, failed source count,
  saved-at time. Three fields, all public data (guarded by a unit test).
- No identifiers, no user content, no credentials. Deleting the app
  removes everything.

## External network usage

- HTTPS GETs only, to five public read-only endpoints on
  `release.brightening.ca` (`/api/models`, `/api/labs`,
  `/api/definitions`, `/api/update-status`, `/api/news`).
- No third-party SDKs, no analytics or crash-reporting endpoints, no CDN
  image loading. "Open lab" / news links open in the browser.
- The widget performs **no networking** — it reads the saved snapshot
  only.

## Widget behaviour

- Static, read-only, non-interactive; small + medium families.
- Shows "Checked <date>" / "Stale · <date>" derived at render time from
  the saved snapshot, with the same 36-hour staleness rule as the in-app
  badge; "N sources failing" only when the saved payload says so.
- Honest fallback before the app ever saved data:
  "Open the app to refresh radar status."
- Never claims a model shipped, a lab changed, or a check completed.
- Hourly timeline re-render of LOCAL data only (so "Stale" wording stays
  truthful); this is not background refresh and fetches nothing.

## Notification behaviour

- One repeating local notification ("Release Model Radar" /
  "Check today's model updates."), default 9:00 AM, user-set time.
- Strictly opt-in; disable removes the pending request; failed
  scheduling can never leave the toggle dishonestly on (Phase 8A.1
  hardening: atomic replace, serialized operations).
- No push, no server, no notification service extension.

## Explicit negatives (review-relevant)

- No accounts or auth. No sign-in screen exists.
- No tracking, analytics, fingerprinting, or advertising.
- No purchases or subscriptions; no paid content.
- No backend mutations — the API has no write endpoints and the app adds
  none.
- No push notifications; no background refresh / BGTaskScheduler.
- No user-generated content, no third-party login, no web views with
  arbitrary navigation.

## Privacy manifests

Both bundles declare Apple privacy manifests (`PrivacyInfo.xcprivacy`):

- App target: `ReleaseModelRadar/PrivacyInfo.xcprivacy`
- Widget target: `RadarStatusWidget/PrivacyInfo.xcprivacy` — the widget
  gets its own manifest because it compiles the shared snapshot store and
  therefore itself uses the UserDefaults required-reason API via the App
  Group.

Each declares: no tracking, no tracking domains, no collected data types,
and one accessed-API entry — `NSPrivacyAccessedAPICategoryUserDefaults`
with reason `CA92.1` (reading/writing the app's own preferences and
functionality data on device: Tune Radar answers, favourites, activity,
reminder settings, widget snapshot).

## Privacy nutrition label

**Privacy label status: pending server log retention verification.**

Client-side inspection shows no accounts, no tracking SDKs, no analytics
SDKs, no purchases, no user-submitted content, and no client-side
identifiers intentionally sent. However, API requests inherently transmit
the device's IP address and request metadata to the server, and Apple's
disclosure rules turn on whether that server-side data is RETAINED:

- If production logs (server, application, and any CDN/proxy in front of
  it) are not retained beyond real-time servicing of the request,
  "Data Not Collected" may be supportable under Apple's definition.
- If IP addresses or request logs ARE retained, disclose the relevant
  data types based on what is kept and how it is used (typically
  Identifiers/Device ID → no; Usage Data / Diagnostics → depends on
  retention purpose).

Do not finalize the label until the retention policy of the production
stack is confirmed and written down.

## App Store checklist

- [ ] Final 1024px app icon reviewed (current generated icon: replace or
      approve).
- [ ] Display name ("Release Model Radar"), bundle id
      `com.octopusandson.ReleaseModelRadar`, version 1.0 / build 1.
- [ ] Apple Developer: register the App Group
      `group.com.octopusandson.ReleaseModelRadar` for the app id AND the
      widget id (`….RadarStatusWidget`); let Xcode manage signing.
- [ ] Confirm production server / Cloudflare / application log retention
      policy BEFORE submission — this decides the privacy label (see
      Privacy nutrition label section).
- [ ] Privacy nutrition label: set per the verified retention policy
      ("Data Not Collected" only if logs aren't retained beyond
      real-time servicing).
- [ ] Privacy policy URL (can be a static page on
      release.brightening.ca) stating the above, including the
      retention answer.
- [ ] Screenshots: 6.9"/6.7" iPhone + 13" iPad sets (list below).
- [ ] Age rating questionnaire (expect 4+).
- [ ] Export compliance: uses only standard HTTPS — qualifies for the
      exemption; answer the encryption question accordingly.
- [ ] App Review notes: public read-only data app, no login, no demo
      account needed; notifications are optional local reminders.

## TestFlight checklist

- [ ] Archive a Release build; Xcode Organizer validate passes.
- [ ] Upload; complete Beta App Review info (same review notes).
- [ ] Internal testing on device: first-launch onboarding (skippable, no
      permission prompt), all five tabs, model detail layers, airplane-
      mode relaunch (cached data + offline notices), reminder enable →
      iOS prompt → scheduled; disable → removed; widget add → fallback →
      open app → status appears; iPad split layouts; Dynamic Type spot
      check.
- [ ] "What to Test" notes per build.

## App metadata planning

- **Subtitle candidates:** "AI model releases, curated" ·
  "Track AI model releases" · "What's out and what matters".
- **Short description:** A calm, curated radar for AI model releases —
  what just shipped, what's live, what's coming, and whether it matters
  to you.
- **Description draft:** Release Model Radar tracks AI model releases
  across the major labs in one quiet, readable place. A curated catalog —
  not a firehose — groups models by Just shipped / Live now / On the
  horizon, with plain-language guidance: a quick USE / WATCH / IGNORE
  label, the reasoning behind it, and an optional on-device "Why it
  matters to you" layer tuned by two quick questions. Follow favourite
  labs, see what changed since your last visit, browse release-language
  definitions, and read official lab news. Works offline with the last
  saved data. Optional local daily reminder and a home-screen status
  widget. No account, no tracking — everything personal stays on your
  device.
- **Keywords/positioning:** AI, LLM, model, releases, tracker, radar,
  Claude, GPT, Gemini, open weights; positioned as a free, no-account,
  privacy-clean utility for people who need to keep up without reading
  everything.
- **Screenshot list:** 1) "Today" screen — timeline + model list, 2) model detail showing
  the three guidance layers, 3) Labs with favourites + Lab Activity
  sheet, 4) Definitions search, 5) News, 6) Settings (Tune Radar +
  reminder), 7) iPad split layout, 8) widget on home screen.
- **Nutrition label notes:** see Privacy nutrition label section —
  pending server log retention verification; do not pre-fill
  "Data Not Collected".

## Known carry-forward backlog (post-ship)

- Favourite Labs → filtered News view.
- Community/Reddit signal exploration (web first, then app).
- Save/share a news item.
- Optional: notification tap routes to the Radar tab.
- Light appearance via semantic tokens (app is intentionally dark-only
  for v1). What a future light pass must address, per the Phase 10A
  audit: (1) `Theme.*` is hard-coded hex mirroring the web palette —
  introduce a semantic token layer (background/surface/label tiers)
  mapped per scheme; (2) remove the forced
  `.preferredColorScheme(.dark)` at the app root and in sheet/cover
  presentations; (3) the widget duplicates the palette in `WidgetTheme`
  and needs the same mapping. Until all three happen together,
  system-light chrome over the hard-coded dark surfaces would render
  broken, so the forced dark scheme stays.
- Localization beyond English.
- App Store asset production (icon variants, marketing screenshots).
