export type EpisodeStatus = "upcoming" | "downloaded" | "missing" | "released" | "downloading";

export interface SonarrEpisode {
  id: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeCode: string;
  episodeTitle: string;
  releaseDate: string; // airDateUtc ISO string
  airDateLocal: string; // YYYY-MM-DD from Sonarr
  hasFile: boolean;
  monitored: boolean;
  status: EpisodeStatus;
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
  // Sonarr embeds series when includeSeries=true
  series?: {
    id: number;
    title: string;
    titleSlug?: string;
  };
}

function formatEpisodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function deriveStatus(airDateUtc: string, hasFile: boolean): EpisodeStatus {
  const now = new Date();
  const aired = new Date(airDateUtc);
  if (aired > now) return "upcoming";
  if (hasFile) return "downloaded";
  return "missing";
}

function normalizeEpisode(raw: SonarrRawEpisode): SonarrEpisode {
  const releaseDate = raw.airDateUtc || `${raw.airDate}T00:00:00Z`;
  return {
    id: raw.id,
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
  };
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
    return {
      configured: true,
      reachable: true,
      version: data.version as string,
      url: base,
    };
  } catch {
    return { configured: true, reachable: false, url: base };
  }
}
