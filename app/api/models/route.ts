import { MODELS } from "@/lib/models/data";
import { apiOk } from "@/lib/api/types";

// Public read-only: the curated model catalog. Static data — changes only
// when lib/models/data.ts is edited and the app is rebuilt.

export async function GET() {
  const countsByLab: Record<string, number> = {};
  const countsByStatus: Record<string, number> = {};
  const countsByVerdict: Record<string, number> = {};
  for (const m of MODELS) {
    countsByLab[m.lab] = (countsByLab[m.lab] ?? 0) + 1;
    countsByStatus[m.status] = (countsByStatus[m.status] ?? 0) + 1;
    countsByVerdict[m.verdict] = (countsByVerdict[m.verdict] ?? 0) + 1;
  }

  return apiOk(
    { models: MODELS, countsByLab, countsByStatus, countsByVerdict },
    MODELS.length,
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
}
