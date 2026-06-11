import { readUpdateStatus } from "@/lib/updateStatus";
import { apiOk, apiFail } from "@/lib/api/types";

// Public read-only: the latest update-checker run (timestamp + counts).
// Reads ONLY data/update-status.json. It never reads or exposes
// update-candidates.json, the markdown run log, or server logs, and it
// never triggers the checker — that stays cron-only.

export const dynamic = "force-dynamic"; // re-read the runtime file per request

export async function GET() {
  const status = readUpdateStatus();
  if (!status) return apiFail("no update check recorded yet", 404);

  return apiOk(
    {
      lastCheckedAt: status.lastCheckedAt,
      sourcesChecked: status.sourcesChecked,
      candidatesFound: status.candidatesFound,
      newCandidates: status.newCandidates,
      failedSources: status.failedSources,
    },
    1
  );
}
