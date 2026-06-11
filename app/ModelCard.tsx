"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, ArrowUpRight, Sparkles, Lock } from "lucide-react";
import { LABS, VERDICT_META, Model } from "@/lib/models/data";

export const fmtDate = (s?: string): string => {
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

export function ModelCard({
  m,
  expanded,
  onToggle,
  sinceNew = false,
  showLabLink = true,
}: {
  m: Model;
  expanded: boolean;
  onToggle: () => void;
  sinceNew?: boolean; // released since the visitor's last session
  showLabLink?: boolean; // hidden on the lab's own page
}) {
  const lab = LABS[m.lab];
  const verdict = VERDICT_META[m.verdict];
  return (
    <div id={`model-${m.id}`} className={`mr-card ${expanded ? "is-open" : ""}`} style={{ "--lab": lab.color } as React.CSSProperties}>
      <button className="mr-cardhead" onClick={onToggle} aria-expanded={expanded}>
        <span className="mr-rail" />
        <span className="mr-headmain">
          <span className="mr-namerow">
            {sinceNew && <span className="mr-sincedot" title="New since your last visit" />}
            <span className="mr-name">{m.name}</span>
            {m.status === "new" && <span className="mr-newtag">new</span>}
            {m.openWeight && <span className="mr-opentag">open</span>}
            {m.tags.includes("frontier") && <Lock size={11} className="mr-locki" />}
          </span>
          <span className="mr-bestat">{m.bestAt}</span>
        </span>
        <span className="mr-headmeta">
          <span className={`mr-verdict v-${m.verdict}`}>{verdict.label}</span>
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
            <div className="mr-stat"><i>Verdict</i><b style={{ color: verdict.color }}>{verdict.label} — {verdict.note}</b></div>
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
            {showLabLink && (
              <Link className="mr-lablink" href={`/labs/${m.lab}`}>About {lab.name} →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
