"use client";

import { useMemo, useState } from "react";
import { KIND_META, LABS, LabId, ModelRelease } from "@/lib/ai/types";

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function relativeDate(iso: string): string {
  const d = daysAgo(iso);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Bucket = "This week" | "This month" | "Past 3 months" | "Earlier";

function bucketOf(iso: string): Bucket {
  const d = daysAgo(iso);
  if (d < 7) return "This week";
  if (d < 30) return "This month";
  if (d < 90) return "Past 3 months";
  return "Earlier";
}

const BUCKET_ORDER: Bucket[] = ["This week", "This month", "Past 3 months", "Earlier"];

// ── Pieces ────────────────────────────────────────────────────────────────────

function Monogram({ lab }: { lab: LabId }) {
  const l = LABS[lab];
  return (
    <div
      style={{
        flexShrink: 0,
        width: 44,
        height: 44,
        borderRadius: 11,
        background: l.bg,
        color: l.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: "0.02em",
      }}
    >
      {l.monogram}
    </div>
  );
}

function KindBadge({ kind }: { kind: ModelRelease["kind"] }) {
  const k = KIND_META[kind];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 10,
        fontWeight: 700,
        background: k.bg,
        color: k.color,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {k.label}
    </span>
  );
}

function ReleaseCard({ release }: { release: ModelRelease }) {
  const lab = LABS[release.lab];
  const fresh = daysAgo(release.date) < 7;

  const card = (
    <div
      style={{
        background: "var(--surface)",
        border: fresh ? "1px solid var(--fresh-border)" : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "13px 15px",
        marginBottom: 10,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        boxShadow: fresh ? "var(--shadow-fresh)" : "var(--shadow)",
      }}
    >
      <Monogram lab={release.lab} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {release.name}
          </div>
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              color: fresh ? "var(--accent)" : "var(--muted)",
            }}
          >
            {relativeDate(release.date)}
          </span>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 6px" }}>
          {lab.name} · {formatDate(release.date)}
        </div>

        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 8 }}>
          {release.summary}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <KindBadge kind={release.kind} />
          {release.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink-soft)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "2px 8px",
                borderRadius: 99,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {release.url && (
        <div style={{ flexShrink: 0, alignSelf: "center", color: "var(--faint)", fontSize: 18 }}>
          ›
        </div>
      )}
    </div>
  );

  if (!release.url) return card;
  return (
    <a href={release.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      {card}
    </a>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export default function ReleaseFeed({ releases }: { releases: ModelRelease[] }) {
  const [activeLab, setActiveLab] = useState<LabId | null>(null);
  const [query, setQuery] = useState("");

  // Only offer chips for labs that actually have entries, ordered by their
  // most recent release so the busiest labs sit under the thumb first.
  const labChips = useMemo(() => {
    const latest = new Map<LabId, number>();
    for (const r of releases) {
      const t = new Date(r.date).getTime();
      if (t > (latest.get(r.lab) ?? 0)) latest.set(r.lab, t);
    }
    return [...latest.entries()].sort((a, b) => b[1] - a[1]).map(([lab]) => lab);
  }, [releases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((r) => {
      if (activeLab && r.lab !== activeLab) return false;
      if (!q) return true;
      const haystack = `${r.name} ${LABS[r.lab].name} ${r.summary} ${r.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [releases, activeLab, query]);

  const grouped = useMemo(() => {
    const map = new Map<Bucket, ModelRelease[]>();
    for (const r of filtered) {
      const b = bucketOf(r.date);
      const list = map.get(b);
      if (list) list.push(r);
      else map.set(b, [r]);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => [b, map.get(b)!] as const);
  }, [filtered]);

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flexShrink: 0,
    padding: "7px 14px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: active ? "1px solid var(--ink)" : "1px solid var(--border-strong)",
    background: active ? "var(--ink)" : "var(--surface)",
    color: active ? "var(--surface)" : "var(--ink-soft)",
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* Sticky filter bar: search + lab chips */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg)",
          padding: "10px 0 8px",
          marginBottom: 12,
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models, labs, capabilities…"
          style={{
            width: "100%",
            padding: "11px 14px",
            fontSize: 15,
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            background: "var(--surface)",
            color: "var(--ink)",
            outline: "none",
            marginBottom: 10,
          }}
        />
        <div
          className="chip-row"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            margin: "0 -16px",
            padding: "0 16px 4px",
          }}
        >
          <button style={chipStyle(activeLab === null)} onClick={() => setActiveLab(null)}>
            All
          </button>
          {labChips.map((lab) => (
            <button
              key={lab}
              style={chipStyle(activeLab === lab)}
              onClick={() => setActiveLab(activeLab === lab ? null : lab)}
            >
              {LABS[lab].name}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped feed */}
      {grouped.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 8 }}>
            No releases match
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Try clearing the search or switching back to All labs.
          </div>
        </div>
      )}

      {grouped.map(([bucket, items]) => (
        <div key={bucket} style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            {bucket} · {items.length}
          </div>
          {items.map((r) => (
            <ReleaseCard key={r.id} release={r} />
          ))}
        </div>
      ))}
    </div>
  );
}
