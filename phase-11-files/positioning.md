# Modelmark — Product Positioning

*Status: standing positioning reference (Phase 11, P11-S03). This document
is the source of truth for how Modelmark is described — in the app, on the
App Store, on the website, and around the future API. It sits alongside
`docs/methodology.md` (the trust contract) and inherits its honesty rules.*

*Honesty anchor: today the catalog is **hand-curated** and the app is a
**read-only client**. This document separates what Modelmark may claim
**now (v1)** from what it may claim **later (after the backend/trust
pipeline exists)**. When unsure, use the v1 language.*

---

## One-sentence positioning

**Modelmark is a calm, source-aware record of what changed across AI
models — and whether you should care.**

## Short positioning paragraph

AI models change constantly — new versions, capability and pricing shifts,
availability changes, deprecations — and most of it arrives as hype,
threads, and headlines. Modelmark is the calm alternative: a curated,
source-aware timeline of model releases and changes, each with a
plain-language note on what changed and why it might matter. It is a
**record, not a feed** — built to be trusted and skimmed, not to chase
engagement.

## Primary user question

**"What changed across AI models, and should I care?"**

---

## What Modelmark is

- A **structured model release/change record**.
- A **source-aware timeline** of AI model changes.
- A **calm explanation layer** over those changes.
- A **future data product** with app, web, API, and admin surfaces.

## What Modelmark is not

- Not an AI **news app**.
- Not a **newsfeed**.
- Not a **blog**.
- Not a **hype tracker**.
- Not a **best-model leaderboard**.
- Not an **AI tool directory**.
- Not an **AI agent marketplace**.

---

## Category definition

**Modelmark is a model-change intelligence record — not a news app.**

