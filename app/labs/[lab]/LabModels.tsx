"use client";

import { useState } from "react";
import { Model } from "@/lib/models/data";
import { ModelCard } from "../../ModelCard";

export default function LabModels({ models }: { models: Model[] }) {
  const [openId, setOpenId] = useState<string | null>(models[0]?.id ?? null);
  return (
    <>
      {models.map((m) => (
        <ModelCard
          key={m.id}
          m={m}
          expanded={openId === m.id}
          onToggle={() => setOpenId(openId === m.id ? null : m.id)}
          showLabLink={false}
        />
      ))}
    </>
  );
}
