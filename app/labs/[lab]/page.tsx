import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LABS, LAB_PROFILES, MODELS, releasedDate } from "@/lib/models/data";
import LabModels from "./LabModels";
import "../../radar.css";

export function generateStaticParams() {
  return Object.keys(LABS).map((lab) => ({ lab }));
}

export async function generateMetadata({ params }: { params: Promise<{ lab: string }> }): Promise<Metadata> {
  const { lab } = await params;
  const l = LABS[lab];
  if (!l) return { title: "Model Radar" };
  return {
    title: `${l.name} — Model Radar`,
    description: LAB_PROFILES[lab]?.about.slice(0, 150),
  };
}

export default async function LabPage({ params }: { params: Promise<{ lab: string }> }) {
  const { lab } = await params;
  const l = LABS[lab];
  const profile = LAB_PROFILES[lab];
  if (!l || !profile) notFound();

  const models = MODELS
    .filter((m) => m.lab === lab)
    .sort((a, b) => (releasedDate(b.released)?.getTime() ?? 0) - (releasedDate(a.released)?.getTime() ?? 0));

  return (
    <div className="mr-root" style={{ "--lab": l.color } as React.CSSProperties}>
      <div className="mr-wrap">
        <Link href="/" className="mr-back">← Model Radar</Link>

        <div className="mr-labhero">
          <span className="mr-labrail" />
          <div>
            <div className="mr-eyebrow" style={{ marginBottom: 6 }}>lab profile</div>
            <h1 className="mr-title" style={{ color: l.color }}>{l.name}</h1>
            <p className="mr-labout">{profile.about}</p>
            <div className="mr-labfocus">
              {profile.focus.map((f) => <span key={f} className="mr-chip mr-focuschip">{f}</span>)}
            </div>
            <div className="mr-lablinks">
              {profile.links.map((lnk) => (
                <a key={lnk.url} className="mr-link" style={{ background: l.color }} href={lnk.url} target="_blank" rel="noreferrer">
                  {lnk.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mr-grouphead" style={{ marginTop: 30 }}>
          <span className="mr-grouptitle">On the radar · {models.length}</span>
          <span className="mr-groupnote">newest first</span>
        </div>

        {models.length > 0
          ? <LabModels models={models} />
          : <p className="mr-empty">No tracked models from {l.name} yet.</p>}

        <div className="mr-foot">
          Profile is evergreen background; figures live on the model cards and in lib/models/data.ts.<br />
          Built for Dario · Octopus &amp; Son.
        </div>
      </div>
    </div>
  );
}
