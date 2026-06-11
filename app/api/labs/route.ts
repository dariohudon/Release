import { LABS, MODELS } from "@/lib/models/data";
import { apiOk } from "@/lib/api/types";

// Public read-only: lab metadata from the curated catalog.

export async function GET() {
  const labs = Object.entries(LABS).map(([id, lab]) => ({
    id,
    name: lab.name,
    color: lab.color,
    modelCount: MODELS.filter((m) => m.lab === id).length,
  }));

  return apiOk({ labs }, labs.length, "public, s-maxage=3600, stale-while-revalidate=86400");
}
