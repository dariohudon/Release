import { CURATED_RELEASES } from "./curated";
import { fetchHuggingFaceReleases } from "./huggingface";
import { fetchTopStories, NewsArticle, newsTopics } from "./news";
import { ModelRelease } from "./types";

export interface ReleaseFeedData {
  releases: ModelRelease[]; // newest first
  articles: NewsArticle[]; // top industry stories
  topics: string[];
  modelsLive: boolean; // Hugging Face poll succeeded
  newsLive: boolean; // at least one news topic fetched
  generatedAt: string;
}

export async function getReleaseFeed(): Promise<ReleaseFeedData> {
  const [hfResult, newsResult] = await Promise.allSettled([
    fetchHuggingFaceReleases(CURATED_RELEASES),
    fetchTopStories(),
  ]);

  // Live sources are best-effort; the curated dataset always renders.
  const hf = hfResult.status === "fulfilled" ? hfResult.value : { releases: [], live: false };
  const news = newsResult.status === "fulfilled" ? newsResult.value : { articles: [], live: false };

  const releases = [...CURATED_RELEASES, ...hf.releases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    releases,
    articles: news.articles,
    topics: newsTopics(),
    modelsLive: hf.live,
    newsLive: news.live,
    generatedAt: new Date().toISOString(),
  };
}
