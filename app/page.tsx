import type { Metadata } from "next";
import ModelRadar from "./ModelRadar";
import { checkBadge } from "@/lib/updateStatus";

export const metadata: Metadata = {
  title: "Model Radar",
  description: "The AI frontier at a glance — closed flagships, open-weight leaders, and what's coming.",
};

// Re-read the update-checker status file (written by the daily cron) at most
// hourly. The page itself never fetches external sources.
export const revalidate = 3600;

export default function Home() {
  return <ModelRadar check={checkBadge()} />;
}
