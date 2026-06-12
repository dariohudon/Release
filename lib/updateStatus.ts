import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/* Reads data/update-status.json (written by scripts/check-model-updates.ts)
   Server-side only — used by the /api/update-status route, which the
   runtime header badge fetches from the client. The app only READS this
   file; it never runs the checker or fetches sources during render. */

export interface UpdateStatus {
  lastCheckedAt: string;
  sourcesChecked: number;
  candidatesFound: number;
  newCandidates: number;
  failedSources: number;
}

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
