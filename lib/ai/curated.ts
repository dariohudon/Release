import { ModelRelease } from "./types";

// Curated timeline of notable model releases. This is the baseline dataset so
// the radar is useful with zero network access or API keys; live sources are
// merged on top of it. Append new entries at the top as labs ship.

function entry(r: Omit<ModelRelease, "id" | "source"> & { slug: string }): ModelRelease {
  const { slug, ...rest } = r;
  return { id: `curated:${slug}`, source: "curated", ...rest };
}

export const CURATED_RELEASES: ModelRelease[] = [
  entry({
    slug: "claude-opus-4-5", lab: "anthropic", name: "Claude Opus 4.5", date: "2025-11-24",
    kind: "frontier", summary: "Anthropic's strongest model for coding, agents, and computer use.",
    tags: ["Reasoning", "Agents", "200K context"], url: "https://www.anthropic.com/news/claude-opus-4-5",
  }),
  entry({
    slug: "gemini-3-pro", lab: "google", name: "Gemini 3 Pro", date: "2025-11-18",
    kind: "frontier", summary: "Third-generation Gemini flagship with state-of-the-art multimodal reasoning.",
    tags: ["Multimodal", "1M context"], url: "https://blog.google/products/gemini/gemini-3/",
  }),
  entry({
    slug: "grok-4-1", lab: "xai", name: "Grok 4.1", date: "2025-11-17",
    kind: "frontier", summary: "Improved creative writing and emotional intelligence over Grok 4.",
    tags: ["Reasoning"], url: "https://x.ai/news/grok-4-1",
  }),
  entry({
    slug: "gpt-5-1", lab: "openai", name: "GPT-5.1", date: "2025-11-12",
    kind: "frontier", summary: "GPT-5 refresh with Instant and Thinking variants and adaptive reasoning.",
    tags: ["Reasoning", "Adaptive"], url: "https://openai.com/index/gpt-5-1/",
  }),
  entry({
    slug: "kimi-k2-thinking", lab: "moonshot", name: "Kimi K2 Thinking", date: "2025-11-06",
    kind: "open-weights", summary: "Open-weights trillion-parameter MoE reasoning model with strong agentic tool use.",
    tags: ["Reasoning", "MoE", "Agents"], url: "https://huggingface.co/moonshotai/Kimi-K2-Thinking",
  }),
  entry({
    slug: "claude-haiku-4-5", lab: "anthropic", name: "Claude Haiku 4.5", date: "2025-10-15",
    kind: "frontier", summary: "Small, fast model with near-Sonnet-4 coding performance at a third of the cost.",
    tags: ["Fast", "Low cost"], url: "https://www.anthropic.com/news/claude-haiku-4-5",
  }),
  entry({
    slug: "glm-4-6", lab: "zai", name: "GLM-4.6", date: "2025-09-30",
    kind: "open-weights", summary: "Open-weights coding and agent model with a 200K context window.",
    tags: ["Coding", "200K context"], url: "https://huggingface.co/zai-org/GLM-4.6",
  }),
  entry({
    slug: "claude-sonnet-4-5", lab: "anthropic", name: "Claude Sonnet 4.5", date: "2025-09-29",
    kind: "frontier", summary: "Long-horizon agentic coding model; sustained multi-hour autonomous work.",
    tags: ["Coding", "Agents"], url: "https://www.anthropic.com/news/claude-sonnet-4-5",
  }),
  entry({
    slug: "deepseek-v3-2-exp", lab: "deepseek", name: "DeepSeek-V3.2-Exp", date: "2025-09-29",
    kind: "open-weights", summary: "Experimental sparse-attention release cutting long-context inference cost.",
    tags: ["Sparse attention", "Low cost"], url: "https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp",
  }),
  entry({
    slug: "qwen3-max", lab: "qwen", name: "Qwen3-Max", date: "2025-09-24",
    kind: "frontier", summary: "Alibaba's trillion-parameter flagship topping open-model leaderboards.",
    tags: ["MoE"], url: "https://qwen.ai/",
  }),
  entry({
    slug: "gpt-5", lab: "openai", name: "GPT-5", date: "2025-08-07",
    kind: "frontier", summary: "Unified flagship with automatic routing between fast and deep-reasoning modes.",
    tags: ["Reasoning", "Multimodal"], url: "https://openai.com/index/introducing-gpt-5/",
  }),
  entry({
    slug: "gpt-oss", lab: "openai", name: "gpt-oss-120b / 20b", date: "2025-08-05",
    kind: "open-weights", summary: "OpenAI's first open-weights models since GPT-2, Apache-2.0 licensed.",
    tags: ["MoE", "Apache-2.0"], url: "https://openai.com/index/introducing-gpt-oss/",
  }),
  entry({
    slug: "claude-opus-4-1", lab: "anthropic", name: "Claude Opus 4.1", date: "2025-08-05",
    kind: "update", summary: "Opus 4 refresh with stronger agentic coding and in-depth research.",
    tags: ["Coding", "Agents"], url: "https://www.anthropic.com/news/claude-opus-4-1",
  }),
  entry({
    slug: "glm-4-5", lab: "zai", name: "GLM-4.5", date: "2025-07-28",
    kind: "open-weights", summary: "355B-parameter MoE built for agentic tasks, with a lighter Air variant.",
    tags: ["MoE", "Agents"], url: "https://huggingface.co/zai-org/GLM-4.5",
  }),
  entry({
    slug: "kimi-k2", lab: "moonshot", name: "Kimi K2", date: "2025-07-11",
    kind: "open-weights", summary: "1T-parameter open MoE that set new marks for open-model coding.",
    tags: ["MoE", "Coding"], url: "https://huggingface.co/moonshotai/Kimi-K2-Instruct",
  }),
  entry({
    slug: "grok-4", lab: "xai", name: "Grok 4", date: "2025-07-09",
    kind: "frontier", summary: "xAI flagship with native tool use and real-time X search integration.",
    tags: ["Reasoning", "Tools"], url: "https://x.ai/news/grok-4",
  }),
  entry({
    slug: "magistral", lab: "mistral", name: "Magistral", date: "2025-06-10",
    kind: "open-weights", summary: "Mistral's first reasoning model line, with an open Small variant.",
    tags: ["Reasoning"], url: "https://mistral.ai/news/magistral",
  }),
  entry({
    slug: "claude-4", lab: "anthropic", name: "Claude Opus 4 & Sonnet 4", date: "2025-05-22",
    kind: "frontier", summary: "Fourth-generation Claude; long-running agent workflows and top coding scores.",
    tags: ["Coding", "Agents"], url: "https://www.anthropic.com/news/claude-4",
  }),
  entry({
    slug: "mistral-medium-3", lab: "mistral", name: "Mistral Medium 3", date: "2025-05-07",
    kind: "frontier", summary: "Frontier-class performance at an aggressive price point for enterprise.",
    tags: ["Low cost"], url: "https://mistral.ai/news/mistral-medium-3",
  }),
  entry({
    slug: "qwen3", lab: "qwen", name: "Qwen3", date: "2025-04-29",
    kind: "open-weights", summary: "Hybrid thinking/non-thinking family from 0.6B to 235B MoE.",
    tags: ["MoE", "Hybrid reasoning"], url: "https://huggingface.co/Qwen/Qwen3-235B-A22B",
  }),
  entry({
    slug: "o3-o4-mini", lab: "openai", name: "o3 & o4-mini", date: "2025-04-16",
    kind: "frontier", summary: "Reasoning models that think with images and use every ChatGPT tool.",
    tags: ["Reasoning", "Multimodal"], url: "https://openai.com/index/introducing-o3-and-o4-mini/",
  }),
  entry({
    slug: "gpt-4-1", lab: "openai", name: "GPT-4.1", date: "2025-04-14",
    kind: "update", summary: "API-only family (4.1 / mini / nano) with 1M-token context.",
    tags: ["1M context", "API"], url: "https://openai.com/index/gpt-4-1/",
  }),
  entry({
    slug: "llama-4", lab: "meta", name: "Llama 4 Scout & Maverick", date: "2025-04-05",
    kind: "open-weights", summary: "Natively multimodal MoE family; Scout targets a 10M-token context.",
    tags: ["MoE", "Multimodal", "10M context"], url: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
  }),
  entry({
    slug: "gemini-2-5-pro", lab: "google", name: "Gemini 2.5 Pro", date: "2025-03-25",
    kind: "frontier", summary: "Thinking-first flagship that led benchmarks on release with 1M context.",
    tags: ["Reasoning", "1M context"], url: "https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/",
  }),
  entry({
    slug: "gemma-3", lab: "google", name: "Gemma 3", date: "2025-03-12",
    kind: "open-weights", summary: "Open multimodal family (1B–27B) that runs on a single GPU.",
    tags: ["Multimodal", "On-device"], url: "https://blog.google/technology/developers/gemma-3/",
  }),
  entry({
    slug: "gpt-4-5", lab: "openai", name: "GPT-4.5", date: "2025-02-27",
    kind: "preview", summary: "Research preview scaling unsupervised learning; later folded into GPT-5.",
    tags: ["Preview"], url: "https://openai.com/index/introducing-gpt-4-5/",
  }),
  entry({
    slug: "claude-3-7-sonnet", lab: "anthropic", name: "Claude 3.7 Sonnet", date: "2025-02-24",
    kind: "frontier", summary: "First hybrid reasoning Claude, with visible extended thinking.",
    tags: ["Hybrid reasoning"], url: "https://www.anthropic.com/news/claude-3-7-sonnet",
  }),
  entry({
    slug: "grok-3", lab: "xai", name: "Grok 3", date: "2025-02-17",
    kind: "frontier", summary: "Trained on the 200K-GPU Colossus cluster; added Think mode.",
    tags: ["Reasoning"], url: "https://x.ai/news/grok-3",
  }),
  entry({
    slug: "deepseek-r1", lab: "deepseek", name: "DeepSeek-R1", date: "2025-01-20",
    kind: "open-weights", summary: "Open reasoning model rivaling o1 at a fraction of the cost; MIT licensed.",
    tags: ["Reasoning", "MIT"], url: "https://huggingface.co/deepseek-ai/DeepSeek-R1",
  }),
  entry({
    slug: "deepseek-v3", lab: "deepseek", name: "DeepSeek-V3", date: "2024-12-26",
    kind: "open-weights", summary: "671B MoE trained for ~$5.6M that reset open-model expectations.",
    tags: ["MoE"], url: "https://huggingface.co/deepseek-ai/DeepSeek-V3",
  }),
  entry({
    slug: "gemini-2-0-flash", lab: "google", name: "Gemini 2.0 Flash", date: "2024-12-11",
    kind: "frontier", summary: "Agent-era Gemini with native tool use and multimodal output.",
    tags: ["Multimodal", "Agents"], url: "https://blog.google/technology/google-deepmind/google-gemini-ai-update-december-2024/",
  }),
  entry({
    slug: "llama-3-3", lab: "meta", name: "Llama 3.3 70B", date: "2024-12-06",
    kind: "open-weights", summary: "405B-class quality in a 70B model via post-training advances.",
    tags: ["Efficient"], url: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  }),
  entry({
    slug: "o1", lab: "openai", name: "o1", date: "2024-12-05",
    kind: "frontier", summary: "First full release of OpenAI's chain-of-thought reasoning series.",
    tags: ["Reasoning"], url: "https://openai.com/o1/",
  }),
];
