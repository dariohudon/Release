"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { LABS, TYPES, JOBS, MODELS, VERDICT_META, Verdict } from "@/lib/models/data";

/* Secondary filters live behind the "Filters" button: bottom sheet on
   mobile, centered panel on desktop. Edits a draft; Apply commits, Clear all
   commits the defaults. Search stays on the page — it's primary. */

export interface SecondaryFilters {
  labFilter: string;
  typeFilter: string;
  sortBy: string;
  jobFilter: string | null;
  verdictFilter: string;
}

export const DEFAULT_FILTERS: SecondaryFilters = {
  labFilter: "all",
  typeFilter: "all",
  sortBy: "index",
  jobFilter: null,
  verdictFilter: "all",
};

export function countActiveFilters(f: SecondaryFilters): number {
  let n = 0;
  if (f.labFilter !== DEFAULT_FILTERS.labFilter) n++;
  if (f.typeFilter !== DEFAULT_FILTERS.typeFilter) n++;
  if (f.sortBy !== DEFAULT_FILTERS.sortBy) n++;
  if (f.jobFilter !== DEFAULT_FILTERS.jobFilter) n++;
  if (f.verdictFilter !== DEFAULT_FILTERS.verdictFilter) n++;
  return n;
}

const VERDICT_KEYS: ("all" | Verdict)[] = ["all", "use", "watch", "ignore"];

const SORTS = [
  { key: "index", label: "intelligence" },
  { key: "newest", label: "newest" },
  { key: "price", label: "cheapest" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mr-sheetsec">
      <div className="mr-sheetsectitle">{title}</div>
      {children}
    </div>
  );
}

export default function FilterSheet({
  open,
  current,
  onApply,
  onClose,
}: {
  open: boolean;
  current: SecondaryFilters;
  onApply: (f: SecondaryFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SecondaryFilters>(current);
  const panelRef = useRef<HTMLDivElement>(null);

  const verdictCounts = useMemo(() => {
    const c: Record<string, number> = { all: MODELS.length, use: 0, watch: 0, ignore: 0 };
    MODELS.forEach((m) => { c[m.verdict]++; });
    return c;
  }, []);

  // Re-seed the draft each time the sheet opens, lock body scroll, close on
  // Escape, move focus into the dialog.
  useEffect(() => {
    if (!open) return;
    setDraft(current);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const set = (patch: Partial<SecondaryFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="mr-sheetwrap" onClick={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="mr-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mr-sheethandle" aria-hidden="true" />
        <div className="mr-sheethead">
          <h2 className="mr-sheettitle">Filters</h2>
          <button className="mr-sheetclose" onClick={onClose} aria-label="Close filters">
            <X size={15} />
          </button>
        </div>

        <div className="mr-sheetbody">
          <Section title="Triage">
            <div className="mr-verdictrow" role="tablist" aria-label="Verdict filter">
              {VERDICT_KEYS.map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={draft.verdictFilter === k}
                  className={`mr-vbtn ${draft.verdictFilter === k ? "on" : ""} ${k !== "all" ? `v-${k}` : ""}`}
                  onClick={() => set({ verdictFilter: k })}
                >
                  {k === "all" ? "all" : VERDICT_META[k].label}
                  <i>{verdictCounts[k]}</i>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Lab">
            <div className="mr-sheetchips">
              <button className={`mr-chip ${draft.labFilter === "all" ? "on" : ""}`} onClick={() => set({ labFilter: "all" })}>
                all labs
              </button>
              {Object.entries(LABS).map(([k, v]) => (
                <button key={k} className={`mr-chip ${draft.labFilter === k ? "on" : ""}`} onClick={() => set({ labFilter: k })}>
                  <i className="mr-labdot" style={{ background: v.color }} />{v.name}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Sort">
            <div className="mr-sheetseg" role="tablist" aria-label="Sort by">
              {SORTS.map((s) => (
                <button key={s.key} role="tab" aria-selected={draft.sortBy === s.key}
                  className={draft.sortBy === s.key ? "on" : ""}
                  onClick={() => set({ sortBy: s.key })}>
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Model type">
            <div className="mr-sheetchips">
              {TYPES.map((t) => (
                <button key={t.key} className={`mr-chip ${draft.typeFilter === t.key ? "on" : ""}`} onClick={() => set({ typeFilter: t.key })}>
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Best for">
            <div className="mr-sheetchips">
              {JOBS.map((j) => (
                <button key={j.key} className={`mr-chip mr-jobchip ${draft.jobFilter === j.key ? "on" : ""}`}
                  onClick={() => set({ jobFilter: draft.jobFilter === j.key ? null : j.key })}>
                  {j.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="mr-sheetfoot">
          <button className="mr-sheetclear" onClick={() => { setDraft(DEFAULT_FILTERS); onApply(DEFAULT_FILTERS); }}>
            Clear all
          </button>
          <button className="mr-sheetapply" onClick={() => { onApply(draft); onClose(); }}>
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
