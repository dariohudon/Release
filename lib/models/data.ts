/* ──────────────────────────────────────────────────────────────
   MODEL RADAR — catalog data
   Seed data verified for the June 2026 landscape.
   Figures are directional; open a card for the source link.
   Update this file to change the catalog — the component reads
   everything from here. No network calls by design.
   ────────────────────────────────────────────────────────────── */

export interface Lab {
  name: string;
  color: string;
}

export interface Sentiment {
  score: number;
  label: string;
  summary: string;
}

export type ModelStatus = "new" | "live" | "horizon";

/* Triage: "use" = in the toolkit, "watch" = interesting but not yet,
   "ignore" = noise for this studio. Defaults set from the forDario notes
   — override freely. */
export type Verdict = "use" | "watch" | "ignore";

export interface Model {
  id: string;
  lab: string;
  name: string;
  tags: string[];
  released: string;
  status: ModelStatus;
  verdict: Verdict;
  confidence?: string;
  tier: string;
  bestAt: string;
  index: number | null;
  indexNote?: string;
  priceIn: string | null;
  priceOut: string | null;
  priceNote?: string;
  context?: string;
  speed?: string;
  strengths: string[];
  watchouts: string[];
  useFor: string;
  forDario?: string;
  sentiment: Sentiment;
  link: string;
  openWeight?: boolean;
}

export const LABS: Record<string, Lab> = {
  anthropic: { name: "Anthropic", color: "#D98A4E" },
  openai:    { name: "OpenAI",    color: "#2DD4A7" },
  google:    { name: "Google",    color: "#6E8AFF" },
  xai:       { name: "xAI",       color: "#C7CEDB" },
  meta:      { name: "Meta",      color: "#2F8FE8" },
  deepseek:  { name: "DeepSeek",  color: "#8B7CF5" },
  alibaba:   { name: "Alibaba / Qwen", color: "#E06C9F" },
  zai:       { name: "Z.ai (GLM)", color: "#5BD0B0" },
  moonshot:  { name: "Moonshot (Kimi)", color: "#B07CFF" },
  minimax:   { name: "MiniMax",   color: "#EC6A6A" },
  microsoft: { name: "Microsoft", color: "#46C2D6" },
  mistral:   { name: "Mistral",   color: "#F2934A" },
};

export const TYPES = [
  { key: "all", label: "all types" },
  { key: "flagship", label: "flagship" },
  { key: "reasoning", label: "reasoning" },
  { key: "coding", label: "coding" },
  { key: "creative", label: "creative" },
  { key: "small", label: "small & edge" },
  { key: "open", label: "open-weight" },
  { key: "frontier", label: "frontier" },
];

