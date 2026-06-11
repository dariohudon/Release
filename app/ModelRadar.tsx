"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import {
  LABS, TYPES, MODELS, STATUS_META, JOBS, VERDICT_META,
  Model, ModelStatus, Verdict, priceNum, releasedDate,
} from "@/lib/models/data";
import { ModelCard } from "./ModelCard";
import Timeline from "./Timeline";
import MapView from "./MapView";
import "./radar.css";

/* ──────────────────────────────────────────────────────────────
   MODEL RADAR — a diverse AI model tracker
   Catalog data lives in lib/models/data.ts — edit there.
   Static data only; no network calls by design.
   ────────────────────────────────────────────────────────────── */

// ── Persistence ───────────────────────────────────────────────────────────────
// Last-used filters + view survive across sessions via localStorage.
// Hydrated in an effect (not initial state) so server and client render match.

const STORAGE_KEY = "model-radar:v1";
const VISIT_KEY = "model-radar:lastVisit";

type View = "list" | "map";

interface PersistedState {
  labFilter?: string;
  typeFilter?: string;
  sortBy?: string;
  query?: string;
  verdictFilter?: string;
  view?: string;
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
      verdictFilter: ["all", "use", "watch", "ignore"].includes(data.verdictFilter ?? "") ? data.verdictFilter : undefined,
      view: ["list", "map"].includes(data.view ?? "") ? data.view : undefined,
    };
  } catch {
    return {};
  }
}

// Models released since the previous visit (full dates only — month-precision
// and horizon entries don't qualify as "just appeared").
function sinceLastVisit(prevVisit: number | null): Set<string> {
  const ids = new Set<string>();
  if (!prevVisit) return ids;
  for (const m of MODELS) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.released)) continue;
    const d = releasedDate(m.released);
    if (d && d.getTime() > prevVisit) ids.add(m.id);
  }
  return ids;
}

const VERDICT_KEYS: ("all" | Verdict)[] = ["all", "use", "watch", "ignore"];

