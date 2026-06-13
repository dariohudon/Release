# Modelmark — Methodology & Trust Specification

*Status: DRAFT specification (Phase 11, P11-S02). This document defines how
Modelmark decides what to record, how it is sourced, and what may be
claimed about it. It is the reference for product copy, App Store
description, future API trust metadata, and the human review process.*

*Honesty note up front: as of this writing the catalog is **hand-curated**
and the iOS app is a **read-only client** of a single curated source. This
document describes both the standard Modelmark holds itself to **today**
and the stricter guarantees that become available **only after** the
review/published-database backend exists. Where the two differ, it says so.
Nothing here describes a system that is already built.*

---

## What Modelmark is

Modelmark is a calm, trusted record of **what changed across AI models, and
whether you should care.** It is a structured release/change record and a
source-backed timeline with a calm explanation layer.

Modelmark is **not** an AI news app, a newsfeed, a blog, a hype tracker, a
best-model leaderboard, an AI tool directory, or an agent marketplace.

Every Modelmark item exists to answer four questions — the **trust
quartet**:
1. **Source** — where did this come from?
2. **Date** — when did it happen?
3. **What changed** — one factual statement.
4. **Why it matters** — calm, non-promotional relevance.

If an item cannot answer all four, it is not a Modelmark record.

---

## What Modelmark tracks

- **Model releases** — a new model or version becoming available.
- **Major model changes** — capability, context window, modality, or
  behaviour changes that materially affect use.
- **Availability changes** — region/platform availability, general
  availability vs preview, access tier changes.
- **Deprecations** — retirement or sunset of a model or endpoint.
- **Pricing / access changes** — when **material** (see definition).
- Each as a **source-backed change record**, not commentary.

## What Modelmark excludes

- Rumours and leaks without official confirmation.
- Hype, launch-marketing framing, and superlatives.
- Benchmark "wins" and leaderboard rankings.
- Opinion, blog, or editorial think-pieces.
- Community chatter and social speculation.
- Anything without a citable source.
- "Best model" verdicts. (Modelmark's USE/WATCH/IGNORE-style guidance, where
  present, is a *usefulness* note, never a ranking.)

---

## Source hierarchy

From highest to lowest trust:

1. **Official lab announcement** — the lab's own blog, official docs, model
   card, or release notes.
2. **Official platform/provider notice** — API changelog, pricing page,
   deprecation notice from the provider.
3. **Official verified social post** — from the lab's verified account.
4. **Reputable secondary reporting** — used **only as a lead** that
   something may have changed. It is never itself a published source; it
   must be confirmed against tiers 1–3 before a record is published.

A record's trust rests on the **highest tier** source backing it. Non-
official sources may *trigger* a look but never *substantiate* a published
record.

---

## Publishing rules

- A record is published **only** when it satisfies the full trust quartet
  **and** is backed by a tier 1–3 source.
- **No source ⇒ not published.** No exceptions.
- Approximate dates are permitted but must be **marked as estimates** (see
  below). A record is never given false date precision.
- "Material" is the threshold for pricing/access changes (see definition);
  immaterial fluctuations are not recorded.
- One record = one change. Bundle nothing; split compound announcements
  into discrete changes where they have distinct dates or types.
- Duplicates are checked before publish; a change already recorded is
  updated (as a correction/update), not re-published.

**Today vs later:** today, "published" means *a human added it to the
curated catalog after checking a source.* Later, "published" means *a
human approved a candidate out of the review queue into the published
database.* The bar (trust quartet + tier 1–3 source) is identical; only the
mechanism changes.

---

## Correction rules

- Corrections are **versioned, not silently overwritten.** When a published
  fact changes, the record reflects it and carries a visible corrected
  state.
- Every record conceptually retains `firstPublishedAt` and `lastUpdatedAt`
  (see data contract); corrections update the latter and set a correction
  state.
- Corrections **never fabricate precision.** (This mirrors the app's
  existing rule that migrated lab-activity flags must not invent a
  timestamp.)
- A correction explains *what* was corrected, not just *that* it was.

---

## Editorial language rules (anti-hype)

- **Calm, factual, present-tense** statements of what changed.
- **No superlatives** ("best", "game-changing", "revolutionary").
- **No urgency or hype** ("you need this now", "don't miss").
- **No implied ranking** between labs or models.
- **"Why it matters" is explanatory, not promotional** — it helps a reader
  decide whether to care, and may legitimately say *"probably not relevant
  to most users."*
- Neutral toward vendors; Modelmark records, it does not advocate.

### Separating fact from interpretation

- **Facts** (source, date, what changed) are reported plainly and are
  directly traceable to the source.
- **Interpretation** ("why it matters", any usefulness guidance) is clearly
  the explanation layer — phrased as guidance, never as fact, and never
  presented as something the source said unless it did.
- A reader must always be able to tell which sentences are sourced fact and
  which are Modelmark's calm interpretation.

### Approximate dates

