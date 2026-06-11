/* ──────────────────────────────────────────────────────────────
   MODEL RADAR — daily update checker (read-only)

   Gathers CANDIDATE model releases/updates from public sources and
   writes them for human/Claude review. It never edits the live
   catalog (lib/models/data.ts), never commits, never deploys.

   Run:   npm run check:updates
   Cron:  15 7 * * * cd /var/www/release && npm run check:updates >> logs/model-radar-check.log 2>&1

   Outputs:
     data/update-candidates.json      — accumulated candidates (deduped)
     docs/model-radar-update-log.md   — appended human-readable run log
   ────────────────────────────────────────────────────────────── */

import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS, Model } from "../lib/models/data";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATES_PATH = join(ROOT, "data", "update-candidates.json");
const LOG_PATH = join(ROOT, "docs", "model-radar-update-log.md");
const STATUS_PATH = join(ROOT, "data", "update-status.json");

const RECENT_DAYS = 14; // only surface things from the last two weeks
const FETCH_TIMEOUT_MS = 8000;
const HF_MIN_LIKES = 10; // skip config dumps / tiny checkpoints

// ── Types ─────────────────────────────────────────────────────────────────────

type CandidateType = "official" | "model-card" | "openrouter" | "news" | "unknown";
type Confidence = "high" | "medium" | "low";
type SuggestedAction = "review" | "ignore" | "add-to-catalog" | "update-existing";

interface Candidate {
  title: string;
  sourceName: string;
  sourceUrl: string;
  detectedAt: string;
  lab: string; // lab guess (LABS key or "unknown")
  candidateType: CandidateType;
  confidence: Confidence;
  reason: string;
  suggestedAction: SuggestedAction;
  matchedExistingModelId?: string;
  rawDate?: string;
}

interface CandidateStore {
  updatedAt: string;
  candidates: Candidate[];
}

// ── Source config ─────────────────────────────────────────────────────────────

const HF_ORGS: { org: string; lab: string }[] = [
  { org: "openai", lab: "openai" },
  { org: "anthropic", lab: "anthropic" },
  { org: "google", lab: "google" },
  { org: "meta-llama", lab: "meta" },
  { org: "mistralai", lab: "mistral" },
  { org: "deepseek-ai", lab: "deepseek" },
  { org: "Qwen", lab: "alibaba" },
  { org: "zai-org", lab: "zai" },
  { org: "moonshotai", lab: "moonshot" },
  { org: "microsoft", lab: "microsoft" },
];

const NEWS_QUERIES: { query: string; lab: string }[] = [
  { query: "OpenAI new model", lab: "openai" },
  { query: "Anthropic new model", lab: "anthropic" },
  { query: "Google DeepMind new model", lab: "google" },
  { query: "Meta Llama new model", lab: "meta" },
  { query: "Mistral new model", lab: "mistral" },
  { query: "DeepSeek new model", lab: "deepseek" },
  { query: "Qwen new model", lab: "alibaba" },
  { query: "xAI Grok new model", lab: "xai" },
];

