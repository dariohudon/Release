// ── AI Release Radar — shared types & lab registry ───────────────────────────

export type ReleaseKind = "frontier" | "open-weights" | "update" | "preview";

export type LabId =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "mistral"
  | "deepseek"
  | "qwen"
  | "xai"
  | "moonshot"
  | "zai";

export interface Lab {
  id: LabId;
  name: string;
  monogram: string;
  color: string; // foreground (text on soft bg)
  bg: string; // soft background for monogram + chips
  hfOrgs: string[]; // Hugging Face orgs polled for live open-weights drops
}

export const LABS: Record<LabId, Lab> = {
  openai: { id: "openai", name: "OpenAI", monogram: "OA", color: "#065f46", bg: "#d1fae5", hfOrgs: ["openai"] },
  anthropic: { id: "anthropic", name: "Anthropic", monogram: "AN", color: "#9a3412", bg: "#ffedd5", hfOrgs: [] },
  google: { id: "google", name: "Google", monogram: "G", color: "#1e40af", bg: "#dbeafe", hfOrgs: ["google"] },
  meta: { id: "meta", name: "Meta", monogram: "M", color: "#1d4ed8", bg: "#e0e7ff", hfOrgs: ["meta-llama"] },
  mistral: { id: "mistral", name: "Mistral", monogram: "MI", color: "#92400e", bg: "#fef3c7", hfOrgs: ["mistralai"] },
  deepseek: { id: "deepseek", name: "DeepSeek", monogram: "DS", color: "#3730a3", bg: "#e0e7ff", hfOrgs: ["deepseek-ai"] },
  qwen: { id: "qwen", name: "Qwen", monogram: "QW", color: "#6d28d9", bg: "#ede9fe", hfOrgs: ["Qwen"] },
  xai: { id: "xai", name: "xAI", monogram: "X", color: "#111827", bg: "#f3f4f6", hfOrgs: ["xai-org"] },
  moonshot: { id: "moonshot", name: "Moonshot", monogram: "K", color: "#831843", bg: "#fce7f3", hfOrgs: ["moonshotai"] },
  zai: { id: "zai", name: "Z.ai", monogram: "Z", color: "#155e75", bg: "#cffafe", hfOrgs: ["zai-org"] },
};

export const LAB_IDS = Object.keys(LABS) as LabId[];

export interface ModelRelease {
  id: string; // stable unique key, e.g. "curated:gpt-5" or "hf:meta-llama/..."
  lab: LabId;
  name: string;
  date: string; // ISO date (YYYY-MM-DD or full ISO)
  kind: ReleaseKind;
  summary: string;
  tags: string[];
  url: string | null; // announcement or model card
  source: "curated" | "huggingface";
}

export const KIND_META: Record<ReleaseKind, { label: string; bg: string; color: string }> = {
  frontier: { label: "Frontier", bg: "#dbeafe", color: "#1e40af" },
  "open-weights": { label: "Open weights", bg: "#dcfce7", color: "#166534" },
  update: { label: "Update", bg: "#f3f4f6", color: "#374151" },
  preview: { label: "Preview", bg: "#fef9c3", color: "#713f12" },
};
