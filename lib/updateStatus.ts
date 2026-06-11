import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/* Reads data/update-status.json (written by scripts/check-model-updates.ts)
   and turns it into a pre-formatted header badge. Server-side only — pages
   call this and pass the result down as a plain prop, so the client never
   touches the filesystem and never re-formats dates (avoiding timezone
   hydration mismatches). The app only READS this file; it never runs the
   checker or fetches sources during render. */

export interface UpdateStatus {
  lastCheckedAt: string;
  sourcesChecked: number;
  candidatesFound: number;
  newCandidates: number;
  failedSources: number;
}

export interface CheckBadge {
  full: string; // "Checked Jun 11, 7:43 PM"
  short: string; // "Checked Jun 11" (mobile)
  title: string; // hover/long-press details
  warn: boolean; // failed sources or stale (>36h)
}

const STALE_MS = 36 * 60 * 60 * 1000;

export function readUpdateStatus(): UpdateStatus | null {
  try {
    const path = join(process.cwd(), "data", "update-status.json");
    if (!existsSync(path)) return null;
    const data = JSON.parse(readFileSync(path, "utf8")) as Partial<UpdateStatus>;
    if (typeof data.lastCheckedAt !== "string" || Number.isNaN(new Date(data.lastCheckedAt).getTime())) {
      return null;
    }
    return {
      lastCheckedAt: data.lastCheckedAt,
      sourcesChecked: data.sourcesChecked ?? 0,
      candidatesFound: data.candidatesFound ?? 0,
      newCandidates: data.newCandidates ?? 0,
      failedSources: data.failedSources ?? 0,
    };
  } catch {
    return null;
  }
}

export function checkBadge(): CheckBadge {
  const status = readUpdateStatus();
  if (!status) {
    return {
      full: "Not checked yet",
      short: "Not checked yet",
      title: "No update-checker run recorded — run `npm run check:updates` on the server.",
      warn: false,
    };
  }

  const at = new Date(status.lastCheckedAt);
  const date = at.toLocaleString("en-US", { month: "short", day: "numeric" });
  const time = at.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  const stale = Date.now() - at.getTime() > STALE_MS;
  const warn = stale || status.failedSources > 0;

  return {
    full: stale ? `Stale check · ${date}` : `Checked ${date}, ${time}`,
    short: stale ? "Stale check" : `Checked ${date}`,
    title:
      `Last update check: ${date}, ${time} — ${status.sourcesChecked} sources, ` +
      `${status.candidatesFound} candidates (${status.newCandidates} new), ` +
      `${status.failedSources} failed${stale ? " — older than 36 hours" : ""}`,
    warn,
  };
}