// OpenRouter id prefixes → catalog lab keys
const OPENROUTER_LABS: Record<string, string> = {
  "openai": "openai", "anthropic": "anthropic", "google": "google",
  "meta-llama": "meta", "mistralai": "mistral", "deepseek": "deepseek",
  "qwen": "alibaba", "z-ai": "zai", "moonshotai": "moonshot",
  "microsoft": "microsoft", "x-ai": "xai", "minimax": "minimax",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();
const cutoffMs = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeUrl(u: string): string {
  return u.replace(/^https?:\/\//, "").replace(/\/$/, "").split("?")[0].toLowerCase();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "model-radar-update-check/1.0 (personal, read-only)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}

// Looks-like-a-rumour heuristic for news titles
const RUMOUR_RE = /\b(rumou?r|leak|reportedly|might|may launch|could|expected|teaser|upcoming|hints?)\b/i;

// Match a candidate title against the existing catalog. Returns the model id
// when the title clearly contains a tracked model's name (or vice versa).
function matchCatalog(title: string): Model | undefined {
  const t = normalize(title);
  return MODELS.find((m) => {
    const n = normalize(m.name);
    return n.length >= 5 && (t.includes(n) || n.includes(t));
  });
}

function decideAction(type: CandidateType, confidence: Confidence, matched?: Model, rumour = false): SuggestedAction {
  if (matched) return type === "news" ? "ignore" : "update-existing";
  if (rumour) return "review"; // never add-to-catalog from rumours
  if (type === "news") return "review"; // news alone never adds to catalog
  if (confidence === "high") return "add-to-catalog";
  return "review";
}

// ── Sources ───────────────────────────────────────────────────────────────────

interface HfModel { id: string; createdAt?: string; likes?: number; pipeline_tag?: string }

async function checkHfOrg(org: string, lab: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ author: org, sort: "createdAt", direction: "-1", limit: "12" });
  const data = await fetchJson<HfModel[]>(`https://huggingface.co/api/models?${params}`);
  return data
    .filter((m) => m.createdAt && new Date(m.createdAt).getTime() >= cutoffMs && (m.likes ?? 0) >= HF_MIN_LIKES)
    .map((m) => {
      const title = m.id;
      const matched = matchCatalog(m.id.split("/")[1] ?? m.id);
      const confidence: Confidence = (m.likes ?? 0) >= 50 ? "high" : "medium";
      return {
        title,
        sourceName: `Hugging Face · ${org}`,
        sourceUrl: `https://huggingface.co/${m.id}`,
        detectedAt: nowIso(),
        lab,
        candidateType: "model-card" as const,
        confidence,
        reason: `New model repo (${m.likes ?? 0} likes${m.pipeline_tag ? `, ${m.pipeline_tag}` : ""}) created ${m.createdAt?.slice(0, 10)}`,
        suggestedAction: decideAction("model-card", confidence, matched),
        ...(matched ? { matchedExistingModelId: matched.id } : {}),
        rawDate: m.createdAt,
      };
    });
}

interface OpenRouterModel { id: string; name?: string; created?: number }

async function checkOpenRouter(): Promise<Candidate[]> {
  const data = await fetchJson<{ data: OpenRouterModel[] }>("https://openrouter.ai/api/v1/models");
  return (data.data ?? [])
    .filter((m) => m.created && m.created * 1000 >= cutoffMs)
    .map((m) => {
      const prefix = m.id.split("/")[0]?.toLowerCase() ?? "";
      const lab = OPENROUTER_LABS[prefix] ?? "unknown";
      const title = m.name ?? m.id;
      const matched = matchCatalog(title);
      // Listed on a commercial router = genuinely available, not a rumour.
      const confidence: Confidence = lab === "unknown" ? "medium" : "high";
      return {
        title,
        sourceName: "OpenRouter",
        sourceUrl: `https://openrouter.ai/${m.id}`,
        detectedAt: nowIso(),
        lab,
        candidateType: "openrouter" as const,
        confidence,
        reason: `Newly listed on OpenRouter ${new Date(m.created! * 1000).toISOString().slice(0, 10)}`,
        suggestedAction: decideAction("openrouter", confidence, matched),
        ...(matched ? { matchedExistingModelId: matched.id } : {}),
        rawDate: new Date(m.created! * 1000).toISOString(),
      };
    });
}

function rssTag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .trim();
}

async function checkNews(query: string, lab: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ q: query, hl: "en-US", gl: "US", ceid: "US:en" });
  const xml = await fetchText(`https://news.google.com/rss/search?${params}`);
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: Candidate[] = [];
  for (const block of items.slice(0, 8)) {
    const title = rssTag(block, "title");
    const url = rssTag(block, "link");
    const pubDate = rssTag(block, "pubDate");
    if (!title || !url) continue;
    if (pubDate && new Date(pubDate).getTime() < cutoffMs) continue;
    const rumour = RUMOUR_RE.test(title);
    const matched = matchCatalog(title);
    const confidence: Confidence = rumour ? "low" : "medium"; // news alone is never high
    out.push({
      title,
      sourceName: `Google News · "${query}"`,
      sourceUrl: url,
      detectedAt: nowIso(),
      lab,
      candidateType: "news",
      confidence,
      reason: rumour
        ? "News result with rumour-style wording — treat as horizon/cadence estimate at best"
        : `News result for "${query}"${pubDate ? `, published ${new Date(pubDate).toISOString().slice(0, 10)}` : ""}`,
      suggestedAction: decideAction("news", confidence, matched, rumour),
      ...(matched ? { matchedExistingModelId: matched.id } : {}),
      ...(pubDate ? { rawDate: pubDate } : {}),
    });
  }
  return out;
}