export const MODELS: Model[] = [
  /* ── ANTHROPIC ── */
  {
    id: "fable-5", lab: "anthropic", name: "Claude Fable 5", tags: ["creative"],
    verdict: "use",
    released: "2026-06-09", status: "new", tier: "Mythos-class · creative",
    bestAt: "Creative + long-form writing that doesn't read as AI; surprisingly strong code",
    index: null, indexNote: "specialist",
    priceIn: "~10", priceOut: "~50", priceNote: "~2× Opus, well under GPT-5.5 Pro",
    context: "≈1M", speed: "Standard",
    strengths: ["Narrative, scripts, character voice", "Top creative-quality tier", "Big coding-benchmark numbers (FrontierCode 29.3% vs GPT-5.5 5.7%)"],
    watchouts: ["Priced above Opus", "Very new — limited independent testing"],
    useFor: "Client-facing copy, brand narrative, creative work where tone matters most.",
    forDario: "Your strongest pick for O&S client copy — pair it with your anti-‘AI-look’ prompt template.",
    sentiment: { score: 78, label: "Hot / early", summary: "Excitement over creative quality and unexpected coding scores; the 2× price is the main gripe." },
    link: "https://claude.ai",
  },
  {
    id: "opus-4-8", lab: "anthropic", name: "Claude Opus 4.8", tags: ["flagship", "coding"],
    verdict: "use",
    released: "2026-05-28", status: "live", tier: "Flagship",
    bestAt: "#1 overall intelligence; hardest agentic coding and reliability",
    index: 61.4, priceIn: "5", priceOut: "25", context: "1M", speed: "Fast mode ~2.5×",
    strengths: ["Tops Intelligence Index (61.4)", "SWE-bench Pro 69.2% — clear coding lead", "Most honest about its own uncertainty", "Hundreds of parallel subagents in Claude Code"],
    watchouts: ["Trails GPT-5.5 on terminal coding (74.6 vs 78.2)", "Verbose → fills context, raises cost", "Priciest of the big four on output"],
    useFor: "Multi-file refactors, root-cause debugging, agentic and knowledge work.",
    forDario: "The workhorse for the O&S static rebuild and The Hub — best at multi-file reliability.",
    sentiment: { score: 70, label: "Respected, mixed launch", summary: "Loved for reliability; some expected a bigger lead. Verbosity + cost recur in complaints." },
    link: "https://www.anthropic.com/claude",
  },
  {
    id: "sonnet-4-6", lab: "anthropic", name: "Claude Sonnet 4.6", tags: ["balanced"],
    verdict: "use",
    released: "2026-03-01", status: "live", tier: "Balanced workhorse",
    bestAt: "Best quality-per-dollar for everyday + production tasks",
    index: 54, indexNote: "approx", priceIn: "~3", priceOut: "~15", priceNote: "approx — check Anthropic",
    context: "1M", speed: "Fast",
    strengths: ["Strong all-round at a fraction of Opus cost", "Great for high-throughput production", "Reliable instruction-following"],
    watchouts: ["Not the top reasoner", "Outclassed by Opus on the hardest tasks"],
    useFor: "Most day-to-day drafting, code, and agent steps where Opus is overkill.",
    forDario: "Sensible default for routine O&S work — save Opus/Fable for the hard or high-stakes pieces.",
    sentiment: { score: 76, label: "Quiet favorite", summary: "Often called the best value in the Claude line; the model people actually run all day." },
    link: "https://www.anthropic.com/claude",
  },
  {
    id: "haiku-4-5", lab: "anthropic", name: "Claude Haiku 4.5", tags: ["small"],
    verdict: "watch",
    released: "2025-10-01", status: "live", tier: "Small / fast",
    bestAt: "Cheap, low-latency tasks at scale",
    index: null, indexNote: "small-tier", priceIn: "~1", priceOut: "~5", priceNote: "approx",
    context: "200K", speed: "Very fast",
    strengths: ["Lowest latency in the Claude line", "Cheap enough for high-volume calls", "Good for classification, extraction, routing"],
    watchouts: ["Limited deep reasoning", "Not for complex multi-step work"],
    useFor: "Tagging, routing, summarizing, anything cheap-and-fast at volume.",
    forDario: "Good as the cheap first pass in a pipeline — route hard cases up to Sonnet/Opus.",
    sentiment: { score: 64, label: "Dependable tool", summary: "Not flashy; valued for speed and price in production pipelines." },
    link: "https://www.anthropic.com/claude",
  },
  {
    id: "mythos-preview", lab: "anthropic", name: "Claude Mythos Preview", tags: ["frontier"],
    verdict: "ignore",
    released: "2026-04", status: "live", tier: "Frontier · restricted",
    bestAt: "Anthropic's most advanced model; advanced cybersecurity capability",
    index: null, indexNote: "restricted", priceIn: null, priceOut: null,
    context: "—", speed: "—",
    strengths: ["The frontier ceiling of the Claude 5 / Mythos line", "Captivated industry on cyber capability", "Shares its base with Fable 5"],
    watchouts: ["Not public — limited orgs only (Project Glasswing)", "No general API access", "Released cyber-safeguarded for risk reasons"],
    useFor: "Reference point for where the frontier sits — you can't call it directly.",
    forDario: "Context only — it's why Fable 5 (the public sibling) is suddenly so capable.",
    sentiment: { score: 72, label: "Mythologized", summary: "Talked about more than used; the restricted ‘what could it do’ model that moved markets." },
    link: "https://www.anthropic.com/glasswing",
  },
  /* ── OPENAI ── */
  {
    id: "gpt-5-5", lab: "openai", name: "GPT-5.5", tags: ["flagship", "coding", "creative"],
    verdict: "watch",
    released: "2026-04-23", status: "live", tier: "Flagship",
    bestAt: "Creative writing leader; terminal coding and computer-use champion",
    index: 60.2, priceIn: "5", priceOut: "30", context: "1M (Codex 400K)", speed: "Instant tier available",
    strengths: ["Leads creative writing", "Terminal-Bench 78.2% — best CLI automation", "First fully retrained base since GPT-4.5; natively omnimodal", "‘Does more with less guidance’"],
    watchouts: ["Highest output price ($30/M)", "Codex context capped at 400K", "Pro tier is a steep premium"],
    useFor: "CLI-heavy automation, computer use, long tool sequences, creative drafts.",
    forDario: "Strong alt for client creative copy and for agentic/terminal tooling.",
    sentiment: { score: 74, label: "Coding favorite", summary: "Still the default for many builders; praised for autonomy and writing. Cost draws grumbles." },
    link: "https://openai.com/index/introducing-gpt-5-5/",
  },
  {
    id: "gpt-5-3-codex", lab: "openai", name: "GPT-5.3-Codex", tags: ["coding"],
    verdict: "ignore",
    released: "2026-02-05", status: "live", tier: "Coding specialist",
    bestAt: "Fast repo-aware coding: search, terminal, debug",
    index: null, indexNote: "specialist", priceIn: "—", priceOut: "—",
    context: "—", speed: "~25% faster than Opus 4.6",
    strengths: ["Runs terminal commands + searches repos", "Built for debug loops", "Lives in the Codex app + web"],
    watchouts: ["Narrower than the GPT-5.5 generalist", "API access still rolling out"],
    useFor: "Tight coding loops inside the Codex environment.",
    forDario: "If you live in a Codex-style workflow; otherwise Opus 4.8 covers your builds.",
    sentiment: { score: 67, label: "Niche-loved", summary: "Fans in the Codex crowd; less discussed by the general user base." },
    link: "https://openai.com/news/",
  },
  /* ── GOOGLE ── */
  {
    id: "gemini-3-1-pro", lab: "google", name: "Gemini 3.1 Pro", tags: ["flagship", "reasoning"],
    verdict: "watch",
    released: "2026-02-19", status: "live", tier: "Flagship · reasoning",
    bestAt: "Reasoning and data-analysis leader; deep multimodal",
    index: 57, priceIn: "—", priceOut: "—", priceNote: "see Google pricing",
    context: "1M+", speed: "Standard",
    strengths: ["Leads on reasoning + data analysis", "Strong multimodal understanding", "Long context"],
    watchouts: ["Pricing less transparent", "Overshadowed by cheaper 3.5 Flash for many tasks"],
    useFor: "Data analysis, research, multimodal and long-context reasoning.",
    forDario: "Good fit for your civic-data work — Alberta Data Centre Map audits, council-vote analysis.",
    sentiment: { score: 66, label: "Quietly strong", summary: "Well-regarded for analysis; the ‘thinking’ Gemini, even as attention moved to Flash." },
    link: "https://gemini.google.com",
  },
  {
    id: "gemini-3-5-flash", lab: "google", name: "Gemini 3.5 Flash", tags: ["flagship", "small"],
    verdict: "use",
    released: "2026-05-19", status: "new", tier: "Value / speed",
    bestAt: "Cheapest + fastest near-frontier model; high-volume agentic work",
    index: 55.3, priceIn: "1.50", priceOut: "9", context: "1M", speed: "≈4× faster than rivals",
    strengths: ["~4× faster, ~70% cheaper than Opus", "Beats old 3.1 Pro on coding/agentic", "Default in Gemini app + Search AI Mode"],
    watchouts: ["High hallucination rate flagged (~61% in one eval)", "Flash tier — not the deepest reasoner"],
    useFor: "High-volume drafts, parallel agentic tasks, speed/cost-first jobs.",
    forDario: "Best value for bulk GEO article drafts at volume — then refine in Opus/Fable.",
    sentiment: { score: 72, label: "Value darling", summary: "Loved for price/speed and being everywhere; hallucination worry keeps it off unreviewed pipelines." },
    link: "https://gemini.google.com",
  },
  {
    id: "gemma-4", lab: "google", name: "Gemma 4", tags: ["small", "open"], openWeight: true,
    verdict: "watch",
    released: "2026-03-01", status: "live", tier: "Open · small",
    bestAt: "Easy, permissive open model that runs on a single GPU",
    index: null, indexNote: "open small", priceIn: "0", priceOut: "0", priceNote: "free to self-host",
    context: "128K", speed: "Hardware-dependent",
    strengths: ["Strong for its size (26B A4B)", "Friendly license + huge ecosystem", "A common ‘start here’ for self-hosting"],
    watchouts: ["Below frontier on hard tasks", "You manage infra"],
    useFor: "On-device / private inference, fine-tuning, learning to self-host.",
    forDario: "A clean candidate for self-hosted jobs on ‘leonard’ — permissive and light.",
    sentiment: { score: 71, label: "Solid starter", summary: "Recommended as an easy on-ramp to local LLMs alongside Phi and Qwen." },
    link: "https://ai.google.dev/gemma",
  },
  /* ── xAI ── */
  {
    id: "grok-4-3", lab: "xai", name: "Grok 4.3", tags: ["flagship"],
    verdict: "ignore",
    released: "2026-04-30", status: "live", tier: "Flagship · value",
    bestAt: "Cheapest of the big four; strong agentic + tool use",
    index: 53, priceIn: "low", priceOut: "low", priceNote: "lowest of the big four",
    context: "Large", speed: "Fast",
    strengths: ["Best price among the big-four flagships", "Solid agentic + tool-use scores", "Real-time leanings"],
    watchouts: ["Lowest Intelligence Index of the four", "Smaller third-party ecosystem"],
    useFor: "Cost-sensitive agentic tasks and tool-calling workflows.",
    forDario: "A budget option for automation/bot tooling where top reasoning isn't required.",
    sentiment: { score: 58, label: "Value pick", summary: "Liked on price and tool use; not the pick when people want the smartest answer." },
    link: "https://grok.com",
  },
  /* ── OPEN-WEIGHT ── */
  {
    id: "deepseek-v4", lab: "deepseek", name: "DeepSeek V4 Pro", tags: ["open", "coding", "reasoning"], openWeight: true,
    verdict: "watch",
    released: "2026-04-24", status: "new", tier: "Open · coding ceiling",
    bestAt: "Open-weight agentic-coding ceiling; deep math reasoning",
    index: null, indexNote: "open leader", priceIn: "0.14", priceOut: "0.28", priceNote: "V4 Flash hosted ~$0.14/$0.28 — very cheap",
    context: "1M", speed: "Hardware/host-dependent",
    strengths: ["80.6% SWE-Bench Verified — ties closed frontier (vendor)", "#1 open model on agentic GDPval", "R1 lineage near-perfect on MATH-500 (97.3%)"],
    watchouts: ["Self-host at FP16 needs 8× H100", "General-knowledge gap vs closed frontier persists"],
    useFor: "Self-hosted or cheap-hosted coding + math at near-frontier quality.",
    forDario: "If you want frontier-ish coding without per-token cost, this is the open one to test.",
    sentiment: { score: 82, label: "Open hero", summary: "Big community respect for closing the coding gap; the open model people benchmark first." },
    link: "https://huggingface.co/deepseek-ai",
  },
  {
    id: "qwen-3-6", lab: "alibaba", name: "Qwen 3.6 / 3.7 Max", tags: ["open", "reasoning"], openWeight: true,
    verdict: "watch",
    released: "2026-04-16", status: "live", tier: "Open · reasoning",
    bestAt: "Fast-moving, multilingual, cheap open family with self-hostable sizes",
    index: null, indexNote: "open leader", priceIn: "1.25", priceOut: "—", priceNote: "3.7 Max is cheapest in the top-10 by GPQA",
    context: "256K+", speed: "Varies by size",
    strengths: ["Most active open release cadence", "Apache 2.0 — enterprise-friendly", "27B / 35B-A3B checkpoints run on one GPU"],
    watchouts: ["So many variants it's easy to pick wrong", "Top sizes still need real hardware"],
    useFor: "Multilingual apps, commercial use, fine-tuning, single-GPU self-host.",
    forDario: "Best ‘safe enterprise’ open pick if a client needs on-prem or data residency.",
    sentiment: { score: 79, label: "Workhorse of open", summary: "Praised for license, multilingual range, and the sheer pace of useful releases." },
    link: "https://huggingface.co/Qwen",
  },
  {
    id: "llama-4-scout", lab: "meta", name: "Llama 4 Scout", tags: ["open"], openWeight: true,
    verdict: "ignore",
    released: "2025-04-05", status: "live", tier: "Open · long context",
    bestAt: "Extreme long-context (10M tokens) for RAG-on-everything",
    index: null, indexNote: "vendor-reported", priceIn: "0", priceOut: "0", priceNote: "free to self-host",
    context: "10M", speed: "Hardware-dependent",
    strengths: ["10M-token context — longest here", "Commercial use under Llama license", "Mature tooling + cloud availability"],
    watchouts: ["Meta paused new open-weight Llama", "License has a 700M-MAU carve-out", "Not on the neutral Intelligence Index"],
    useFor: "Stuffing huge corpora into one prompt; long-document RAG.",
    forDario: "If you ever need to reason over a whole archive at once (e.g. full council records).",
    sentiment: { score: 60, label: "Cooling", summary: "Still the long-context king, but the buzz faded as Meta pivoted to a closed line." },
    link: "https://huggingface.co/meta-llama",
  },
  {
    id: "glm-5-1", lab: "zai", name: "GLM-5.1", tags: ["open", "coding"], openWeight: true,
    verdict: "watch",
    released: "2026-05-01", status: "live", tier: "Open · agentic coding",
    bestAt: "Strongest all-around open model for long-horizon agentic engineering",
    index: null, indexNote: "open leader", priceIn: "0", priceOut: "0", priceNote: "free to self-host; hosted options exist",
    context: "Large", speed: "Hardware-dependent",
    strengths: ["~77.8% SWE-bench Verified — top open coder", "Built for multi-step agent engineering", "Available in coding tools like Kilo Code"],
    watchouts: ["Less name-recognition than DeepSeek/Qwen", "Infra on you"],
    useFor: "Open, long-running coding agents.",
    forDario: "A strong open alternative to closed coding models for agent-style build tasks.",
    sentiment: { score: 75, label: "Rising", summary: "Increasingly recommended as the open coding pick once people try it." },
    link: "https://huggingface.co/zai-org",
  },
  {
    id: "kimi-k2-6", lab: "moonshot", name: "Kimi K2.6", tags: ["open"], openWeight: true,
    verdict: "ignore",
    released: "2026-05-15", status: "live", tier: "Open · agentic",
    bestAt: "Agent swarms and long autonomous runs",
    index: null, indexNote: "tops open GPQA 90.5%", priceIn: "0", priceOut: "0", priceNote: "free to self-host; hosted options exist",
    context: "Large", speed: "Hardware-dependent",
    strengths: ["Leads open-weights on GPQA (90.5%)", "Built for many-step autonomy", "Good at orchestrating sub-agents"],
    watchouts: ["Heavy to run well", "Newer ecosystem"],
    useFor: "Open agentic systems that plan and run many steps.",
    forDario: "Interesting if you build agent workflows you'd rather self-host than rent.",
    sentiment: { score: 74, label: "Agent crowd pick", summary: "Respected among people pushing open agents to long autonomous runs." },
    link: "https://huggingface.co/moonshotai",
  },
  {
    id: "minimax-m3", lab: "minimax", name: "MiniMax M3", tags: ["open", "coding"], openWeight: true,
    verdict: "watch",
    released: "2026-06-01", status: "new", tier: "Open · efficient multimodal",
    bestAt: "First open-weight to combine frontier coding, 1M context, and multimodality",
    index: 50, indexNote: "approx (M2.7)", priceIn: "0", priceOut: "0", priceNote: "cheapest to serve — tiny active-param count",
    context: "1M", speed: "Efficient at scale",
    strengths: ["Frontier coding + 1M + multimodal in one open model", "SWE-Bench Pro ~59% (open leader)", "10B active / 230B total — cheap to serve"],
    watchouts: ["Slightly lower ceiling than Kimi/DeepSeek", "Very new"],
    useFor: "Cost-dominated workloads where you still want broad capability.",
    forDario: "The efficiency play if you ever run open models at sustained volume.",
    sentiment: { score: 73, label: "Efficiency surprise", summary: "Flagged as the cost-per-token winner among frontier-class open models." },
    link: "https://huggingface.co/MiniMaxAI",
  },
  {
    id: "phi-4", lab: "microsoft", name: "Phi-4 / Phi-4-mini", tags: ["small", "open"], openWeight: true,
    verdict: "watch",
    released: "2026-01-09", status: "live", tier: "Small / edge",
    bestAt: "Tiny distilled models that punch far above their size",
    index: null, indexNote: "small-tier", priceIn: "0", priceOut: "0", priceNote: "free; runs on 8GB",
    context: "128K", speed: "Runs locally / on-device",
    strengths: ["3.8B mini beats 2024-era flagships on reasoning/coding", "Distillation from frontier ‘teachers’", "Tiny VRAM footprint"],
    watchouts: ["Narrow knowledge vs big models", "Not for open-ended hard reasoning"],
    useFor: "On-device, offline, privacy-first, edge deployments.",
    forDario: "Candidate for anything you'd want running fully offline on local hardware.",
    sentiment: { score: 69, label: "Edge favorite", summary: "The reference point for ‘small but shockingly capable’ in the local-AI scene." },
    link: "https://huggingface.co/microsoft",
  },
  {
    id: "mistral-large-3", lab: "mistral", name: "Mistral Large 3", tags: ["balanced", "open"], openWeight: true,
    verdict: "ignore",
    released: "2026-02-01", status: "live", tier: "Balanced · European",
    bestAt: "Solid balanced model with European data-residency appeal",
    index: null, indexNote: "approx", priceIn: "—", priceOut: "—",
    context: "256K", speed: "Standard",
    strengths: ["Strong general performance", "EU-based — data-residency friendly", "Medium 3.5 covers the cheaper mid-tier"],
    watchouts: ["Not topping any single benchmark", "Smaller ecosystem than Qwen/Llama"],
    useFor: "Balanced production work, especially with EU compliance needs.",
    forDario: "Worth knowing if a client has European data-residency requirements.",
    sentiment: { score: 63, label: "Steady", summary: "Respected, reliable, rarely the headline — the dependable European option." },
    link: "https://huggingface.co/mistralai",
  },
  /* ── HORIZON ── */
  {
    id: "gemini-3-5-pro", lab: "google", name: "Gemini 3.5 Pro", tags: ["flagship", "reasoning"],
    verdict: "watch",
    released: "2026-06", status: "horizon", confidence: "expected", tier: "Flagship (upcoming)",
    bestAt: "Deferred from I/O — the deep-reasoning sibling to 3.5 Flash",
    index: null, priceIn: null, priceOut: null,
    strengths: ["Expected to reclaim Google's reasoning lead", "Builds on the 3.5 architecture"],
    watchouts: ["Not yet released — specs unconfirmed"],
    useFor: "TBD — likely the analysis/reasoning flagship.",
    sentiment: { score: 60, label: "Anticipated", summary: "Waiting on the Pro tier I/O held back; expectations high after Flash." },
    link: "https://blog.google/technology/google-deepmind/",
  },
  {
    id: "meta-muse", lab: "meta", name: "Meta ‘Muse’ (closed)", tags: ["flagship"],
    verdict: "ignore",
    released: "2026-H2", status: "horizon", confidence: "rumored", tier: "Closed frontier (rumored)",
    bestAt: "Meta's pivot toward a closed frontier line; Behemoth still training",
    index: null, priceIn: null, priceOut: null,
    strengths: ["Signals Meta going closed at the frontier", "Backed by serious compute"],
    watchouts: ["Unconfirmed name/specs", "Open-weight Llama paused in the meantime"],
    useFor: "TBD — watch for whether Meta abandons open at the top end.",
    sentiment: { score: 50, label: "Speculative", summary: "Reported pivot; nothing shipped. A storyline to watch, not use." },
    link: "https://ai.meta.com/",
  },
  {
    id: "next-claude", lab: "anthropic", name: "Next Claude (Opus 4.9 / Mythos public)", tags: ["flagship"],
    verdict: "watch",
    released: "2026-07", status: "horizon", confidence: "rumored", tier: "Flagship (estimated)",
    bestAt: "~6-week cadence points to another point release soon",
    index: null, priceIn: null, priceOut: null,
    strengths: ["Cadence-based estimate", "Possible wider Mythos-class access"],
    watchouts: ["Pure extrapolation — nothing announced"],
    useFor: "TBD.",
    sentiment: { score: 55, label: "Speculative", summary: "Based on release cadence, not an announcement. Placeholder." },
    link: "https://www.anthropic.com/news",
  },
  {
    id: "next-openai", lab: "openai", name: "Next GPT (5.6 / 6)", tags: ["flagship"],
    verdict: "watch",
    released: "2026-H2", status: "horizon", confidence: "rumored", tier: "Flagship (estimated)",
    bestAt: "No confirmed GPT-6; pace suggests another release in H2",
    index: null, priceIn: null, priceOut: null,
    strengths: ["OpenAI ships fast under competitive pressure"],
    watchouts: ["No official date or specs"],
    useFor: "TBD.",
    sentiment: { score: 52, label: "Speculative", summary: "Rumor + cadence only. ‘Code red’ dynamics keep the cycle short." },
    link: "https://openai.com/news/",
  },
];

