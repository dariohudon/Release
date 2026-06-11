"use client";

import React, { useMemo } from "react";
import { LABS, MODELS, releasedDate, Model } from "@/lib/models/data";

/* Release timeline: recent months behind a "today" marker, horizon items
   ahead of it as hollow dots. Tap a dot to jump to its card. */

const DAY_MS = 24 * 60 * 60 * 1000;
const PAST_DAYS = 240;
const FUTURE_DAYS = 160;
const W = 360; // viewBox units; rendered at 100% width
const H = 86;
const TRACK_Y = 46;
const LANES = [-14, 0, -28]; // vertical stagger to keep close dots tappable

interface Dot {
  m: Model;
  x: number;
  lane: number;
  horizon: boolean;
}

export default function Timeline({ onPick }: { onPick: (id: string) => void }) {
  const { dots, months, todayX } = useMemo(() => {
    const now = Date.now();
    const start = now - PAST_DAYS * DAY_MS;
    const end = now + FUTURE_DAYS * DAY_MS;
    const toX = (t: number) => ((t - start) / (end - start)) * W;

    const dots: Dot[] = [];
    const placed = MODELS
      .map((m) => ({ m, d: releasedDate(m.released) }))
      .filter((e): e is { m: Model; d: Date } => e.d !== null)
      .filter((e) => e.d.getTime() >= start && e.d.getTime() <= end)
      .sort((a, b) => a.d.getTime() - b.d.getTime());

    placed.forEach((e, i) => {
      dots.push({
        m: e.m,
        x: toX(e.d.getTime()),
        lane: LANES[i % LANES.length],
        horizon: e.m.status === "horizon",
      });
    });

    // month ticks
    const months: { x: number; label: string }[] = [];
    const cursor = new Date(start);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    while (cursor.getTime() < end) {
      months.push({ x: toX(cursor.getTime()), label: names[cursor.getMonth()] });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { dots, months, todayX: toX(now) };
  }, []);

  return (
    <div className="mr-timeline">
      <div className="mr-tlhead">
        <span className="mr-tllabel">release timeline</span>
        <span className="mr-tlkey">
          <i className="k-solid" /> shipped&ensp;<i className="k-hollow" /> horizon&ensp;<i className="k-today" /> today
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mr-tlsvg" role="img" aria-label="Model release timeline">
        {/* month ticks */}
        {months.map((mo, i) => (
          <g key={i}>
            <line x1={mo.x} y1={TRACK_Y - 4} x2={mo.x} y2={TRACK_Y + 4} stroke="var(--line)" strokeWidth="1" />
            <text x={mo.x} y={H - 8} textAnchor="middle" className="mr-tltick">{mo.label}</text>
          </g>
        ))}
        {/* track */}
        <line x1="0" y1={TRACK_Y} x2={W} y2={TRACK_Y} stroke="var(--line)" strokeWidth="1.5" />
        {/* future segment, dashed */}
        <line x1={todayX} y1={TRACK_Y} x2={W} y2={TRACK_Y} stroke="var(--dim)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
        {/* today marker */}
        <line x1={todayX} y1={10} x2={todayX} y2={TRACK_Y + 8} stroke="var(--good)" strokeWidth="1.5" />
        <circle cx={todayX} cy={TRACK_Y} r="3" fill="var(--good)" />
        {/* dots */}
        {dots.map((d) => {
          const color = LABS[d.m.lab].color;
          const cy = TRACK_Y + d.lane;
          return (
            <g key={d.m.id} onClick={() => onPick(d.m.id)} style={{ cursor: "pointer" }}>
              {d.lane !== 0 && <line x1={d.x} y1={TRACK_Y} x2={d.x} y2={cy} stroke={color} strokeWidth="1" opacity="0.4" />}
              {/* generous invisible hit area for thumbs */}
              <circle cx={d.x} cy={cy} r="13" fill="transparent" />
              <circle
                cx={d.x} cy={cy} r="5.5"
                fill={d.horizon ? "var(--bg)" : color}
                stroke={color} strokeWidth="1.8"
                strokeDasharray={d.horizon ? "2 2" : undefined}
              >
                <title>{d.m.name} — {d.m.released}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
