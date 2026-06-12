# Phase 8B — RadarStatusWidget: Mac setup (~2 minutes in Xcode)

Apply the code patch first, on a branch cut from the Phase 8A.1 lock:

```bash
git checkout -b ios-phase-8b-widget-foundation phase-8a1-notification-reliability-hardening-lock
git am -3 0021A-Add-radar-status-widget-foundation.patch
```

(`0021B` only mirrors my project file — skip it; your Xcode writes its own
pbxproj. Full-file fallbacks for every Swift file are in this folder.)

The patch adds the `RadarStatusWidget/` folder, the shared snapshot file,
entitlements files, the app-side hook, the Settings note, and tests. The
widget TARGET itself is created in Xcode, because target creation must
match your project file:

## 1. Create the widget extension target

- File → New → Target… → iOS → **Widget Extension**
- Product Name: **RadarStatusWidget** (exactly — the folder already exists
  and Xcode will adopt it)
- UNCHECK "Include Configuration App Intent" (and any Live Activity option)
- Don't activate a new scheme if asked about anything unusual — defaults
  are fine. If Xcode created template files (e.g. a second
  `RadarStatusWidget.swift`, `AppIntent.swift`, asset catalog), delete the
  template files and keep the ones from the patch.
- Set the widget target's iOS Deployment Target to **17.0**
  (Build Settings → Deployment).

## 2. App Group (this is the only entitlement change)

Group id used everywhere: `group.com.octopusandson.ReleaseModelRadar`

- Select the **ReleaseModelRadar** app target → Signing & Capabilities →
  "+ Capability" → **App Groups** → add the group id above.
- Repeat for the **RadarStatusWidget** target with the SAME group id.
- If Xcode created new .entitlements files, that's fine — just make sure
  the group id matches; the patch's entitlements files are reference
  copies of exactly what's needed (one App Groups key, nothing else).

## 3. Share the snapshot file with the widget target

- In the navigator select
  `ReleaseModelRadar/Widgets/RadarStatusSnapshot.swift`
- File Inspector → Target Membership → tick **RadarStatusWidget**
  (keep ReleaseModelRadar ticked too).
- Confirm `RadarStatusWidget/RadarStatusWidget.swift` belongs to the
  widget target only.

## 4. Validate

- ⌘B (app) and build the RadarStatusWidget scheme.
- ⌘U — includes the new RadarStatusSnapshotTests.
- Run the app once on a simulator, open the Radar tab (loads
  update-status), then add the widget to the home screen: it should show
  "Checked …". Before the first app run it shows
  "Open the app to refresh radar status."

No push, no background refresh, no networking in the widget — it only
reads the App Group snapshot the app saves.
