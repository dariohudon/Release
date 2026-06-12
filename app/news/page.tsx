import type { Metadata } from "next";
import StatusBar from "../StatusBar";
import NewsClient from "./NewsClient";
import { fetchLabNews } from "@/lib/news/fetchNews";
import "../radar.css";

export const metadata: Metadata = {
  title: "Lab News — Model Radar",
  description: "Recent lab announcements and model-release context, lab by lab.",
};

// Server-fetched and cached; re-polled in the background at most every 6h.
// The Radar homepage never depends on this fetch.
export const revalidate = 21600;

export default async function NewsPage() {
  const feed = await fetchLabNews();

  return (
    <div className="mr-root">
      <div className="mr-wrap">
        <StatusBar />
        <h1 className="mr-title">Lab News</h1>
        <p className="mr-sub">
          A source feed of recent lab announcements and model-release context.
          Official feeds where available; clearly labelled news search otherwise.
          Nothing here edits the curated catalog.
        </p>
        <NewsClient items={feed.items} />
        <div className="mr-foot">
          {feed.failedLabs.length > 0 && (
            <>Unreachable right now: {feed.failedLabs.join(", ")}.<br /></>
          )}
          Refreshes every 6 hours · Updated{" "}
          {new Date(feed.generatedAt).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
          <br />
          Built for Dario · Octopus &amp; Son.
        </div>
      </div>
    </div>
  );
}
