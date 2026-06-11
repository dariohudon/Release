import type { Metadata } from "next";
import ModelRadar from "./ModelRadar";

export const metadata: Metadata = {
  title: "Model Radar",
  description: "The AI frontier at a glance — closed flagships, open-weight leaders, and what's coming.",
};

export default function ModelsPage() {
  return <ModelRadar />;
}
