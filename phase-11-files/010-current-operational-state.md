# 010 — Current Operational State

Lightweight running note of operational state. Append concise entries; do
not rewrite history.

## P11-S01 — Current Data Reality & Modelmark Scope Audit — COMPLETED

- **Status:** completed (docs/architecture audit only; no app code changed).
- **Report:** `docs/phase-11/p11-s01-current-data-reality-modelmark-scope-audit.md`.
- **Key finding:** the iOS app is a **read-only remote client** — no bundled
  catalog. All content is fetched from `https://release.brightening.ca`
  (`ReleaseModelRadar/API/APIClient.swift`). Source of truth is the
  hand-curated web/API repo (`lib/models/data.ts`, `lib/definitions/data.ts`);
  the only automation is the cron `scripts/check-model-updates.ts`, which
  proposes *candidates* for human review and never edits the catalog.
- **Modelmark readiness:** product is structurally close (curated,
  timeline-first, calm, no leaderboard/hype). Gaps: naming
  (RMR/Radar/News→Modelmark), News-tab framing, and a structured per-item
  **trust quartet** (source, date, what changed, why it matters).
- **Biggest risk:** over-claiming "automated/source-verified" trust while
  data is hand-curated. Ship an honest curated v1; build the
  source→review→publish backend as a separate later phase.
- **Recommended next sprint:** **P11-S02 — Methodology & Trust Spec Lock**
  (docs only).
