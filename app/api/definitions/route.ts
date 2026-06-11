import { DEFINITIONS, DEF_CATEGORIES } from "@/lib/definitions/data";
import { apiOk } from "@/lib/api/types";

// Public read-only: the AI definitions library. Same data file the
// /definitions page uses — single source, no duplication.

export async function GET() {
  return apiOk(
    { definitions: DEFINITIONS, categories: DEF_CATEGORIES },
    DEFINITIONS.length,
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
}