- Exact date when the source gives one (e.g. `2026-06-09`).
- Month-level when only a month is known (rendered as an estimate).
- Half-year (`H1`/`H2`) or year-only for pre-announcements, always shown as
  an estimate, never as a precise day.
- The UI and any future API must distinguish *estimated* from *exact* dates
  so no false precision is implied. (The app already parses these loose
  formats; the methodology makes the honesty requirement explicit.)

### Relevance / "why it matters"

- Written for the reader's decision: *should I care?*
- Allowed to conclude "no, not for most people."
- On-device personalization (the app's Tune Radar "why it matters to you")
  is a **local interpretation layer** computed on the device from the
  user's own choices; it is never server-side profiling and never changes
  the underlying factual record.

---

## Claims: safe today vs must wait

### Safe to claim today (true of the hand-curated, read-only product)
- **Curated** — a person selects and writes each entry.
- **Calm** — no hype, no ranking.
- **Source-aware** — entries are written from sources, and sources are
  cited where shown.
- **Read-only** — the app changes nothing upstream.
- **Privacy-conscious** — no accounts, no tracking; personalization is
  on-device.
- **Model release timeline** — a curated timeline of releases/changes.
- **Useful summaries** — calm explanations of what changed.

### Must wait for the backend / review / published database
- **Automated** — there is no automated ingestion in production; the
  checker only proposes candidates.
- **Fully verified** — there is no formal verification pipeline yet.
- **Comprehensive** — coverage is curated and partial, not exhaustive.
- **Real-time** — updates are periodic and human-paced.
- **Database-backed** — there is no published database yet (curated TS +
  cache).
- **API-ready / public API** — no hardened public API product exists yet.
- **"Source-backed" in the strict sense** — usable today only when
  qualified (e.g. "written from official sources"); the strict,
  per-record, machine-verifiable claim waits for the trust-metadata data
  contract.

When in doubt, **under-claim.** Trust is the product; an overclaim costs
more than a missing adjective.

---

## Future API trust metadata

When the published database and API exist, each record should expose trust
metadata so any client can show *why* an item is trustworthy: the trust
quartet plus `sourceUrl`, `sourceTier`, `sourcePublishedAt`, `detectedAt`,
`firstPublishedAt`, `lastUpdatedAt`, `verificationState`, `correctionState`,
`changeType`, `confidence`, and (internal) `reviewedBy` / `reviewNotes`.
The public boundary (which of these are exposed publicly vs API-only vs
internal) is defined in the P11-S01 audit §9 and refined when the API is
built. **None of this is implemented yet.**

---

## Human review principles

- **Humans publish; tools propose.** No automated process publishes a
  record without human approval — today or after the backend exists.
- **The reviewer is the trust gate.** The review checklist (below) must
  pass before publish.
- **No auto-publish from extraction.** Any future automated extractor's
  output is a *candidate* only; extractor output is never trusted as fact.
- **Silence is not success.** A source going quiet is not evidence that
  nothing changed; source health is tracked separately from record content.

### Review checklist (per record, before publish)
- [ ] Source URL present and tier 1–3.
- [ ] Date verified, and marked estimate if approximate.
- [ ] "What changed" is one factual sentence, traceable to the source.
- [ ] "Why it matters" is explanatory and non-hype.
- [ ] Change type set (release / change / availability / deprecation /
      pricing).
- [ ] Lab/model resolved to a known entity (no orphan ids).
- [ ] Duplicate check against existing records.

---

## Definitions

- **Official source** — a primary source owned by the lab or provider: its
  blog, docs, model card, release notes, pricing/changelog pages, or
  verified social account (source tiers 1–3).
- **Source-backed** — an item whose factual claims are traceable to one or
  more official sources. Used strictly only once per-record source metadata
  exists; until then, qualify as "written from sources".
- **Curated** — selected and written by a human, by hand. Describes the
  current production reality.
- **Reviewed** — a human has checked the record against the review
  checklist before publish.
- **Verified** — the record's facts have been confirmed against an official
  (tier 1–3) source. A formal, recorded verification state is a future
  backend capability; today "verified" is informal and should not be
  claimed as a guarantee.
- **Candidate** — a detected, possible change that has **not** been
  reviewed or published. Candidates are private (cf. today's
  `data/update-candidates.json`) and never shown to users.
- **Published record** — a change record that passed review and is visible
  to clients. The unit of Modelmark.
- **Correction** — a versioned update to a published record's facts, with a
  visible corrected state and an explanation of what changed.
- **Material change** — a change a reasonable user would want to know about:
  pricing/access shifts that affect cost or eligibility, capability/context
  changes that affect what the model can do, availability/deprecation that
  affects whether it can be used. Cosmetic or negligible changes are
  immaterial and not recorded.

---

*This methodology is the trust contract for Modelmark. It is intentionally
conservative: it describes a curated, calm, source-aware record today, and
reserves the words "automated", "verified", "comprehensive", and
"database-backed" for when the backend earns them.*
