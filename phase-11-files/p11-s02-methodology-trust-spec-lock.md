# P11-S02 — Methodology & Trust Spec Lock

Phase 11 — Modelmark Identity & Automation Architecture
Sprint P11-S02 · docs-only · no app code changed.
Baseline: `phase-11-s01-current-data-reality-modelmark-scope-audit-lock`.

---

## 1. Executive Summary

This sprint locks the **methodology and trust specification** for Modelmark
**before** any rename, App Store copy, News-tab change, backend, API claim,
or automation — exactly the order P11-S01 recommended. The deliverable is
`docs/methodology.md` (the standing trust contract) plus this report.

The methodology is deliberately conservative and **honest about today's
hand-curated, read-only reality**. It defines what Modelmark tracks and
excludes, a four-tier source hierarchy, publishing/correction/editorial
rules, the fact-vs-interpretation separation, approximate-date handling,
and a precise vocabulary (official source, source-backed, curated,
reviewed, verified, candidate, published record, correction, material
change). Crucially it splits **claims safe today** (curated, calm,
source-aware, read-only, privacy-conscious, release timeline, useful
summaries) from **claims that must wait** for the backend (automated,
fully verified, comprehensive, real-time, database-backed, API-ready, and
strict "source-backed").

Two decisions are locked here on paper (neither implemented):
- **News → Updates direction:** the destination is **B (fold News into
  structured, source-backed change records)**, surfaced under the name
  **"Updates" (A)**. For App Store v1, before the backend exists, the safe
  bridge is **D (keep, but clearly label authority and lead with official
  sources)** — with **C (remove from v1)** as the fallback if honest
  labeling can't be done cleanly. See §7.
- **Trust quartet as the data contract:** every future change record must
  carry **source, date, what changed, why it matters**, with a defined set
  of optional trust metadata. See §8.

No app code, UI copy, rename, or backend was touched.

---

## 2. Methodology Lock

`docs/methodology.md` is created and is the canonical reference. Locked
points:
- **Mandate:** "What changed across AI models, and should I care?" — a
  calm, trusted **record**, not news/feed/blog/leaderboard/directory.
- **Trust quartet** is mandatory: no source/date/what/why ⇒ not a record.
- **Tracks:** releases, major changes, availability changes, deprecations,
  material pricing/access changes — as source-backed change records.
- **Excludes:** rumours, hype, benchmarks-as-wins, opinion, chatter,
  unsourced items, "best model" verdicts.
- **Humans publish; tools propose** — true today and after the backend.
- **Under-claim by default** — trust is the product.

## 3. Source Hierarchy

1. Official lab announcement (blog, docs, model card, release notes).
2. Official platform/provider notice (API changelog, pricing, deprecation).
3. Official verified social post.
4. Reputable secondary reporting — **lead only**, never a published source;
   must be confirmed against tiers 1–3 before publish.

A record's trust = its highest-tier source. Non-official sources trigger a
look but never substantiate a published record.

## 4. Publishing Rules

- Publish only with the full trust quartet **and** a tier 1–3 source.
- No source ⇒ not published.
- Approximate dates allowed but always marked as estimates; never fake
  precision.
- "Material" gates pricing/access records.
- One record = one change; de-duplicate before publish.
- **Today:** "published" = a human added it to the curated catalog after
  checking a source. **Later:** = a human approved a candidate from the
  review queue into the published DB. Same bar, different mechanism.

## 5. Correction Rules

