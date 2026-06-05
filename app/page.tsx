import {
  fetchCalendar,
  fetchSeries,
  SonarrEpisode,
  SonarrShow,
  EpisodeStatus,
} from "@/lib/sonarr";
import { buildPlexLookup, enrichWithPlex, isPlexConfigured } from "@/lib/plex";

export const dynamic = "force-dynamic";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS: Record<EpisodeStatus, { label: string; bg: string; color: string; text: string }> = {
  upcoming:      { label: "Upcoming",              bg: "#dbeafe", color: "#1e40af", text: "Scheduled — not aired yet" },
  downloaded:    { label: "Downloaded",            bg: "#dcfce7", color: "#166534", text: "File available" },
  in_plex:       { label: "Downloaded in Plex",   bg: "#dcfce7", color: "#14532d", text: "Available to watch" },
  waiting_plex:  { label: "Waiting for Plex",     bg: "#fef9c3", color: "#713f12", text: "Downloaded, waiting for Plex" },
  missing:       { label: "Missing",              bg: "#fee2e2", color: "#991b1b", text: "Not downloaded yet" },
  released:      { label: "Released",             bg: "#f3f4f6", color: "#374151", text: "Released" },
  downloading:   { label: "Downloading",          bg: "#fef3c7", color: "#92400e", text: "Downloading…" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Shared components ─────────────────────────────────────────────────────────

function PosterBlock({
  size,
  name,
  posterUrl,
  radius = 8,
}: {
  size: number;
  name: string;
  posterUrl: string | null;
  radius?: number;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        background: "#e5e7eb",
      }}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={name}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.max(10, size * 0.22),
            fontWeight: 700,
            color: "#9ca3af",
            letterSpacing: "0.04em",
            background: "#f3f4f6",
          }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: EpisodeStatus }) {
  const s = STATUS[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

// ── Episode card ──────────────────────────────────────────────────────────────

function EpisodeCard({ ep }: { ep: SonarrEpisode }) {
  const s = STATUS[ep.status];
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 10,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <PosterBlock size={72} name={ep.showName} posterUrl={ep.posterUrl} radius={8} />

      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#111827",
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ep.showName}
        </div>

        <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{ep.episodeCode}</span>
          {ep.episodeTitle && ep.episodeTitle !== "TBA" && (
            <span style={{ color: "#6b7280" }}> — {ep.episodeTitle}</span>
          )}
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          {formatDate(ep.releaseDate)}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Badge status={ep.status} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{s.text}</span>
        </div>
      </div>
    </div>
  );
}

// ── Show card ─────────────────────────────────────────────────────────────────

function showStatusLine(show: SonarrShow): { text: string; muted: boolean } {
  if (show.status === "ended") {
    return { text: "Ended", muted: true };
  }
  if (show.status === "continuing") {
    if (show.nextAiring) {
      return { text: `Continuing · Next: ${formatDateShort(show.nextAiring)}`, muted: false };
    }
    return { text: "Continuing · No next release date yet", muted: true };
  }
  return { text: show.status, muted: true };
}

function ShowCard({ show }: { show: SonarrShow }) {
  const { text: statusText, muted } = showStatusLine(show);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 8,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <PosterBlock size={52} name={show.title} posterUrl={show.posterUrl} radius={7} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "#111827",
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {show.title}
        </div>

        <div style={{ fontSize: 12, color: muted ? "#9ca3af" : "#6b7280" }}>
          {statusText}
        </div>

        {show.network && (
          <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 2 }}>{show.network}</div>
        )}
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {show.seasonCount > 0 ? `${show.seasonCount}S` : ""}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FetchError = "not_configured" | "unreachable" | "error";

function classifyError(err: unknown): FetchError {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "SONARR_NOT_CONFIGURED") return "not_configured";
  if (msg === "SONARR_UNREACHABLE") return "unreachable";
  return "error";
}

export default async function Home() {
  const [calendarResult, seriesResult, plexLookupResult] = await Promise.allSettled([
    fetchCalendar(),
    fetchSeries(),
    buildPlexLookup(),
  ]);

  const rawEpisodes = calendarResult.status === "fulfilled" ? calendarResult.value : [];
  const shows = seriesResult.status === "fulfilled" ? seriesResult.value : [];
  const plexLookup = plexLookupResult.status === "fulfilled" ? plexLookupResult.value : null;
  const fetchError: FetchError | null =
    calendarResult.status === "rejected" ? classifyError(calendarResult.reason) : null;

  const episodes = enrichWithPlex(rawEpisodes, plexLookup);
  // Recent: most recently aired first; upcoming: soonest first (calendar already asc)
  const past = episodes
    .filter((e) => e.status !== "upcoming")
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  const upcoming = episodes.filter((e) => e.status === "upcoming");

  const plexActive = isPlexConfigured();
  const plexWorking = plexLookup !== null;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#111827" }}>
          Release Radar
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
            Episodes from the past 7 days and next 7 days
          </p>
          {plexActive && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: plexWorking ? "#166534" : "#9ca3af",
                background: plexWorking ? "#dcfce7" : "#f3f4f6",
                padding: "2px 7px",
                borderRadius: 99,
              }}
            >
              {plexWorking ? "Plex" : "Plex offline"}
            </span>
          )}
        </div>
      </div>

      {/* Calendar error states */}
      {fetchError === "not_configured" && (
        <EmptyCard
          icon="⚙️"
          title="Sonarr not configured"
          body="Set SONARR_URL and SONARR_API_KEY in your environment to connect to Sonarr."
        />
      )}
      {fetchError === "unreachable" && (
        <EmptyCard
          icon="🔌"
          title="Sonarr unavailable"
          body="Could not reach the Sonarr server. Check that it is running and reachable from this host."
        />
      )}
      {fetchError === "error" && (
        <EmptyCard
          icon="⚠️"
          title="Sonarr error"
          body="Sonarr returned an unexpected response. Check your API key and Sonarr version."
        />
      )}

      {/* Episode sections */}
      {!fetchError && episodes.length === 0 && (
        <EmptyCard
          icon="📭"
          title="No episodes found"
          body="No episodes are scheduled in the past 7 days or next 7 days."
        />
      )}

      {past.length > 0 && (
        <Section label="Recent">
          {past.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section label="Upcoming">
          {upcoming.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
        </Section>
      )}

      {/* Monitored shows */}
      {shows.length > 0 && (
        <Section label={`Shows · ${shows.length}`}>
          {shows.map((show) => <ShowCard key={show.id} show={show} />)}
        </Section>
      )}

    </main>
  );
}
