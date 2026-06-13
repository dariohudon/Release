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

## P11-S02 — Methodology & Trust Spec Lock — COMPLETED

- **Status:** completed (docs only; no app code changed).
- **Created:** `docs/methodology.md` (standing trust contract) and
  `docs/phase-11/p11-s02-methodology-trust-spec-lock.md` (sprint report).
- **Locked:** trust quartet (source, date, what changed, why it matters) as
  the mandatory record contract; 4-tier source hierarchy; publishing /
  correction / editorial (anti-hype) rules; fact-vs-interpretation split;
  estimate-date honesty; vocabulary definitions.
- **App Store v1 claim boundaries:** safe today = curated, calm,
  source-aware, read-only, privacy-conscious, release timeline, useful
  summaries. Must wait for backend = automated, fully verified,
  comprehensive, real-time, database-backed, API-ready, strict
  "source-backed".
- **News/Updates decision (paper only):** destination **B** (fold into
  structured change records) under the name **"Updates" (A)**; App Store v1
  bridge **D** (keep but label authority, lead with official), fallback
  **C** (remove from v1) if honest labeling isn't clean.
- **Recommended next sprint:** **P11-S03 — App Copy / Trust Alignment**
  (app copy only, no rename).

## P11-S03 — Product Positioning Lock — COMPLETED

- **Status:** completed (docs only; no app code changed).
- **Created:** `docs/positioning.md` (standing positioning reference) and
  `docs/phase-11/p11-s03-product-positioning-lock.md` (sprint report).
- **Category locked:** model-change **intelligence record, not a news app**.
- **v1 positioning (safe today):** "A calm, curated, source-aware timeline
  of AI model releases and changes, with plain-language summaries of what
  changed and why it might matter."
- **Future positioning (after backend):** "A source-backed model-change
  record with reviewable trust metadata, historical records, and structured
  API access."
- **Wording rule:** use **source-aware** now; reserve strict
  **source-backed** for the future (qualified only until then).
- **News/Updates:** do not position around "news"; future surface is
  **"Updates"/"Changes"** (source-aware model/lab changes, not headlines).
- **Recommended next sprint:** **P11-S04 — App Copy / Trust Alignment**
  (app copy only, no rename).