export const STATUS_META: Record<ModelStatus, { label: string; note: string }> = {
  new:     { label: "Just shipped", note: "released in the last ~30 days" },
  live:    { label: "Live now",     note: "current, generally available" },
  horizon: { label: "On the horizon", note: "upcoming or rumored — treat as estimates" },
};

export const VERDICT_META: Record<Verdict, { label: string; color: string; note: string }> = {
  use:    { label: "use",    color: "#5EEAD4", note: "in the toolkit" },
  watch:  { label: "watch",  color: "#F0B36B", note: "interesting — not yet" },
  ignore: { label: "ignore", color: "#5C668A", note: "noise for this studio" },
};

/* ── Jobs — "what should I reach for when…" ──────────────────────────────────
   Drives the for-the-job picker. Picks are ordered: first = default choice. */

export interface Job {
  key: string;
  label: string;
  picks: string[]; // model ids, best first
}

export const JOBS: Job[] = [
  { key: "client-copy", label: "client copy & brand voice", picks: ["fable-5", "gpt-5-5"] },
  { key: "everyday",    label: "everyday drafting & code",  picks: ["sonnet-4-6"] },
  { key: "hard-build",  label: "hard builds & refactors",   picks: ["opus-4-8"] },
  { key: "bulk",        label: "bulk drafts at volume",     picks: ["gemini-3-5-flash", "haiku-4-5"] },
  { key: "analysis",    label: "research & data analysis",  picks: ["gemini-3-1-pro", "opus-4-8"] },
  { key: "self-host",   label: "self-host on leonard",      picks: ["gemma-4", "qwen-3-6"] },
  { key: "offline",     label: "fully offline / edge",      picks: ["phi-4"] },
];

