"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DEFINITIONS, DEF_CATEGORIES, DEF_CATEGORY_COLORS, Definition } from "@/lib/definitions/data";

function DefinitionCard({
  d,
  expanded,
  onToggle,
}: {
  d: Definition;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = DEF_CATEGORY_COLORS[d.category] ?? "var(--dim)";
  return (
    <div className={`mr-card ${expanded ? "is-open" : ""}`} style={{ "--lab": color } as React.CSSProperties}>
      <button className="mr-cardhead" onClick={onToggle} aria-expanded={expanded}>
        <span className="mr-rail" />
        <span className="mr-headmain">
          <span className="mr-namerow">
            <span className="mr-name">{d.term}</span>
            <span className="mr-newtag">{d.category}</span>
            {d.freshness && d.freshness !== "stable" && (
              <span className={`mr-freshtag ${d.freshness === "fast-moving" ? "hot" : ""}`}>{d.freshness}</span>
            )}
          </span>
          <span className="mr-bestat">{d.shortDefinition}</span>
        </span>
        <span className="mr-headmeta">
          <ChevronDown size={16} className="mr-chev" />
        </span>
      </button>

      <div className="mr-drawer">
        <div className="mr-drawerin">
          <div className="mr-defblock">
            <h4 className="mr-h4 good">Plain English</h4>
            <p className="mr-deftext">{d.plainEnglish}</p>
          </div>
          <div className="mr-defblock">
            <h4 className="mr-h4 warn">Why it matters</h4>
            <p className="mr-deftext">{d.whyItMatters}</p>
          </div>
          <div className="mr-defblock">
            <h4 className="mr-h4">Example</h4>
            <p className="mr-deftext example">{d.example}</p>
          </div>
          {d.relatedTerms && d.relatedTerms.length > 0 && (
            <div className="mr-defrelated">
              {d.relatedTerms.map((t) => (
                <span key={t} className="mr-chip mr-relchip">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DefinitionsClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFINITIONS.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      const haystack = `${d.term} ${d.shortDefinition} ${d.category} ${(d.aliases ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  // Only offer chips for categories that exist in the data
  const categories = DEF_CATEGORIES.filter((c) => DEFINITIONS.some((d) => d.category === c));

  return (
    <div>
      <div className="mr-controls" style={{ marginBottom: 12 }}>
        <div className="mr-search">
          <Search size={15} color="#5C668A" />
          <input
            type="search"
            placeholder="Search terms (context, tokens, MCP, caching…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search definitions"
          />
        </div>
      </div>

      <div className="mr-labrow mr-defcats">
        <button className={`mr-chip ${category === "all" ? "on" : ""}`} onClick={() => setCategory("all")}>
          all
        </button>
        {categories.map((c) => (
          <button key={c} className={`mr-chip ${category === c ? "on" : ""}`} onClick={() => setCategory(category === c ? "all" : c)}>
            {c.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mr-count" style={{ margin: "16px 2px 10px" }}>
        {filtered.length} term{filtered.length === 1 ? "" : "s"}
      </div>

      {filtered.map((d) => (
        <DefinitionCard key={d.id} d={d} expanded={openId === d.id} onToggle={() => setOpenId(openId === d.id ? null : d.id)} />
      ))}
      {filtered.length === 0 && (
        <p className="mr-empty">No terms match — try a broader word or clear the category.</p>
      )}
    </div>
  );
}