export default function ModelRadar() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [labFilter, setLabFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState<"all" | Verdict>("all");
  const [jobFilter, setJobFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("index");
  const [hydrated, setHydrated] = useState(false);
  const [sinceIds, setSinceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = loadPersisted();
    if (saved.labFilter) setLabFilter(saved.labFilter);
    if (saved.typeFilter) setTypeFilter(saved.typeFilter);
    if (saved.sortBy) setSortBy(saved.sortBy);
    if (saved.query) setQuery(saved.query);
    if (saved.verdictFilter) setVerdictFilter(saved.verdictFilter as "all" | Verdict);
    if (saved.view) setView(saved.view as View);
    try {
      const prev = Number(window.localStorage.getItem(VISIT_KEY)) || null;
      setSinceIds(sinceLastVisit(prev));
      window.localStorage.setItem(VISIT_KEY, String(Date.now()));
    } catch { /* best-effort */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't clobber storage with defaults before restore
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ labFilter, typeFilter, sortBy, query, verdictFilter, view } satisfies PersistedState)
      );
    } catch {
      // storage full or blocked — persistence is best-effort
    }
  }, [hydrated, labFilter, typeFilter, sortBy, query, verdictFilter, view]);

  // Jump target from the timeline or map: clear anything that could hide the
  // card, switch to the list, open it, scroll to it.
  const jumpTo = (id: string) => {
    setView("list");
    setLabFilter("all");
    setTypeFilter("all");
    setVerdictFilter("all");
    setJobFilter(null);
    setQuery("");
    setOpenId(id);
    requestAnimationFrame(() => {
      document.getElementById(`model-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const activeJob = JOBS.find((j) => j.key === jobFilter) ?? null;

  const filtered = useMemo(() => {
    let list = MODELS;
    if (activeJob) {
      const order = new Map(activeJob.picks.map((id, i) => [id, i]));
      return MODELS.filter((m) => order.has(m.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }
    list = list.filter((m) => labFilter === "all" || m.lab === labFilter);
    list = list.filter((m) => typeFilter === "all" || m.tags.includes(typeFilter));
    list = list.filter((m) => verdictFilter === "all" || m.verdict === verdictFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => (m.name + m.bestAt + m.useFor + m.tags.join(" ")).toLowerCase().includes(q));
    }
    return list;
  }, [labFilter, typeFilter, verdictFilter, query, activeJob]);

  const grouped = useMemo(() => {
    const order: ModelStatus[] = ["new", "live", "horizon"];
    const byStatus: Record<ModelStatus, Model[]> = { new: [], live: [], horizon: [] };
    filtered.forEach((m) => byStatus[m.status]?.push(m));
    const sorter = (a: Model, b: Model) => {
      if (sortBy === "index") return (b.index ?? -1) - (a.index ?? -1);
      if (sortBy === "newest") return (b.released || "").localeCompare(a.released || "");
      if (sortBy === "price") return (priceNum(a.priceIn) ?? 999) - (priceNum(b.priceIn) ?? 999);
      return 0;
    };
    order.forEach((s) => byStatus[s].sort(sorter));
    return order.map((s) => ({ status: s, items: byStatus[s] })).filter((g) => g.items.length);
  }, [filtered, sortBy]);

  const verdictCounts = useMemo(() => {
    const c: Record<string, number> = { all: MODELS.length, use: 0, watch: 0, ignore: 0 };
    MODELS.forEach((m) => { c[m.verdict]++; });
    return c;
  }, []);

  const total = filtered.length;

  return (
    <div className="mr-root">
      <div className="mr-wrap">
        <div className="mr-eyebrow"><span className="mr-livedot" /> Model Radar · June 2026</div>
        <h1 className="mr-title">The frontier, at a glance</h1>
        <p className="mr-sub">What&rsquo;s out, what&rsquo;s coming, and what deserves your attention. Tap a card for the full read-out. Colour = lab.</p>

        {sinceIds.size > 0 && (
          <button className="mr-sincebanner" onClick={() => jumpTo([...sinceIds][0])}>
            <span className="mr-sincedot" />
            {sinceIds.size} release{sinceIds.size === 1 ? "" : "s"} since your last visit
          </button>
        )}

        <Timeline onPick={jumpTo} />

        {/* Triage first: the use / watch / ignore lens */}
        <div className="mr-verdictrow" role="tablist" aria-label="Verdict filter">
          {VERDICT_KEYS.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={verdictFilter === k}
              className={`mr-vbtn ${verdictFilter === k ? "on" : ""} ${k !== "all" ? `v-${k}` : ""}`}
              onClick={() => { setVerdictFilter(k); setJobFilter(null); }}
            >
              {k === "all" ? "all" : VERDICT_META[k as Verdict].label}
              <i>{verdictCounts[k]}</i>
            </button>
          ))}
        </div>

        <div className="mr-controls">
          <div className="mr-search">
            <Search size={15} color="#5C668A" />
            <input placeholder="Search by need (coding, creative, cheap, offline…)" value={query} onChange={(e) => { setQuery(e.target.value); setJobFilter(null); }} />
          </div>
          <select className="mr-select" value={labFilter} onChange={(e) => { setLabFilter(e.target.value); setJobFilter(null); }}>
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
            <button key={t.key} className={`mr-chip ${typeFilter === t.key && !jobFilter ? "on" : ""}`} onClick={() => { setTypeFilter(t.key); setJobFilter(null); }}>{t.label}</button>
          ))}
        </div>

        {/* For-the-job picker */}
        <div className="mr-jobrow">
          <span className="mr-joblabel">for:</span>
          {JOBS.map((j) => (
            <button
              key={j.key}
              className={`mr-chip mr-jobchip ${jobFilter === j.key ? "on" : ""}`}
              onClick={() => setJobFilter(jobFilter === j.key ? null : j.key)}
            >
              {j.label}
            </button>
          ))}
        </div>

        <div className="mr-countrow">
          <span className="mr-count">
            {activeJob
              ? <>top pick{activeJob.picks.length === 1 ? "" : "s"} for <b>{activeJob.label}</b> — best first</>
              : <>{total} model{total === 1 ? "" : "s"} shown · seed data verified for June 2026</>}
          </span>
          <div className="mr-viewtoggle" role="tablist" aria-label="View">
            <button role="tab" aria-selected={view === "list"} className={view === "list" ? "on" : ""} onClick={() => setView("list")}>list</button>
            <button role="tab" aria-selected={view === "map"} className={view === "map" ? "on" : ""} onClick={() => setView("map")}>map</button>
          </div>
        </div>

        {view === "map" ? (
          <MapView onPick={jumpTo} />
        ) : (
          <>
            {grouped.map((g) => (
              <div className="mr-group" key={g.status}>
                <div className="mr-grouphead">
                  <span className="mr-grouptitle">{STATUS_META[g.status].label}</span>
                  <span className="mr-groupnote">{STATUS_META[g.status].note}</span>
                </div>
                {g.items.map((m) => (
                  <ModelCard key={m.id} m={m} expanded={openId === m.id}
                    sinceNew={sinceIds.has(m.id)}
                    onToggle={() => setOpenId(openId === m.id ? null : m.id)} />
                ))}
              </div>
            ))}
            {total === 0 && (
              <p className="mr-empty">Nothing matches — clear the search or switch back to <b>all</b>.</p>
            )}
          </>
        )}

        <div className="mr-foot">
          Intelligence = Artificial Analysis Intelligence Index where available. Prices $/M tokens, approximate.<br />
          &lsquo;open&rsquo; = open-weight (self-hostable). Horizon items are cadence/rumor estimates, not announcements.<br />
          Verdicts (use / watch / ignore) are editorial — edit lib/models/data.ts to change them.<br />
          Built for Dario · Octopus &amp; Son.
        </div>
      </div>
    </div>
  );
}
