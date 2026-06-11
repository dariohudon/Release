"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ArrowUpRight, Search, Sparkles, Lock } from "lucide-react";
import { LABS, TYPES, MODELS, STATUS_META, Model, ModelStatus } from "@/lib/models/data";
import "./radar.css";

/* ──────────────────────────────────────────────────────────────
   MODEL RADAR — a diverse AI model tracker
   Catalog data lives in lib/models/data.ts — edit there.
   Static data only; no network calls by design.
   ────────────────────────────────────────────────────────────── */

// ── Persistence ───────────────────────────────────────────────────────────────
// Last-used filters survive across sessions via localStorage.
// Hydrated in an effect (not initial state) so server and client render match.

const STORAGE_KEY = "model-radar:v1";

interface PersistedState {
  labFilter?: string;
  typeFilter?: string;
  sortBy?: string;
  query?: string;
}

function loadPersisted(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as PersistedState;
    // Validate against the catalog so stale/renamed entries can't wedge the UI.
    return {
      labFilter: data.labFilter === "all" || (data.labFilter && data.labFilter in LABS) ? data.labFilter : undefined,
      typeFilter: TYPES.some((t) => t.key === data.typeFilter) ? data.typeFilter : undefined,
      sortBy: ["index", "newest", "price"].includes(data.sortBy ?? "") ? data.sortBy : undefined,
      query: typeof data.query === "string" ? data.query : undefined,
    };
  } catch {
    return {};
  }
}

const fmtDate = (s?: string): string => {
  if (!s || s.length < 4) return s || "—";
  const parts = s.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (parts.length === 1) return parts[0];
  const [y, m, d] = parts;
  const mm = months[Number(m) - 1] || m;
  return d ? `${mm} ${Number(d)}, ${y}` : `${mm} ${y}`;
};

function SentimentBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="mr-sentwrap" title={`Community signal: ${score}/100`}>
      <div className="mr-senttrack"><div className="mr-sentfill" style={{ width: `${score}%`, background: color }} /></div>
      <span className="mr-sentnum">{score}</span>
    </div>
  );
}

