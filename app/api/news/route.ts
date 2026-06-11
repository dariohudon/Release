import { fetchLabNews } from "@/lib/news/fetchNews";
import { apiOk, apiFail } from "@/lib/api/types";

// Public read-only: the same cleaned lab-news items the /news page renders.
// Best-effort upstream feeds with the same fallbacks; cached via ISR so
// native clients never trigger a fetch storm. The homepage does not depend
// on this route.

export const revalidate = 21600; // 6h, matching the /news page

export async function GET() {
  try {
    const feed = await fetchLabNews();
    return apiOk(
      {
        items: feed.items,
        liveLabs: feed.liveLabs,
        failedLabs: feed.failedLabs,
        feedGeneratedAt: feed.generatedAt,
      },
      feed.items.length,
      "public, s-maxage=21600, stale-while-revalidate=86400"
    );
  } catch {
    return apiFail("news feed temporarily unavailable", 503);
  }
}
