import type { Metadata } from "next";
import StatusBar from "../StatusBar";
import DefinitionsClient from "./DefinitionsClient";
import "../radar.css";

export const metadata: Metadata = {
  title: "AI Definitions — Model Radar",
  description: "Model-release language translated into plain English.",
};

export default function DefinitionsPage() {
  return (
    <div className="mr-root">
      <div className="mr-wrap">
        <StatusBar />
        <h1 className="mr-title">AI Definitions</h1>
        <p className="mr-sub">
          Model-release language, translated into plain English — what the terms in
          launch posts and spec sheets actually mean, and why they matter to your work.
        </p>
        <DefinitionsClient />
        <div className="mr-foot">
          Static glossary — edit lib/definitions/data.ts to add terms.<br />
          Built for Dario · Octopus &amp; Son.
        </div>
      </div>
    </div>
  );
}