function ModelCard({
  m,
  expanded,
  onToggle,
}: {
  m: Model;
  expanded: boolean;
  onToggle: () => void;
}) {
  const lab = LABS[m.lab];
  return (
    <div className={`mr-card ${expanded ? "is-open" : ""}`} style={{ "--lab": lab.color } as React.CSSProperties}>
      <button className="mr-cardhead" onClick={onToggle} aria-expanded={expanded}>
        <span className="mr-rail" />
        <span className="mr-headmain">
          <span className="mr-namerow">
            <span className="mr-name">{m.name}</span>
            {m.status === "new" && <span className="mr-newtag">new</span>}
            {m.openWeight && <span className="mr-opentag">open</span>}
            {m.tags.includes("frontier") && <Lock size={11} className="mr-locki" />}
          </span>
          <span className="mr-bestat">{m.bestAt}</span>
        </span>
        <span className="mr-headmeta">
          <span className="mr-labtag" style={{ color: lab.color }}>{lab.name}</span>
          <span className="mr-idx">
            {m.index != null ? <><b>{m.index}</b><i>index</i></> : <><b>—</b><i>{m.indexNote ? "spec." : "n/a"}</i></>}
          </span>
          <ChevronDown size={16} className="mr-chev" />
        </span>
      </button>

      <div className="mr-drawer">
        <div className="mr-drawerin">
          <div className="mr-statgrid">
            <div className="mr-stat"><i>Released</i><b>{fmtDate(m.released)}</b></div>
            <div className="mr-stat"><i>Tier</i><b>{m.tier}</b></div>
            <div className="mr-stat"><i>Context</i><b>{m.context || "—"}</b></div>
            <div className="mr-stat"><i>Speed</i><b>{m.speed || "—"}</b></div>
            <div className="mr-stat"><i>Price /M in→out</i><b>{m.priceIn ? `${m.priceIn === "0" ? "free" : "$" + m.priceIn} → ${m.priceOut === "0" ? "" : "$" + m.priceOut}` : "—"}</b></div>
            <div className="mr-stat"><i>Intelligence</i><b>{m.index != null ? m.index : (m.indexNote || "—")}</b></div>
          </div>
          {m.priceNote && <p className="mr-pricenote">Pricing: {m.priceNote}</p>}

          <div className="mr-cols">
            <div className="mr-col">
              <h4 className="mr-h4 good">Strong at</h4>
              <ul className="mr-ul">{m.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="mr-col">
              <h4 className="mr-h4 warn">Watch-outs</h4>
              <ul className="mr-ul">{m.watchouts.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>

          <div className="mr-usefor"><b>Use it for</b> {m.useFor}</div>
          {m.forDario && (
            <div className="mr-fordario"><Sparkles size={13} /> <span><b>For your work:</b> {m.forDario}</span></div>
          )}

          <div className="mr-sentblock">
            <div className="mr-sentlabel">
              <span>Community signal — <b style={{ color: lab.color }}>{m.sentiment.label}</b></span>
              <SentimentBar score={m.sentiment.score} color={lab.color} />
            </div>
            <p className="mr-sentsummary">{m.sentiment.summary}</p>
          </div>

          <div className="mr-actions">
            <a className="mr-link" href={m.link} target="_blank" rel="noreferrer">Open {lab.name} <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelRadar() {
  const [openId, setOpenId] = useState<string | null>("fable-5");
  const [labFilter, setLabFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("index");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPersisted();
    if (saved.labFilter) setLabFilter(saved.labFilter);
    if (saved.typeFilter) setTypeFilter(saved.typeFilter);
    if (saved.sortBy) setSortBy(saved.sortBy);
    if (saved.query) setQuery(saved.query);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't clobber storage with defaults before restore
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ labFilter, typeFilter, sortBy, query } satisfies PersistedState)
      );
    } catch {
      // storage full or blocked — persistence is best-effort
    }
  }, [hydrated, labFilter, typeFilter, sortBy, query]);

  const filtered = useMemo(() => {
    let list = MODELS.filter((m) => labFilter === "all" || m.lab === labFilter);
    list = list.filter((m) => typeFilter === "all" || m.tags.includes(typeFilter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => (m.name + m.bestAt + m.useFor + m.tags.join(" ")).toLowerCase().includes(q));
    }
    return list;
  }, [labFilter, typeFilter, query]);

  const grouped = useMemo(() => {
    const order: ModelStatus[] = ["new", "live", "horizon"];
    const byStatus: Record<ModelStatus, Model[]> = { new: [], live: [], horizon: [] };
    filtered.forEach((m) => byStatus[m.status]?.push(m));
    const sorter = (a: Model, b: Model) => {
      if (sortBy === "index") return (b.index ?? -1) - (a.index ?? -1);
      if (sortBy === "newest") return (b.released || "").localeCompare(a.released || "");
      if (sortBy === "price") return (parseFloat(a.priceIn ?? "") || 999) - (parseFloat(b.priceIn ?? "") || 999);
      return 0;
    };
    order.forEach((s) => byStatus[s].sort(sorter));
    return order.map((s) => ({ status: s, items: byStatus[s] })).filter((g) => g.items.length);
  }, [filtered, sortBy]);

  const total = filtered.length;

  return (
    <div className="mr-root">
      <div className="mr-wrap">
        <div className="mr-eyebrow"><span className="mr-livedot" /> Model Radar · June 2026</div>
        <h1 className="mr-title">The frontier, at a glance</h1>
        <p className="mr-sub">Closed flagships, open-weight leaders, small/edge models and what&rsquo;s coming — what each is best at and what people are saying. Tap a card to open the full read-out. Filter by lab or by what a model is <i>for</i>. Colour = lab.</p>

        <div className="mr-controls">
          <div className="mr-search">
            <Search size={15} color="#5C668A" />
            <input placeholder="Search by need (coding, creative, cheap, offline…)" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="mr-select" value={labFilter} onChange={(e) => setLabFilter(e.target.value)}>
            <option value="all">all labs</option>
            {Object.entries(LABS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <select className="mr-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="index">sort: intelligence</option>
            <option value="newest">sort: newest</option>
            <option value="price">sort: cheapest</option>
          </select>
        </div>

        <div className="mr-labrow">
          {TYPES.map((t) => (
            <button key={t.key} className={`mr-chip ${typeFilter === t.key ? "on" : ""}`} onClick={() => setTypeFilter(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className="mr-count">{total} model{total === 1 ? "" : "s"} shown · seed data verified for June 2026 — open a card for the source</div>

        {grouped.map((g) => (
          <div className="mr-group" key={g.status}>
            <div className="mr-grouphead">
              <span className="mr-grouptitle">{STATUS_META[g.status].label}</span>
              <span className="mr-groupnote">{STATUS_META[g.status].note}</span>
            </div>
            {g.items.map((m) => (
              <ModelCard key={m.id} m={m} expanded={openId === m.id}
                onToggle={() => setOpenId(openId === m.id ? null : m.id)} />
            ))}
          </div>
        ))}

        <div className="mr-foot">
          Intelligence = Artificial Analysis Intelligence Index where available. Prices $/M tokens, approximate.<br />
          &lsquo;open&rsquo; = open-weight (self-hostable). Horizon items are cadence/rumor estimates, not announcements.<br />
          Built for Dario · Octopus &amp; Son.
        </div>
      </div>
    </div>
  );
}
