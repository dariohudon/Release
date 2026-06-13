# P11-S03 — Product Positioning Lock

Phase 11 — Modelmark Identity & Automation Architecture
Sprint P11-S03 · docs-only · no app code changed.
Baseline: `phase-11-s02-methodology-trust-spec-lock`.

---

## 1. Executive Summary

This sprint locks **product positioning** for Modelmark before any app copy,
rename, App Store metadata, website copy, API claim, or backend work. The
deliverable is `docs/positioning.md` (the standing positioning reference)
plus this report.

The positioning is deliberately **calm and honest about today's
hand-curated, read-only reality**. It fixes the category
(**model-change intelligence record, not a news app**), the one-sentence
positioning, the is/is-not list, approved vs banned language, and — most
importantly — a clean split between the **v1 claim** (safe today) and the
**future claim** (only after the backend/trust pipeline exists). It also
locks the **"source-aware" (now) vs "source-backed" (future)** wording rule
and the **News→Updates** positioning. Nothing is implemented.

## 2. Positioning Lock

- **One-sentence:** "Modelmark is a calm, source-aware record of what
  changed across AI models — and whether you should care."
- **Record, not feed** is the core stance.
- **v1 claim (safe today):** "A calm, curated, source-aware timeline of AI
  model releases and changes, with plain-language summaries of what changed
  and why it might matter."
- **Future claim (after backend):** "A source-backed model-change record
  with reviewable trust metadata, historical records, and structured API
  access."
- **Wording rule:** use **source-aware** now; reserve strict
  **source-backed** for the future (qualified only until then).

## 3. Category Definition

**Model-change intelligence record — not a news app.** Closer to a
changelog / system-of-record for AI models than to media. It records
changes (facts) and adds a thin calm "why it matters" layer. It competes
with the chore of manually tracking many labs, not with news outlets.

## 4. What Modelmark Is

Structured model release/change record · source-aware timeline of AI model
changes · calm explanation layer · future data product (app, web, API,
admin).

## 5. What Modelmark Is Not

Not an AI news app · not a newsfeed · not a blog · not a hype tracker · not
a best-model leaderboard · not an AI tool directory · not an AI agent
marketplace.

## 6. Primary User Question

**"What changed across AI models, and should I care?"**

## 7. App User Positioning

A busy practitioner/decision-maker who wants to know *what changed and
whether to care* — calmly, privately, without doom-scrolling. Values trust,
brevity, privacy (no account, no tracking; on-device personalization). The
v1 sentence speaks to this person.

## 8. Future API / Data User Positioning

Developers, analysts, and businesses wanting **maintained, structured,
source-trailed historical change data** via API/exports/webhooks with
commercial usage rights. The future claim speaks to this person — and must
**not** be implied as available today. Anything API-facing is roadmap until
the API phase (P11-S09).

## 9. Approved Language

calm · curated · source-aware · read-only · privacy-conscious · model
release timeline · model changes / updates · plain-language summaries ·
"what changed and why it might matter" · record · selective · on-device
personalization · "the labs you follow".

## 10. Risky / Banned Language

**Banned in v1 (overclaims today):** automated · automatically tracks ·
fully verified · verified · comprehensive · every model / complete ·
real-time / live · database-backed · API-ready / "our API" · bare
"source-backed".

**Banned always (off-brand):** news · newsfeed · headlines · stories ·
trending · hype · breaking · "best model" · leaderboard · ranking ·
directory · marketplace · superlatives · urgency.

## 11. News / Updates Positioning

**Modelmark does not position around "news."** The future surface is
**"Updates" (or "Changes")** — source-aware model/lab changes, framed as
*"recent changes from the labs you follow,"* never *"the latest AI news."*
The dividing line: an **update** answers the trust quartet (source, date,
what changed, why it matters); a **headline** does not. This is consistent
with P11-S02's News decision (destination = fold into structured change
records, named "Updates"; v1 bridge = keep only with clear authority
labeling, else remove).

## 12. App Store v1 Positioning Guidance

- Lead with the v1 sentence; emphasize calm, curated, privacy-conscious,
  read-only, no account.
- Describe the timeline + "what changed / why it might matter".
- **Avoid** automation/verification/completeness/real-time/API claims.
- Updates surface (if shipped) = "recent source-aware changes from labs you
  follow", clearly distinct from "news".
- Factual category keywords only (AI models, releases, changes, timeline);
  not "news"/"leaderboard".

## 13. Website / API Positioning Guidance

- **Website:** same hero positioning; the public web timeline is a bounded,
  calm view (recent window + paginated history, per P11-S01 §9), not a full
  data dump; roadmap surfaces labeled "coming"; link to `methodology.md`.
- **API/data product (future):** position around maintained structured
  data, source trails, historical records, change metadata, exports,
  webhooks, commercial usage rights. **Do not imply it exists today** —
  future tense only. Protect the curated corpus per the public/private
  boundary.

## 14. Risks and Unknowns

- **Live copy still overclaims** until P11-S04 aligns shipped strings; this
  doc reduces the risk by defining the language, but changes nothing yet.
- **"source-aware" vs "source-backed" discipline** must hold across app,
  store, and web simultaneously; one stray "verified" undermines the brand.
- **Updates implementation gap:** the positioning assumes the News→Updates
  shift; the actual copy/data work is later (P11-S04 copy; data model +
  backend for the structured version).
- **API positioning temptation:** marketing the future API as present is the
  classic overclaim; guard with future tense.
- **Process caveat:** authored in a cloud mirror, no Xcode; docs-only, but
  the branch must be applied/pushed on the Mac to be reviewable.

## 15. Recommended Sprint Sequence

1. P11-S01 — current data reality & scope audit. ✅ (locked)
2. P11-S02 — methodology & trust spec lock. ✅ (locked)
3. **P11-S03 (this)** — product positioning lock. ✅
4. **P11-S04 — App Copy / Trust Alignment (app copy only, no rename):**
   bring shipped strings within the approved/banned language + methodology
   §9 boundaries; apply the Updates v1 decision at copy level.
5. P11-S05 — Identity rename (RMR/Radar → Modelmark): target, bundle id,
   App Group, widget kind, copy, docs, tests. One deliberate pre-submission
   sprint.
6. P11-S06 — Data model: `ModelChange` + trust quartet/metadata (web/API +
   app, coordinated).
7. P11-S07 — Backend foundation (managed Postgres + schema + seed import).
8. P11-S08 — Ingestion (source registry, scheduled checker, change detector).
9. P11-S09 — Review queue + admin.
10. P11-S10 — Public API hardening (keys, limits, boundary).
11. P11-S11 — Web app on published DB.
12. P11-S12 — App Store submission under Modelmark.

(Sequence numbering past S04 is indicative; backend phases may reorder.)

## 16. Recommended Immediate Next Sprint

**P11-S04 — App Copy / Trust Alignment (app copy only, no rename).**

Why next, why safe:
- Positioning and methodology now exist, so shipped copy can be measured
  against concrete approved/banned lists and §9 boundaries.
- It removes the **live overclaim risk** in user-facing strings *before* the
  rename, so the language is honest regardless of product name.
- It applies the **Updates** decision at the copy level (bridge D labeling,
  or removal C) **without** touching the data model, backend, or identity.

Scope guardrails for P11-S04: change **only** user-facing strings and the
Updates surface's authority presentation; **no rename**, no type/enum
renames, no API/backend/schema. Contained and reviewable.

---

*End of P11-S03. Docs-only. No app code, UI copy, rename, bundle/App Group/
widget/target/scheme/test/project change, backend, API, admin, schema,
automation, or deployment configuration was changed.*
