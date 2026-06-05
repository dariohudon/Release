import type { SonarrEpisode } from "./sonarr";

// ── Env helpers ───────────────────────────────────────────────────────────────

function plexBase(): string {
  return (process.env.PLEX_URL ?? "").replace(/\/$/, "");
}

function plexToken(): string {
  return process.env.PLEX_TOKEN ?? "";
}

export function tvLibraryName(): string {
  return process.env.PLEX_TV_LIBRARY ?? "TV Shows";
}

export function isPlexConfigured(): boolean {
  return Boolean(plexBase() && plexToken());
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlexEpisodeMatch {
  addedAt?: string; // ISO timestamp
  title?: string;
}

export type PlexLookup = Map<string, PlexEpisodeMatch>;

interface PlexSection {
  key: string;
  type: string;
  title: string;
}

interface PlexRawEpisode {
  grandparentTitle: string;
  parentIndex: number;
  index: number;
  title?: string;
  addedAt?: number; // Unix seconds
}

// ── Key helpers ───────────────────────────────────────────────────────────────

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function makeKey(showTitle: string, season: number, episode: number): string {
  return `${normalizeTitle(showTitle)}:${season}:${episode}`;
}

export function plexKey(showTitle: string, season: number, episode: number): string {
  return makeKey(showTitle, season, episode);
}

// ── Authenticated fetch helper ────────────────────────────────────────────────

async function plexGet(path: string): Promise<Response> {
  const base = plexBase();
  const token = plexToken();
  return fetch(`${base}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Plex-Token": token,
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

// ── TV section lookup ─────────────────────────────────────────────────────────

async function findTvSectionKey(): Promise<string | null> {
  const res = await plexGet("/library/sections");
  if (!res.ok) return null;
  const data = await res.json();
  const sections: PlexSection[] = data?.MediaContainer?.Directory ?? [];
  const target = tvLibraryName().toLowerCase();
  return sections.find((s) => s.type === "show" && s.title.toLowerCase() === target)?.key ?? null;
}

// ── Plex lookup builder ───────────────────────────────────────────────────────

export async function buildPlexLookup(): Promise<PlexLookup | null> {
  const base = plexBase();
  const token = plexToken();
  if (!base || !token) return null;

  let sectionKey: string | null;
  try {
    sectionKey = await findTvSectionKey();
  } catch {
    return null;
  }
  if (!sectionKey) return null;

  let res: Response;
  try {
    res = await plexGet(`/library/sections/${sectionKey}/all?type=4`);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();
  const episodes: PlexRawEpisode[] = data?.MediaContainer?.Metadata ?? [];

  const lookup: PlexLookup = new Map();
  for (const ep of episodes) {
    if (!ep.grandparentTitle) continue;
    const key = makeKey(ep.grandparentTitle, ep.parentIndex, ep.index);
    lookup.set(key, {
      addedAt: ep.addedAt ? new Date(ep.addedAt * 1000).toISOString() : undefined,
      title: ep.title,
    });
  }
  return lookup;
}

// ── Episode enrichment ────────────────────────────────────────────────────────

export function enrichWithPlex(
  episodes: SonarrEpisode[],
  lookup: PlexLookup | null
): SonarrEpisode[] {
  if (!lookup) return episodes;
  return episodes.map((ep) => {
    if (ep.status !== "downloaded") return ep;
    const match = lookup.get(plexKey(ep.showName, ep.seasonNumber, ep.episodeNumber));
    return {
      ...ep,
      inPlex: match !== undefined,
      plexAddedAt: match?.addedAt,
      status: match !== undefined ? "in_plex" : "waiting_plex",
    } as SonarrEpisode;
  });
}

// ── Health check ──────────────────────────────────────────────────────────────

export async function checkPlexHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  version?: string;
  tvLibrary: string;
  libraryFound?: boolean;
}> {
  const base = plexBase();
  const token = plexToken();
  const tvLibrary = tvLibraryName();

  if (!base || !token) return { configured: false, reachable: false, tvLibrary };

  // /identity doesn't need auth — get version
  let version: string | undefined;
  try {
    const identityRes = await fetch(`${base}/identity`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (identityRes.ok) {
      const xml = await identityRes.text();
      // Target the MediaContainer element's version attribute, not the XML declaration
      const match = xml.match(/<MediaContainer[^>]*\sversion="([^"]+)"/);
      version = match?.[1];
    }
  } catch {
    // version is optional
  }

  // Authenticated check — verify token + find library
  try {
    const res = await plexGet("/library/sections");
    if (!res.ok) return { configured: true, reachable: false, version, tvLibrary };

    const data = await res.json();
    const sections: PlexSection[] = data?.MediaContainer?.Directory ?? [];
    const target = tvLibrary.toLowerCase();
    const libraryFound = sections.some(
      (s) => s.type === "show" && s.title.toLowerCase() === target
    );

    return { configured: true, reachable: true, version, tvLibrary, libraryFound };
  } catch {
    return { configured: true, reachable: false, version, tvLibrary };
  }
}
