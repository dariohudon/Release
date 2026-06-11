"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LABS } from "@/lib/models/data";
import { NewsItem } from "@/lib/news/fetchNews";

function ago(iso?: string): string {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function NewsCard({ item }: { item: NewsItem }) {
  const color = LABS[item.lab]?.color ?? "var(--dim)";
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="mr-card mr-newscard" style={{ "--lab": color } as React.CSSProperties}>
        <span className="mr-rail" />
        <div className="mr-newsbody">
          <div className="mr-newsmeta">
            <span style={{ color }}>{item.labName}</span>
            <span className={`mr-srctag ${item.sourceType === "official" ? "official" : ""}`}>
              {item.source}
            </span>
            {item.publishedAt && <span className="mr-newsago">{ago(item.publishedAt)}</span>}
          </div>
          <div className="mr-newstitle">{item.title}</div>
          {item.snippet && <div className="mr-newssnippet">{item.snippet}</div>}
        </div>
        <span className="mr-newsarrow">›</span>
      </div>
    </a>
  );
}

export default function NewsClient({ items }: { items: NewsItem[] }) {
  const [query, setQuery] = useState("");
  const [lab, setLab] = useState<string>("all");

  // Chips only for labs that actually have items, in feed order
  const labChips = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of items) if (!seen.has(i.lab)) seen.set(i.lab, i.labName);
    return [...seen.entries()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (lab !== "all" && i.lab !== lab) return false;
      if (!q) return true;
      return `${i.title} ${i.labName} ${i.source} ${i.snippet ?? ""}`.toLowerCase().includes(q);
    });
  }, [items, query, lab]);

  return (
    <div>
      <div className="mr-controls" style={{ marginBottom: 12 }}>
        <div className="mr-search">
          <Search size={15} color="#5C668A" />
          <input
            type="search"
            placeholder="Search news (model names, labs, topics…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search news"
          />
        </div>
      </div>

      <div className="mr-labrow mr-defcats">
        <button className={`mr-chip ${lab === "all" ? "on" : ""}`} onClick={() => setLab("all")}>all labs</button>
        {labChips.map(([key, name]) => (
          <button key={key} className={`mr-chip ${lab === key ? "on" : ""}`} onClick={() => setLab(lab === key ? "all" : key)}>
            {name.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mr-count" style={{ margin: "16px 2px 10px" }}>
        {filtered.length} item{filtered.length === 1 ? "" : "s"} · newest first
      </div>

      {filtered.map((i) => <NewsCard key={i.id} item={i} />)}
      {filtered.length === 0 && (
        <p className="mr-empty">Nothing matches — clear the search or switch back to all labs.</p>
      )}
    </div>
  );
}
