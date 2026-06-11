"use client";

import React, { useMemo } from "react";
import { LABS, MODELS, priceNum, Model } from "@/lib/models/data";

/* Map view: intelligence (y) vs input price (x). Only models with a neutral
   index AND a parseable price plot; the rest are listed below so nothing
   silently disappears. Sweet spot = top-left (smart & cheap). */

const W = 360;
const H = 300;
const PAD = { top: 28, right: 18, bottom: 34, left: 34 };

function shortName(name: string): string {
  return name.replace(/^(Claude|Gemini|Meta|Mistral)\s+/, "").replace(/\s*\/.*$/, "");
}

export default function MapView({ onPick }: { onPick: (id: string) => void }) {
  const { dots, unplotted, xMax, yMin, yMax } = useMemo(() => {
    const plottable: { m: Model; price: number; index: number }[] = [];
    const unplotted: Model[] = [];
    for (const m of MODELS) {
      if (m.status === "horizon") continue; // nothing to plot yet
      const price = priceNum(m.priceIn);
      if (m.index != null && price != null) plottable.push({ m, price, index: m.index });
      else unplotted.push(m);
    }
    const xMax = Math.max(6, ...plottable.map((p) => p.price)) * 1.12;
    const yMin = Math.min(...plottable.map((p) => p.index)) - 3;
    const yMax = Math.max(...plottable.map((p) => p.index)) + 3;
    const dots = plottable.map((p) => ({
      ...p,
      x: PAD.left + (p.price / xMax) * (W - PAD.left - PAD.right),
      y: PAD.top + (1 - (p.index - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom),
      labelBelow: false,
    }));
    // Crowded dots (e.g. same price tier): flip every other nearby label below
    // so names never sit on top of each other or block a neighbour's tap.
    const sorted = [...dots].sort((a, b) => a.y - b.y);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const close = Math.abs(sorted[i].x - sorted[j].x) < 60 && Math.abs(sorted[i].y - sorted[j].y) < 30;
        if (close && sorted[i].labelBelow === sorted[j].labelBelow) sorted[j].labelBelow = !sorted[i].labelBelow;
      }
    }
    return { dots, unplotted, xMax, yMin, yMax };
  }, []);

  const midX = PAD.left + (W - PAD.left - PAD.right) / 2;
  const midY = PAD.top + (H - PAD.top - PAD.bottom) / 2;

  return (
    <div className="mr-map">
      <svg viewBox={`0 0 ${W} ${H}`} className="mr-mapsvg" role="img" aria-label="Intelligence versus price map">
        {/* quadrant grid */}
        <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="none" stroke="var(--line)" strokeWidth="1" rx="8" />
        <line x1={midX} y1={PAD.top} x2={midX} y2={H - PAD.bottom} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1={PAD.left} y1={midY} x2={W - PAD.right} y2={midY} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />

        {/* corner reads */}
        <text x={PAD.left + 7} y={PAD.top + 14} className="mr-mapquad good">smart &amp; cheap</text>
        <text x={W - PAD.right - 7} y={PAD.top + 14} textAnchor="end" className="mr-mapquad">smart &amp; premium</text>
        <text x={PAD.left + 7} y={H - PAD.bottom - 7} className="mr-mapquad dim">lighter &amp; cheap</text>
        <text x={W - PAD.right - 7} y={H - PAD.bottom - 7} textAnchor="end" className="mr-mapquad warn">hard to justify</text>

        {/* axes */}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} textAnchor="middle" className="mr-mapaxis">price $/M input →</text>
        <text x={12} y={(PAD.top + H - PAD.bottom) / 2} textAnchor="middle" className="mr-mapaxis" transform={`rotate(-90 12 ${(PAD.top + H - PAD.bottom) / 2})`}>intelligence →</text>
        <text x={PAD.left} y={H - PAD.bottom + 13} textAnchor="middle" className="mr-maptick">$0</text>
        <text x={W - PAD.right} y={H - PAD.bottom + 13} textAnchor="middle" className="mr-maptick">${Math.round(xMax)}</text>
        <text x={PAD.left - 5} y={H - PAD.bottom + 3} textAnchor="end" className="mr-maptick">{Math.round(yMin)}</text>
        <text x={PAD.left - 5} y={PAD.top + 8} textAnchor="end" className="mr-maptick">{Math.round(yMax)}</text>

        {/* dots */}
        {dots.map((d) => {
          const color = LABS[d.m.lab].color;
          const below = d.labelBelow || d.y <= PAD.top + 26;
          return (
            <g key={d.m.id} onClick={() => onPick(d.m.id)} style={{ cursor: "pointer" }}>
              <circle cx={d.x} cy={d.y} r="14" fill="transparent" />
              <circle cx={d.x} cy={d.y} r="6" fill={color} stroke="var(--bg)" strokeWidth="1.5">
                <title>{d.m.name} — index {d.index}, ${d.price}/M in</title>
              </circle>
              <text x={d.x} y={below ? d.y + 19 : d.y - 11} textAnchor="middle" className="mr-maplabel" fill={color}>
                {shortName(d.m.name)}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mr-mapnote">
        Tap a dot to open its card. Plotted: models with a neutral intelligence index and a comparable $/M price.
        Not plotted: {unplotted.map((m) => shortName(m.name)).join(", ")}.
      </p>
    </div>
  );
}