- Versioned, never silent; visible corrected state.
- Retain `firstPublishedAt` / `lastUpdatedAt` conceptually.
- Never fabricate precision (mirrors the app's no-invented-timestamp rule).
- A correction explains what was corrected.

## 6. Editorial Language Rules

- Calm, factual, present-tense; no superlatives, no urgency, no implied
  ranking.
- "Why it matters" is explanatory, may say "probably not relevant to most."
- Facts (source/date/what) are traceable; interpretation (why it matters,
  any usefulness note) is clearly the explanation layer, never presented as
  sourced fact.
- On-device personalization is local interpretation only, never profiling,
  never alters the factual record.

## 7. News / Updates Decision (explicit recommendation)

**Context:** the current "News" surface — including a non-official
"news-search" fallback upstream — is the single biggest positioning risk
for a product branded as a *trusted record*.

**Options considered:** A rename/reframe to "Updates"; B fold into
structured change records; C remove from App Store v1; D keep temporarily
but label as less authoritative.

**Recommendation (paper only — not implemented this sprint):**

- **Destination = B, named via A.** The true Modelmark direction is to
  **fold the News surface into structured, source-backed change records**
  and surface them under the calm name **"Updates"** (not "News",
  "stories", or "headlines"). This *is* what Modelmark is; a separate
  newsfeed should not survive long-term.
- **App Store v1 bridge = D, with strict guardrails.** Because structured
  change records require the backend (which does not exist yet), v1 should
  **keep the existing Updates surface only if** it: (1) leads with official
  (tier 1–3) sources, (2) **clearly labels** any non-official item as less
  authoritative, and (3) never presents the surface as a verified/automated
  record.
- **Fallback = C.** If that honest labeling cannot be implemented cleanly
  and calmly in the later copy/rename sprint, **remove the surface from
  App Store v1** rather than ship something that reads as a hype newsfeed
  under a trust brand. Removal is preferable to an overclaim.

**Not** recommended: keeping "News" framing as-is (A alone, without B's
substance) — a rename without the authority labeling would be cosmetic and
still risk the trust positioning.

This decision is recorded, not built. Implementation belongs to the later
copy-alignment sprint (and, for B, to the data-model + backend phases).

## 8. Trust Quartet Data Contract (future — paper only)

Every future Modelmark change record **must** include the quartet:

| Field | Meaning | Required |
|---|---|---|
| `source` | where it came from (official tier 1–3) | **Yes** |
| `date` | when the change happened (exact or marked estimate) | **Yes** |
| `whatChanged` | one factual statement | **Yes** |
| `whyItMatters` | calm, non-promotional relevance | **Yes** |

Optional future metadata (defined, not implemented):

| Field | Meaning |
|---|---|
| `sourceUrl` | canonical link to the official source |
| `sourceTier` | 1–4 per §3 (published records are 1–3) |
| `sourcePublishedAt` | timestamp the source published |
| `detectedAt` | when the checker first detected a candidate |
| `firstPublishedAt` | when Modelmark first published the record |
| `lastUpdatedAt` | last correction/update |
| `verificationState` | candidate / reviewed / verified / corrected |
| `correctionState` | none / corrected (+ what) |
| `changeType` | release / change / availability / deprecation / pricing |
| `confidence` | model/extraction confidence (internal-leaning) |
| `reviewedBy` | reviewer identity (internal) |
| `reviewNotes` | review rationale (internal) |

Public vs API-only vs internal exposure follows P11-S01 §9. Required-quartet
fields are public; review internals (`reviewedBy`, `reviewNotes`,
`confidence`) stay private/internal.

**This is a contract on paper.** No schema, type, migration, or API is
created in this sprint.

## 9. App Store v1 Claim Boundaries

**Safe to claim today** (true of the curated, read-only product):
curated · calm · source-aware · read-only · privacy-conscious · model
release timeline · useful summaries.

**Unsafe today — must wait** (qualify or omit):
automated · fully verified · comprehensive · real-time · database-backed ·
API-ready · "source-backed" in the strict sense (usable only when qualified
as "written from official sources").

**Safest v1 description language (recommended):**
> "A calm, curated, source-aware timeline of AI model releases and changes,
> with plain-language summaries of what changed and why it might matter.
> Read-only and privacy-conscious — no account, no tracking."

Avoid in v1 copy: "automatically tracks", "verified", "comprehensive/every
model", "real-time", "the database of record".

## 10. Future Backend / API Trust Metadata

When the published DB + API exist (later phases), records expose the quartet
plus the §8 metadata so any client can show *why* an item is trustworthy.
Verification/correction states become formal and recorded rather than
informal. Source health is tracked separately from record content (silence
≠ "nothing changed"). None of this is implemented now; it is the target the
methodology points at.

## 11. Risks and Unknowns

- **Overclaim risk remains the top risk** until copy is aligned (next
  sprint) — the methodology reduces it but does not change shipped copy yet.
- **News/Updates is decided on paper only;** the v1 outcome (D vs C) depends
  on whether honest authority-labeling is achievable in the copy sprint.
- **Trust quartet is uncoupled from current data:** today's records are
  *models* with `released`/`useFor`, not *changes* with source/what/why.
  Adopting the contract is a real data-model + API change (later, coordinated
  web+app), not a copy tweak.
- **"Verified" temptation:** easy to imply more rigor than exists; the
  definitions deliberately keep "verified" informal until the backend.
- **Process caveat:** authored in a cloud mirror, no Xcode; docs-only, so no
  build is implicated, but the branch must be applied/pushed on the Mac to
  be reviewable (see delivery note).

## 12. Recommended Sprint Sequence

1. P11-S01 — audit + plan. ✅ (locked)
2. **P11-S02 (this)** — methodology & trust spec lock. ✅
3. **P11-S03 — App copy / trust alignment (no rename):** bring in-app
   language within the §9 boundaries; apply the §7 v1 decision (D guardrails
   or C) to the Updates surface. *App copy only, still RMR-named.*
4. P11-S04 — Identity rename (RMR/Radar → Modelmark): target, bundle id,
   App Group, widget kind, copy, docs, tests. One deliberate pre-submission
   sprint.
5. P11-S05 — Data model: `ModelChange` + trust quartet/metadata across
   web/API + app. *Coordinated.*
6. P11-S06 — Backend foundation (managed Postgres + schema + seed import).
7. P11-S07 — Ingestion (source registry, scheduled checker, change detector).
8. P11-S08 — Review queue + admin.
9. P11-S09 — Public API hardening (keys, limits, boundary).
10. P11-S10 — Web app on the published DB.
11. P11-S11 — App Store submission under Modelmark.

## 13. Recommended Immediate Next Sprint

**P11-S03 — App Copy / Trust Alignment (app copy only, no rename).**

Why next, why safe:
- The methodology now exists, so copy can be measured against §9 boundaries.
- It removes the **live overclaim risk** in shipped copy *before* the
  rename, so the App Store-facing language is honest regardless of name.
- It applies the §7 Updates decision at the copy level (D guardrails: lead
  with official, label non-official; or C: remove for v1) **without**
  touching the data model or backend.

Scope guardrails for P11-S03: change **only** user-facing strings and the
Updates surface's authority presentation; **no rename**, no type/enum
renames, no API/backend, no schema. Keep it a contained, reviewable copy
sprint.

---

*End of P11-S02. Docs-only. No app code, UI copy, rename, bundle/App Group/
widget/target/scheme/test/project change, backend, API, admin, schema,
automation, or deployment configuration was changed.*
