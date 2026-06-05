export type EpisodeStatus =
  | "upcoming"
  | "downloaded"      // hasFile=true, Plex not checked
  | "in_plex"         // hasFile=true + confirmed in Plex
  | "waiting_plex"    // hasFile=true + NOT yet visible in Plex
  | "missing"
  | "released"
  | "downloading";

// ── Shared ────────────────────────────────────────────────────────────────────

interface SonarrImage {
  coverType: string;
  url?: string;
  remoteUrl?: string;
}

function posterFromImages(images?: SonarrImage[]): string | null {
  const img = images?.find((i) => i.coverType === "poster");
  return img?.remoteUrl ?? img?.url ?? null;
}

function sonarrBase(): string {
  return (process.env.SONARR_URL ?? "").replace(/\/$/, "");
}

function sonarrKey(): string {
  return process.env.SONARR_API_KEY ?? "";
}

export function isSonarrConfigured(): boolean {
  return Boolean(sonarrBase() && sonarrKey());
}

// ── Episode (calendar) ────────────────────────────────────────────────────────

export interface SonarrEpisode {
  id: number;
  seriesId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeCode: string;
  episodeTitle: string;
  releaseDate: string; // airDateUtc ISO string
  airDateLocal: string; // YYYY-MM-DD
  hasFile: boolean;
  monitored: boolean;
  status: EpisodeStatus;
  posterUrl: string | null;
  // Plex enrichment (null = not yet checked)
  inPlex: boolean | null;
  plexAddedAt?: string;
}

interface SonarrRawEpisode {
  id: number;
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  hasFile: boolean;
  monitored: boolean;
  series?: {
    id: number;
    title: string;
    titleSlug?: string;
    images?: SonarrImage[];
  };
}

function formatEpisodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function deriveStatus(airDateUtc: string, hasFile: boolean): EpisodeStatus {
  const aired = new Date(airDateUtc);
  if (aired > new Date()) return "upcoming";
  return hasFile ? "downloaded" : "missing";
}

function normalizeEpisode(raw: SonarrRawEpisode): SonarrEpisode {
  const releaseDate = raw.airDateUtc || `${raw.airDate}T00:00:00Z`;
  return {
    id: raw.id,
    seriesId: raw.seriesId,
    showName: raw.series?.title ?? "Unknown Show",
    seasonNumber: raw.seasonNumber,
    episodeNumber: raw.episodeNumber,
    episodeCode: formatEpisodeCode(raw.seasonNumber, raw.episodeNumber),
    episodeTitle: raw.title || "TBA",
    releaseDate,
    airDateLocal: raw.airDate,
    hasFile: raw.hasFile,
    monitored: raw.monitored,
    status: deriveStatus(releaseDate, raw.hasFile),
    posterUrl: posterFromImages(raw.series?.images),
    inPlex: null,
  };
}

export async function fetchCalendar(): Promise<SonarrEpisode[]> {
  const base = sonarrBase();
  const key = sonarrKey();
  if (!base || !key) throw new Error("SONARR_NOT_CONFIGURED");

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  const params = new URLSearchParams({
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    includeSeries: "true",
  });

  let response: Response;
  try {
    response = await fetch(`${base}/api/v3/calendar?${params}`, {
      headers: { "X-Api-Key": key },
      cache: "no-store",
    });
  } catch {
    throw new Error("SONARR_UNREACHABLE");
  }

  if (!response.ok) throw new Error(`SONARR_ERROR:${response.status}`);

  const data: SonarrRawEpisode[] = await response.json();
  return data
    .map(normalizeEpisode)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
}

// ── Series (monitored shows) ──────────────────────────────────────────────────

export interface SonarrShow {
  id: number;
  title: string;
  monitored: boolean;
  status: string;
  nextAiring?: string;
  previousAiring?: string;
  posterUrl: string | null;
  network?: string;
  seasonCount: number;
}

interface SonarrRawSeries {
  id: number;
  title: string;
  monitored: boolean;
  status: string;
  nextAiring?: string;
  previousAiring?: string;
  network?: string;
  seasons?: Array<{ seasonNumber: number }>;
  images?: SonarrImage[];
}

function normalizeSeries(raw: SonarrRawSeries): SonarrShow {
  return {
    id: raw.id,
    title: raw.title,
    monitored: raw.monitored,
    status: raw.status,
    nextAiring: raw.nextAiring,
    previousAiring: raw.previousAiring,
    posterUrl: posterFromImages(raw.images),
    network: raw.network,
    seasonCount: raw.seasons?.filter((s) => s.seasonNumber > 0).length ?? 0,
  };
}

export async function fetchSeries(): Promise<SonarrShow[]> {
  const base = sonarrBase();
  const key = sonarrKey();
  if (!base || !key) throw new Error("SONARR_NOT_CONFIGURED");

  let response: Response;
  try {
    response = await fetch(`${base}/api/v3/series`, {
      headers: { "X-Api-Key": key },
      cache: "no-store",
    });
  } catch {
    throw new Error("SONARR_UNREACHABLE");
  }

  if (!response.ok) throw new Error(`SONARR_ERROR:${response.status}`);

  const data: SonarrRawSeries[] = await response.json();
  return data
    .filter((s) => s.monitored)
    .map(normalizeSeries)
    .sort((a, b) => a.title.localeCompare(b.title));
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkSonarrHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  version?: string;
  url?: string;
}> {
  const base = sonarrBase();
  const key = sonarrKey();
  if (!base || !key) return { configured: false, reachable: false };

  try {
    const response = await fetch(`${base}/api/v3/system/status`, {
      headers: { "X-Api-Key": key },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return { configured: true, reachable: false, url: base };
    const data = await response.json();
    return { configured: true, reachable: true, version: data.version as string, url: base };
  } catch {
    return { configured: true, reachable: false, url: base };
  }
}
