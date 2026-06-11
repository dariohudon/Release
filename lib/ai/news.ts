// Top stories: Google News RSS, no key required. Topics are the owner's
// industries — set NEWS_TOPICS (comma-separated) in the environment to
// customize, e.g. NEWS_TOPICS="artificial intelligence, fintech, hospitality".

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: string; // ISO
}

const DEFAULT_TOPICS = ["artificial intelligence"];
const TOP_COUNT = 3;
const PER_TOPIC_FETCH = 6;
const MAX_AGE_DAYS = 7;

export function newsTopics(): string[] {
  const raw = process.env.NEWS_TOPICS ?? "";
  const topics = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return topics.length > 0 ? topics : DEFAULT_TOPICS;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()) : "";
}

function parseRssItems(xml: string, topic: string): NewsArticle[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const articles: NewsArticle[] = [];

  for (const block of items.slice(0, PER_TOPIC_FETCH)) {
    const rawTitle = tag(block, "title");
    const url = tag(block, "link");
    const pubDate = tag(block, "pubDate");
    const sourceTag = tag(block, "source");
    if (!rawTitle || !url) continue;

    // Google News titles end with " - Source"; prefer the <source> tag, fall
    // back to stripping the suffix.
    const suffixMatch = rawTitle.match(/^(.*)\s+-\s+([^-]+)$/);
    const title = sourceTag && suffixMatch ? suffixMatch[1] : rawTitle;
    const source = sourceTag || (suffixMatch ? suffixMatch[2] : "");

    const published = pubDate ? new Date(pubDate) : new Date();
    articles.push({
      id: `news:${url}`,
      title,
      url,
      source: source || "News",
      topic,
      publishedAt: published.toISOString(),
    });
  }
  return articles;
}

async function fetchTopic(topic: string): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: topic,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  const response = await fetch(`https://news.google.com/rss/search?${params}`, {
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 21600 },
  });
  if (!response.ok) throw new Error(`NEWS_ERROR:${response.status}`);

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return parseRssItems(await response.text(), topic).filter(
    (a) => new Date(a.publishedAt).getTime() >= cutoff
  );
}

export interface NewsResult {
  articles: NewsArticle[]; // top stories, at most TOP_COUNT
  live: boolean;
}

export async function fetchTopStories(): Promise<NewsResult> {
  const topics = newsTopics();
  const settled = await Promise.allSettled(topics.map(fetchTopic));
  const live = settled.some((r) => r.status === "fulfilled");

  // Round-robin across topics (newest first within each) so every industry
  // gets representation in the top 3, then dedupe by title.
  const perTopic = settled.map((r) =>
    r.status === "fulfilled"
      ? r.value.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      : []
  );

  const picked: NewsArticle[] = [];
  const seen = new Set<string>();
  for (let round = 0; picked.length < TOP_COUNT; round++) {
    let any = false;
    for (const list of perTopic) {
      const article = list[round];
      if (!article) continue;
      any = true;
      const key = article.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(article);
      if (picked.length >= TOP_COUNT) break;
    }
    if (!any) break;
  }

  return { articles: picked, live };
}
