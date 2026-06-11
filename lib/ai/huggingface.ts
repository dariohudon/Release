import { LABS, LAB_IDS, LabId, ModelRelease } from "./types";

// Live source: Hugging Face public API (no key required). Polls each lab's HF
// org for recently created model repos and surfaces the notable ones as
// open-weights drops. Failures degrade silently to the curated dataset.

interface HfModel {
  id: string; // "org/repo"
  createdAt?: string;
  likes?: number;
  downloads?: number;
  pipeline_tag?: string;
}

const WINDOW_DAYS = 90; // only surface repos created in the last N days
const MIN_LIKES = 20; // skip noise (config dumps, tiny checkpoints)
const PER_ORG_LIMIT = 12;

function repoToName(repoId: string): string {
  return repoId.split("/")[1] ?? repoId;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchOrg(org: string, lab: LabId): Promise<ModelRelease[]> {
  const params = new URLSearchParams({
    author: org,
    sort: "createdAt",
    direction: "-1",
    limit: String(PER_ORG_LIMIT),
  });

  const response = await fetch(`https://huggingface.co/api/models?${params}`, {
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 21600 },
  });
  if (!response.ok) throw new Error(`HF_ERROR:${response.status}`);

  const data: HfModel[] = await response.json();
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return data
    .filter((m) => {
      if (!m.createdAt || new Date(m.createdAt).getTime() < cutoff) return false;
      return (m.likes ?? 0) >= MIN_LIKES;
    })
    .map((m) => ({
      id: `hf:${m.id}`,
      lab,
      name: repoToName(m.id),
      date: m.createdAt!,
      kind: "open-weights" as const,
      summary: `New on Hugging Face — ${(m.downloads ?? 0).toLocaleString("en-US")} downloads, ${(m.likes ?? 0).toLocaleString("en-US")} likes.`,
      tags: m.pipeline_tag ? [m.pipeline_tag.replace(/-/g, " ")] : [],
      url: `https://huggingface.co/${m.id}`,
      source: "huggingface" as const,
    }));
}

export interface LiveResult {
  releases: ModelRelease[];
  live: boolean; // true if at least one org poll succeeded
}

export async function fetchHuggingFaceReleases(known: ModelRelease[]): Promise<LiveResult> {
  const jobs = LAB_IDS.flatMap((labId) =>
    LABS[labId].hfOrgs.map((org) => fetchOrg(org, labId))
  );
  const settled = await Promise.allSettled(jobs);

  const live = settled.some((r) => r.status === "fulfilled");
  const fetched = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Drop HF repos that duplicate a curated entry (e.g. the curated card for a
  // launch and its HF weights repo) — match on normalized name containment.
  const knownNames = known.map((r) => normalize(r.name)).filter((n) => n.length >= 4);
  const releases = fetched.filter((r) => {
    const n = normalize(r.name);
    return !knownNames.some((k) => n.includes(k) || k.includes(n));
  });

  return { releases, live };
}
