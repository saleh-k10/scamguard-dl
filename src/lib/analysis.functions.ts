import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { MAX_MESSAGE_LENGTH } from "@/lib/sensitive-text";

// Deliberately public: signed-out visitors may scan, but never write history here.
export const analyzeWithAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    message: z.string().trim().min(10).max(MAX_MESSAGE_LENGTH),
    channel: z.enum(["email", "sms", "other"]),
  }).parse(input))
  .handler(async ({ data }) => {
    const { runAIAnalysis } = await import("./ai/analysis.server");
    const apiKey = process.env['LOVABLE_API_KEY'];
    return runAIAnalysis(getRequest(), data.message, data.channel, apiKey);
  });