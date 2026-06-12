"use client";

import { useEffect, useState } from "react";

/* Runtime "last checked" indicator for the header. Fetches /api/update-status
   from the client AFTER mount, so the date reflects the latest cron run on
   every page refresh — no rebuild or ISR window involved. Shows only safe
   summary counts; never paths, logs, or candidate details. */

interface StatusData {
  lastCheckedAt: string;
  sourcesChecked: number;
  candidatesFound: number;
  newCandidates: number;
  failedSources: number;
}

type BadgeState =
  | { kind: "loading" }
  | { kind: "missing" } // API failed or ok:false
  | { kind: "ok"; data: StatusData };

const STALE_MS = 36 * 60 * 60 * 1000;

export default function LastCheckedBadge() {
  const [state, setState] = useState<BadgeState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("/api/update-status", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        if (json?.ok === true && typeof json.data?.lastCheckedAt === "string") {
          setState({ kind: "ok", data: json.data as StatusData });
        } else {
          setState({ kind: "missing" });
        }
      })
      .catch(() => { if (alive) setState({ kind: "missing" }); });
    return () => { alive = false; };
  }, []);

  if (state.kind === "loading") {
    return <span className="mr-checkbadge loading">Checking…</span>;
  }
  if (state.kind === "missing") {
    return <span className="mr-checkbadge" title="No update-checker run recorded yet.">Not checked yet</span>;
  }

  const { data } = state;
  const at = new Date(data.lastCheckedAt);
  const date = at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const stale = Date.now() - at.getTime() > STALE_MS;
  const warn = stale || data.failedSources > 0;

  const label = stale ? `Stale · ${date}` : `Checked ${date}`;
  const title =
    `Last checked ${date}, ${time}\n` +
    `${data.sourcesChecked} sources · ${data.candidatesFound} candidates · ` +
    `${data.newCandidates} new · ${data.failedSources} failed` +
    (stale ? "\nOlder than 36 hours" : "");

  return (
    <span className={`mr-checkbadge ${warn ? "warn" : ""}`} title={title}>
      {label}
    </span>
  );
}