The category is closer to a *changelog / system-of-record for AI models*
than to media. "Intelligence record" captures both halves: it records
*changes* (facts), and it adds a thin layer of *intelligence* (calm "why it
matters"). It competes with the effort of manually tracking many labs'
announcements — not with news outlets.

---

## Current v1 positioning (safe today)

> **"A calm, curated, source-aware timeline of AI model releases and
> changes, with plain-language summaries of what changed and why it might
> matter."**

True today because: entries are hand-written by a person (**curated**),
written from sources and cite them where shown (**source-aware**),
presented as a **timeline**, with calm summaries. The app is **read-only**
and **privacy-conscious** (no account, no tracking).

## Future positioning (only after backend/trust pipeline exists)

> **"A source-backed model-change record with reviewable trust metadata,
> historical records, and structured API access."**

Claimable only once the published database, review queue, and API exist
(later phases). Until then, the strict words below stay reserved.

---

## "Source-aware" vs "source-backed"

- **Use "source-aware" now.** It honestly says entries are written from
  sources and reference them, without promising a per-record,
  machine-verifiable source trail.
- **Reserve "source-backed" (strict)** for after the trust-quartet data
  contract and review pipeline exist, when every record carries a verifiable
  source. Until then, only use it **qualified** — e.g. "written from
  official sources" — never bare.
- Rule of thumb: *aware* describes the editorial practice (true now);
  *backed* describes a structural guarantee (future).

## Talking about trust without overclaiming

- Describe the **practice** ("we write from official sources first, and skip
  rumours"), not a **guarantee** ("every item is verified").
- Never imply **automation**, **completeness**, or **real-time** coverage.
- It is fine — and on-brand — to say coverage is **selective and curated**.
- Prefer "we aim to…" / "we don't…" over "we always…".

## Talking about News/Updates without sounding like a newsfeed

- **Do not position around "news."** No "AI news", "headlines", "stories",
  "feed", "trending".
- The future surface name is **"Updates"** (or "Changes") — meaning
  **source-aware model/lab changes**, not general AI news.
- Frame it as *"recent changes from the labs you follow,"* not *"the latest
  AI news."*
- A model/lab **update** answers the trust quartet (source, date, what
  changed, why it matters); a **headline** does not — that's the line.

---

## Approved language

calm · curated · source-aware · read-only · privacy-conscious · model
release timeline · model **changes** / **updates** · plain-language
summaries · "what changed and why it might matter" · record · selective ·
on-device personalization · "the labs you follow".

## Risky / banned language

**Banned in v1** (overclaims today): automated · automatically tracks ·
fully verified · verified · comprehensive · every model / complete ·
real-time / live · database-backed · API-ready / "our API" · "source-backed"
(bare/unqualified).

**Banned always** (off-brand for the category): news · newsfeed · headlines
· stories · trending · hype · breaking · "best model" · leaderboard ·
ranking · "#1" · directory · marketplace · superlatives ("game-changing",
"revolutionary") · urgency ("don't miss", "you need this").

---

## App Store positioning guidance (v1)

- Lead with the v1 sentence above.
- Emphasize **calm, curated, privacy-conscious, read-only, no account**.
- Describe the timeline + plain-language "what changed / why it matters".
- **Avoid** automation/verification/completeness/real-time/API claims.
- If the Updates surface ships, describe it as "recent source-aware changes
  from labs you follow", clearly distinct from "news".
- Keywords may include factual category terms (AI models, releases, changes,
  timeline) but **not** "news" or "leaderboard".

## Website positioning guidance

- Same one-sentence positioning as the hero.
- The public web timeline is a **bounded, calm** view (recent window +
  paginated history per the P11-S01 boundary), not a full data dump.
- May describe the *direction* (web, API, admin) as roadmap, clearly labeled
  "coming" — never as already shipped.
- Link to `methodology.md` to make the trust practice legible.

## API / data-product positioning guidance (future)

- Position future API value around: **maintained structured data**,
  **source trails**, **historical records**, **change metadata**,
  **exports**, **webhooks**, and **commercial usage rights**.
- **Do not imply the API exists today.** Anything API-facing is roadmap
  until P11-S09. Use future tense and "planned/coming".
- The commercial value is the *curated, verified, historical corpus* — not
  raw scraping; protect it per the P11-S01 public/private boundary.

---

## Differentiators

- **Record, not feed** — built to be trusted and skimmed, not to maximize
  engagement.
- **Calm and selective** — curated signal over volume.
- **Trust quartet** — source, date, what changed, why it matters (the
  future structural backbone).
- **Privacy-conscious** — no account, no tracking; personalization on-device.
- **Cross-lab** — one record across many labs, vs each lab's own blog.

## Anti-positioning (what we deliberately are not, and why)

- **Not a newsfeed** — feeds optimize for novelty/engagement; we optimize for
  a trustworthy record.
- **Not a leaderboard** — rankings invite hype and go stale; we record
  changes, not verdicts.
- **Not a directory/marketplace** — we don't list/sell tools or agents.
- **Not a blog** — no opinion or think-pieces; facts + calm relevance only.

---

## Audience distinction

- **App user (now):** a busy practitioner/decision-maker who wants to know
  *what changed and whether to care*, calmly, without doom-scrolling. Values
  trust, brevity, privacy. The v1 positioning speaks to this person.
- **Future API / data user (later):** developers, analysts, and businesses
  who want **maintained, structured, source-trailed historical change data**
  via API/exports/webhooks, with commercial usage rights. The future
  positioning speaks to this person — and must not be implied as available
  yet.

---

## Product implications

- The **Updates** direction (fold News into source-aware change records;
  name "Updates") is the positioning-consistent path; "News" framing should
  not persist. (Implementation deferred — see methodology §7 / P11-S02.)
- "Best model"/ranking framing must be audited out of any guidance copy
  (USE/WATCH/IGNORE stays a *usefulness* note, never a ranking).
- The record/feed distinction should shape UI tone (calm, skimmable),
  reinforcing the brand at the surface level.

## Copy implications for P11-S04 (App Copy / Trust Alignment)

- Bring all shipped strings within the **Approved / Banned** lists above and
  the methodology §9 claim boundaries — **without** renaming RMR→Modelmark
  (that's P11-S05's identity sprint, sequenced after).
- Apply the Updates decision at the **copy level**: lead with official
  sources, label non-official as less authoritative (bridge **D**), or
  remove the surface from v1 (**C**) if honest labeling isn't clean.
- Remove/qualify any current wording implying automation, verification,
  completeness, real-time, or an existing API.
- Keep "radar"/"Tune Radar" wording for now if it's entangled with identity;
  flag it for the rename sprint rather than half-renaming here.

---

*This positioning is intentionally conservative and honest. It lets
Modelmark sound like what it is today — a calm, curated, source-aware record
— while reserving the stronger "source-backed / verified / API" language for
when the backend makes it true.*
