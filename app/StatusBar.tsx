"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon } from "lucide-react";

/* Top status row shared by Radar, Definitions, and Lab News:
   pulsing dot + MODEL RADAR on the left, date + compact menu on the right. */

const LINKS = [
  { href: "/", label: "Radar" },
  { href: "/definitions", label: "Definitions" },
  { href: "/news", label: "Lab News" },
];

function SiteMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mr-menu" ref={ref}>
      <button
        className="mr-menubtn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((o) => !o)}
      >
        <MenuIcon size={14} />
      </button>
      {open && (
        <div className="mr-menupanel" role="menu">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              role="menuitem"
              href={l.href}
              className={`mr-menuitem ${pathname === l.href ? "on" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export interface CheckBadgeProps {
  full: string;
  short: string;
  title: string;
  warn: boolean;
}

export default function StatusBar({ check }: { check: CheckBadgeProps }) {
  return (
    <div className="mr-eyebrow">
      <span className="mr-eyebrowleft"><span className="mr-livedot" /> Model Radar</span>
      <span className="mr-eyebrowright">
        <span className={`mr-checkbadge ${check.warn ? "warn" : ""}`} title={check.title}>
          <span className="mr-checkfull">{check.full}</span>
          <span className="mr-checkshort">{check.short}</span>
        </span>
        <SiteMenu />
      </span>
    </div>
  );
}
