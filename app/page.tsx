import { getReleaseFeed } from "@/lib/ai/releases";
import { NewsArticle } from "@/lib/ai/news";
import { LabId } from "@/lib/ai/types";
import ReleaseFeed from "./feed";

// Self-updating: the page is statically cached and re-rendered in the
// background at most every 6 hours, re-polling Hugging Face and the news
// feeds. No manual refresh or redeploy needed.
export const revalidate = 21600;

const DAY_MS = 24 * 60 * 60 * 1000;

function newsAge(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function LiveBadge({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: live ? "var(--good)" : "var(--muted)",
        background: live ? "var(--good-soft)" : "var(--border)",
        padding: "2px 8px",
        borderRadius: 99,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function StoryCard({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 15px",
          marginBottom: 8,
          display: "flex",
          gap: 13,
          alignItems: "flex-start",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            marginTop: 2,
          }}
        >
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 3 }}>
            {article.source} · {newsAge(article.publishedAt)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.45 }}>
            {article.title}
          </div>
        </div>

        <div style={{ flexShrink: 0, alignSelf: "center", color: "var(--faint)", fontSize: 18 }}>
          ›
        </div>
      </div>
    </a>
  );
}

export default async function Home() {
  const { releases, articles, topics, modelsLive, newsLive, generatedAt } =
    await getReleaseFeed();

  const labCount = new Set<LabId>(releases.map((r) => r.lab)).size;
  const thisWeek = releases.filter((r) => Date.now() - new Date(r.date).getTime() < 7 * DAY_MS).length;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            AI Release Radar<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <a
            href="/models"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
          >
            Model radar ›
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {releases.length} releases · {labCount} labs
            {thisWeek > 0 ? ` · ${thisWeek} this week` : ""}
          </p>
          <LiveBadge live={modelsLive} label={modelsLive ? "Live" : "Curated"} />
        </div>
      </div>

      {/* Top stories */}
      {articles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Top stories
            </div>
            <LiveBadge live={newsLive} label={topics.join(" · ")} />
          </div>
          {articles.map((a, i) => (
            <StoryCard key={a.id} article={a} index={i} />
          ))}
        </div>
      )}

      <ReleaseFeed releases={releases} />

      {/* Footer */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "var(--faint)",
          textAlign: "center",
          lineHeight: 1.7,
        }}
      >
        Curated frontier timeline + live open-weights drops (Hugging Face) + top stories
        (Google News).
        <br />
        Self-updates every 6 hours · Last refresh{" "}
        {new Date(generatedAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </main>
  );
}
