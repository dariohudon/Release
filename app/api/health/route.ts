import { NextResponse } from "next/server";
import { newsTopics } from "@/lib/ai/news";

export const dynamic = "force-dynamic";

async function probe(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const [huggingface, news] = await Promise.all([
    probe("https://huggingface.co/api/models?limit=1"),
    probe("https://news.google.com/rss/search?q=ai&hl=en-US&gl=US&ceid=US:en"),
  ]);

  return NextResponse.json({
    status: "ok",
    project: "release",
    app: "ai-release-radar",
    domain: "release.brightening.ca",
    port: 3033,
    pm2Process: "release",
    timestamp: new Date().toISOString(),
    sources: {
      curated: true,
      huggingface: { reachable: huggingface },
      news: { reachable: news, topics: newsTopics() },
    },
  });
}
