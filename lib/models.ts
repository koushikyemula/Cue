import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { customProvider } from "ai";

export type Model =
  | "claude-3.7-sonnet"
  | "grok-3"
  | "deepseek-r1"
  | "llama-4-scout"
  | "llama-4-maverick"
  | "llama-3.3"
  | "qwen-qwq"
  | "qwen-2.5";

export const llm = customProvider({
  languageModels: {
    "claude-3.7-sonnet": anthropic("claude-3-7-sonnet-20250219"),
    "grok-3": xai("grok-3-fast-beta"),
    "deepseek-r1": groq("deepseek-r1-distill-llama-70b"),
    "llama-4-scout": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "llama-4-maverick": groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
    "llama-3.3": groq("llama-3.3-70b-versatile"),
    "qwen-qwq": groq("qwen-qwq-32b"),
    "qwen-2.5": groq("qwen-2.5-32b"),
  },
});

export const modelOptions: { id: Model; name: string }[] = [
  { id: "claude-3.7-sonnet", name: "Claude 3.7 Sonnet" },
  { id: "grok-3", name: "Grok 3" },
  { id: "deepseek-r1", name: "DeepSeek R1 70B" },
  { id: "llama-4-scout", name: "Llama 4 Scout" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick" },
  { id: "llama-3.3", name: "Llama 3.3 70B" },
  { id: "qwen-qwq", name: "Qwen QWQ 32B" },
  { id: "qwen-2.5", name: "Qwen 2.5 32B" },
];
