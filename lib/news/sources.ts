/* Lab News sources. Official RSS first; Google News search as a clearly
   labelled fallback; a static link list as the render-always fallback when
   nothing is reachable. No keys, all best-effort. */

export interface LabNewsSource {
  lab: string; // catalog lab key
  labName: string;
  official?: { name: string; rss: string };
  newsPage: string; // official news page, used by the static fallback
  query: string; // Google News fallback query
}

export const NEWS_SOURCES: LabNewsSource[] = [
  {
    lab: "openai", labName: "OpenAI",
    official: { name: "OpenAI News", rss: "https://openai.com/news/rss.xml" },
    newsPage: "https://openai.com/news/",
    query: "OpenAI model announcement",
  },
  {
    lab: "anthropic", labName: "Anthropic",
    newsPage: "https://www.anthropic.com/news",
    query: "Anthropic Claude announcement",
  },
  {
    lab: "google", labName: "Google DeepMind",
    official: { name: "DeepMind Blog", rss: "https://deepmind.google/blog/rss.xml" },
    newsPage: "https://deepmind.google/discover/blog/",
    query: "Google DeepMind Gemini announcement",
  },
  {
    lab: "meta", labName: "Meta AI",
    official: { name: "Meta AI Blog", rss: "https://ai.meta.com/blog/rss/" },
    newsPage: "https://ai.meta.com/blog/",
    query: "Meta AI Llama announcement",
  },
  {
    lab: "mistral", labName: "Mistral",
    newsPage: "https://mistral.ai/news",
    query: "Mistral AI model announcement",
  },
  {
    lab: "deepseek", labName: "DeepSeek",
    newsPage: "https://www.deepseek.com",
    query: "DeepSeek model release",
  },
  {
    lab: "alibaba", labName: "Qwen",
    newsPage: "https://qwen.ai",
    query: "Qwen Alibaba model release",
  },
  {
    lab: "xai", labName: "xAI",
    newsPage: "https://x.ai/news",
    query: "xAI Grok announcement",
  },
  {
    lab: "zai", labName: "Z.ai",
    newsPage: "https://z.ai",
    query: "Z.ai GLM model release",
  },
  {
    lab: "moonshot", labName: "Moonshot",
    newsPage: "https://www.moonshot.ai",
    query: "Moonshot Kimi model release",
  },
  {
    lab: "microsoft", labName: "Microsoft",
    official: { name: "Microsoft AI Blog", rss: "https://blogs.microsoft.com/ai/feed/" },
    newsPage: "https://blogs.microsoft.com/ai/",
    query: "Microsoft AI Phi model",
  },
];