/* ── Lab profiles — drives the /labs/<id> pages ──────────────────────────────
   Evergreen descriptions only; model-specific figures live on the models. */

export interface LabProfile {
  about: string;
  focus: string[];
  links: { label: string; url: string }[];
}

export const LAB_PROFILES: Record<string, LabProfile> = {
  anthropic: {
    about:
      "AI safety company founded in 2021 by former OpenAI researchers. Makes the Claude family — flagship Opus, workhorse Sonnet, fast Haiku, and now the Mythos-class creative tier — plus Claude Code for agentic development. Known for long-horizon agent reliability and being unusually candid about model limitations.",
    focus: ["Agentic coding", "Long-horizon reliability", "Safety research"],
    links: [
      { label: "anthropic.com", url: "https://www.anthropic.com" },
      { label: "News", url: "https://www.anthropic.com/news" },
      { label: "Claude app", url: "https://claude.ai" },
    ],
  },
  openai: {
    about:
      "Maker of ChatGPT and the GPT line. Ships the broadest consumer + developer surface in AI: the GPT flagships, the Codex coding environment, and (since gpt-oss) occasional open-weight releases. Tends to lead on creative writing, terminal automation, and computer use.",
    focus: ["Creative writing", "Terminal & computer use", "Consumer scale"],
    links: [
      { label: "openai.com", url: "https://openai.com" },
      { label: "News", url: "https://openai.com/news/" },
      { label: "Hugging Face", url: "https://huggingface.co/openai" },
    ],
  },
  google: {
    about:
      "Google DeepMind builds the Gemini line (deep multimodal reasoning, long context) and the open-weight Gemma family. Distribution is the superpower: Gemini ships inside Search, Android, and Workspace, and the Flash tier is usually the price/speed benchmark everyone else is measured against.",
    focus: ["Multimodal reasoning", "Price/speed (Flash)", "Open small models (Gemma)"],
    links: [
      { label: "gemini.google.com", url: "https://gemini.google.com" },
      { label: "DeepMind blog", url: "https://blog.google/technology/google-deepmind/" },
      { label: "Hugging Face", url: "https://huggingface.co/google" },
    ],
  },
  xai: {
    about:
      "Elon Musk's AI lab, tightly integrated with X. Grok models emphasize real-time information, tool use, and aggressive pricing relative to the other closed flagships. Trains on the Colossus supercluster.",
    focus: ["Real-time data", "Tool use", "Price competition"],
    links: [
      { label: "x.ai", url: "https://x.ai" },
      { label: "Grok", url: "https://grok.com" },
    ],
  },
  meta: {
    about:
      "Meta AI built the Llama family that kick-started the open-weight ecosystem, including the extreme-long-context Llama 4 Scout. Currently the storyline to watch: new open-weight releases are paused while the frontier effort reportedly moves behind closed doors.",
    focus: ["Open-weight legacy (Llama)", "Long context", "Closed-frontier pivot"],
    links: [
      { label: "ai.meta.com", url: "https://ai.meta.com" },
      { label: "Hugging Face", url: "https://huggingface.co/meta-llama" },
    ],
  },
  deepseek: {
    about:
      "Hangzhou lab famous for training near-frontier models at a fraction of typical cost, then releasing the weights. V3/R1 reset expectations for open models on reasoning and math; the V4 line pushes the open agentic-coding ceiling.",
    focus: ["Training efficiency", "Open reasoning & math", "Agentic coding"],
    links: [
      { label: "deepseek.com", url: "https://www.deepseek.com" },
      { label: "Hugging Face", url: "https://huggingface.co/deepseek-ai" },
    ],
  },
  alibaba: {
    about:
      "Alibaba's Qwen team runs the most active open release cadence in the industry — full families from sub-1B edge models to frontier-scale MoE, Apache 2.0 licensed and strongly multilingual. The default 'safe enterprise' open pick.",
    focus: ["Release cadence", "Apache 2.0 licensing", "Multilingual"],
    links: [
      { label: "qwen.ai", url: "https://qwen.ai" },
      { label: "Hugging Face", url: "https://huggingface.co/Qwen" },
    ],
  },
  zai: {
    about:
      "Z.ai (formerly Zhipu AI) builds the GLM line, increasingly focused on long-horizon agentic engineering. GLM models keep showing up as the open coding pick in agent tools once people benchmark them.",
    focus: ["Agentic engineering", "Open coding"],
    links: [
      { label: "z.ai", url: "https://z.ai" },
      { label: "Hugging Face", url: "https://huggingface.co/zai-org" },
    ],
  },
  moonshot: {
    about:
      "Moonshot AI makes the Kimi models — trillion-parameter open MoE built for long autonomous runs and agent swarms. Strong on open-model knowledge benchmarks; heavy to self-host well.",
    focus: ["Agent autonomy", "Trillion-param MoE"],
    links: [
      { label: "moonshot.ai", url: "https://www.moonshot.ai" },
      { label: "Hugging Face", url: "https://huggingface.co/moonshotai" },
    ],
  },
  minimax: {
    about:
      "Shanghai lab specializing in efficient MoE architectures — small active-parameter counts that make frontier-ish capability cheap to serve. The M-series pairs coding strength with multimodality and 1M context.",
    focus: ["Serving efficiency", "Multimodal MoE"],
    links: [
      { label: "minimax.io", url: "https://www.minimax.io" },
      { label: "Hugging Face", url: "https://huggingface.co/MiniMaxAI" },
    ],
  },
  microsoft: {
    about:
      "Microsoft Research's Phi line proves how far distillation can shrink capability: tiny open models that run on laptops and phones yet punch far above their size. The reference point for on-device and privacy-first deployments.",
    focus: ["Small models", "Distillation", "On-device"],
    links: [
      { label: "microsoft.com/ai", url: "https://www.microsoft.com/ai" },
      { label: "Hugging Face", url: "https://huggingface.co/microsoft" },
    ],
  },
  mistral: {
    about:
      "French lab mixing open releases with commercial flagships. Rarely tops a single benchmark but consistently solid, and the go-to answer when a client needs European data residency.",
    focus: ["EU data residency", "Open + commercial mix"],
    links: [
      { label: "mistral.ai", url: "https://mistral.ai" },
      { label: "Hugging Face", url: "https://huggingface.co/mistralai" },
    ],
  },
};

/* Robust price parser: handles "5", "~3", "1.50", "0"; returns null for
   "low", "—", null. Used by the cheapest sort and the map view. */
export function priceNum(p: string | null | undefined): number | null {
  if (!p) return null;
  const n = parseFloat(p.replace(/[~$\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/* Parses the loose released formats ("2026-06-09", "2026-04", "2026-H2")
   into an approximate Date for timeline positioning. */
export function releasedDate(s: string): Date | null {
  if (!s) return null;
  const half = s.match(/^(\d{4})-H([12])$/i);
  if (half) return new Date(Number(half[1]), half[2] === "1" ? 3 : 9, 1);
  const parts = s.split("-").map(Number);
  if (!parts[0]) return null;
  if (parts.length === 1) return new Date(parts[0], 6, 1);
  if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 15);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