// ── Store / report ────────────────────────────────────────────────────────────

function loadStore(): CandidateStore {
  if (!existsSync(CANDIDATES_PATH)) return { updatedAt: nowIso(), candidates: [] };
  try {
    return JSON.parse(readFileSync(CANDIDATES_PATH, "utf8")) as CandidateStore;
  } catch {
    return { updatedAt: nowIso(), candidates: [] };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const failures: string[] = [];
  const found: Candidate[] = [];

  type Job = { name: string; run: () => Promise<Candidate[]> };
  const jobs: Job[] = [
    ...HF_ORGS.map((h) => ({ name: `huggingface/${h.org}`, run: () => checkHfOrg(h.org, h.lab) })),
    { name: "openrouter", run: () => checkOpenRouter() },
    ...NEWS_QUERIES.map((n) => ({ name: `news/"${n.query}"`, run: () => checkNews(n.query, n.lab) })),
  ];

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") found.push(...r.value);
    else failures.push(`${jobs[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
  });

  // Dedupe within this run and against the stored candidates
  const store = loadStore();
  const seen = new Set<string>();
  for (const c of store.candidates) {
    seen.add(normalizeUrl(c.sourceUrl));
    seen.add(normalize(c.title));
  }
  const fresh: Candidate[] = [];
  for (const c of found) {
    const keyUrl = normalizeUrl(c.sourceUrl);
    const keyTitle = normalize(c.title);
    if (seen.has(keyUrl) || seen.has(keyTitle)) continue;
    seen.add(keyUrl);
    seen.add(keyTitle);
    fresh.push(c);
  }

  store.candidates.push(...fresh);
  store.updatedAt = nowIso();
  mkdirSync(dirname(CANDIDATES_PATH), { recursive: true });
  writeFileSync(CANDIDATES_PATH, JSON.stringify(store, null, 2) + "\n");

  // Markdown run log (append)
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  if (!existsSync(LOG_PATH)) {
    appendFileSync(
      LOG_PATH,
      "# Model Radar — update check log\n\nRead-only candidate runs. The live catalog (lib/models/data.ts) is only ever edited by hand after review.\n"
    );
  }
  const lines: string[] = [
    `\n## ${nowIso()}`,
    `Sources checked: ${jobs.length} · candidates found: ${found.length} · new: ${fresh.length} · failed sources: ${failures.length}`,
  ];
  if (fresh.length > 0) {
    lines.push("", "| Candidate | Lab | Type | Confidence | Suggested | Source |", "|---|---|---|---|---|---|");
    for (const c of fresh) {
      lines.push(`| ${c.title.replace(/\|/g, "/")} | ${c.lab} | ${c.candidateType} | ${c.confidence} | ${c.suggestedAction} | [${c.sourceName}](${c.sourceUrl}) |`);
    }
  }
  if (failures.length > 0) {
    lines.push("", "Failed sources (non-fatal):", ...failures.map((f) => `- ${f}`));
  }
  appendFileSync(LOG_PATH, lines.join("\n") + "\n");

  // Runtime status for the app header ("last checked"). Written on every
  // completed run — source failures are counted, not fatal.
  writeFileSync(
    STATUS_PATH,
    JSON.stringify(
      {
        lastCheckedAt: nowIso(),
        sourcesChecked: jobs.length,
        candidatesFound: found.length,
        newCandidates: fresh.length,
        failedSources: failures.length,
      },
      null,
      2
    ) + "\n"
  );

  // CLI summary
  console.log("── Model Radar update check ─────────────────────────");
  console.log(`sources checked : ${jobs.length}`);
  console.log(`candidates found: ${found.length}`);
  console.log(`new candidates  : ${fresh.length}`);
  console.log(`candidates file : ${CANDIDATES_PATH}`);
  console.log(`run log         : ${LOG_PATH}`);
  console.log(`status file     : ${STATUS_PATH}`);
  if (failures.length > 0) {
    console.log(`failed sources  : ${failures.length}`);
    for (const f of failures) console.log(`  ✗ ${f}`);
  } else {
    console.log("failed sources  : none");
  }
  console.log("Reminder: review candidates by hand — this never edits lib/models/data.ts.");
}

main().catch((err) => {
  // Even a top-level failure should exit cleanly for cron; log and move on.
  console.error("update check failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
