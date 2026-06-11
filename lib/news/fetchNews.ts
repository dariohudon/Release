import { NEWS_SOURCES } from "./sources";

/* Best-effort lab news fetcher (server-side only, used by /news).
   Per lab: try the official RSS; fall back to a Google News search
   (clearly labelled); if everything is unreachable, return a static
   list of official news pages so the page always renders.
   Never used by the Radar homepage. */

export type NewsSourceType = "official" | "news-search" | "fallback";

export interface NewsItem {
  id: string;
  lab: string;
  labName: string;
  title: string;
  url: string;
  source: string;
  sourceType: NewsSourceType;
  publishedAt?: string; // ISO
  snippet?: string;
}

export interface NewsFeed {
  items: NewsItem[]; // newest first
  liveLabs: number; // labs with at least one live item
  failedLabs: string[];
  generatedAt: string;
}

const PER_LAB = 6;
const MAX_AGE_DAYS = 45;
const TIMEOUT_MS = 7000;

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

// <link> in RSS vs <link href=""> in Atom
function linkOf(block: string): string {
  const plain = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (plain && decode(plain[1])) return decode(plain[1]);
  const href = block.match(/<link[^>]*href="([^"]+)"/i);
  return href ? href[1] : "";
}

async function fetchRss(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 21600 },
    headers: { "user-agent": "model-radar-news/1.0 (personal, read-only)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseItems(xml: string): { title: string; url: string; date?: string; snippet?: string }[] {
  const blocks = xml.match(/<(?:item|entry)>[\s\S]*?<\/(?:item|entry)>/g) ?? [];
  const out: { title: string; url: string; date?: string; snippet?: string }[] = [];
  for (const b of blocks.slice(0, PER_LAB * 2)) {
    const title = tag(b, "title");
    const url = linkOf(b);
    if (!title || !url) continue;
    const date = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated");
    const snippet = (tag(b, "description") || tag(b, "summary")).slice(0, 180);
    out.push({ title, url, ...(date ? { date } : {}), ...(snippet ? { snippet } : {}) });
  }
  return out;
}

export async function fetchLabNews(): Promise<NewsFeed> {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const failedLabs: string[] = [];

  const perLab = await Promise.all(
    NEWS_SOURCES.map(async (src): Promise<NewsItem[]> => {
      // 1) official feed
      if (src.official) {
        try {
          const items = parseItems(await fetchRss(src.official.rss))
            .filter((i) => !i.date || new Date(i.date).getTime() >= cutoff)
            .slice(0, PER_LAB)
            .map((i, n) => ({
              id: `${src.lab}-official-${n}`,
              lab: src.lab,
              labName: src.labName,
              title: i.title,
              url: i.url,
              source: src.official!.name,
              sourceType: "official" as const,
              ...(i.date ? { publishedAt: new Date(i.date).toISOString() } : {}),
              ...(i.snippet ? { snippet: i.snippet } : {}),
            }));
          if (items.length > 0) return items;
        } catch { /* fall through to news search */ }
      }
      // 2) Google News fallback — clearly labelled, never presented as official
      try {
        const params = new URLSearchParams({ q: src.query, hl: "en-US", gl: "US", ceid: "US:en" });
        const items = parseItems(await fetchRss(`https://news.google.com/rss/search?${params}`))
          .filter((i) => !i.date || new Date(i.date).getTime() >= cutoff)
          .slice(0, PER_LAB)
          .map((i, n) => ({
            id: `${src.lab}-news-${n}`,
            lab: src.lab,
            labName: src.labName,
            title: i.title,
            url: i.url,
            source: "News search",
            sourceType: "news-search" as const,
            ...(i.date ? { publishedAt: new Date(i.date).toISOString() } : {}),
          }));
        if (items.length > 0) return items;
      } catch { /* recorded below */ }
      failedLabs.push(src.labName);
      return [];
    })
  );

  let items = perLab.flat().sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  // 3) render-always fallback: link every lab's official news page
  if (items.length === 0) {
    items = NEWS_SOURCES.map((src) => ({
      id: `${src.lab}-fallback`,
      lab: src.lab,
      labName: src.labName,
      title: `${src.labName} — official news & announcements`,
      url: src.newsPage,
      source: "Official site",
      sourceType: "fallback" as const,
      snippet: "Live feeds were unreachable from the server — open the lab's news page directly.",
    }));
  }

  return {
    items,
    liveLabs: NEWS_SOURCES.length - failedLabs.length,
    failedLabs,
    generatedAt: new Date().toISOString(),
  };
}
