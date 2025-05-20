import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    OPENAI_API_KEY: z.string().startsWith("sk-proj-", {
      message:
        "OPENAI_API_KEY must be a valid OpenAI API key starting with 'sk-proj-'",
    }),
    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-", {
      message:
        "ANTHROPIC_API_KEY must be a valid Anthropic API key starting with 'sk-ant-'",
    }),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  },
  experimental__runtimeEnv: process.env,
});
