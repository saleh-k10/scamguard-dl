import { z } from "zod";
import { analyze, levelOf, type Channel, type Result } from "@/lib/analyzer";
import { redactSensitiveText } from "@/lib/sensitive-text";

// Strict object roots and required fields; size/range limits are applied after parsing.
export const aiAnalysisSchema = z.object({
  risk_score: z.number(),
  risk_level: z.enum(["low", "medium", "high"]),
  red_flags: z.array(z.object({
    title: z.string(), why: z.string(), weight: z.number(),
    technique: z.string(), technique_explanation: z.string(),
  })),
  recommended_actions: z.array(z.string()),
  teach_me_why: z.string(),
  quiz: z.object({ question: z.string(), options: z.array(z.string()), correct_answer: z.number(), explanation: z.string() }),
});

const clean = (value: string, limit: number) => {
  const text = redactSensitiveText(value).text.trim();
  if (!text) throw new Error("Empty analysis field");
  if (/\b(?:this (?:message|email|sms|sender|link|website) (?:is|looks|appears) (?:completely |definitely |certainly )?(?:safe|legitimate|authentic|verified)|(?:definitely|certainly|guaranteed|100%)\s+(?:a\s+)?(?:scam|fraud|safe))\b/i.test(text)) {
    throw new Error("Non-advisory claim in analysis");
  }
  // Replace common categorical claims even if the model ignores advisory instructions.
  return text.replace(/\b(definitely|certainly|guaranteed|100%|completely safe|definitely safe)\b/gi, "potentially").slice(0, limit);
};

export function normalizeAIAnalysis(value: unknown, message: string, channel: Channel): Result {
  const data = aiAnalysisSchema.parse(value);
  if (!Number.isFinite(data.risk_score)) throw new Error("Invalid score");
  const score = Math.max(0, Math.min(100, Math.round(data.risk_score)));
  const options = data.quiz.options.map((option) => clean(option, 180));
  if (options.length < 2 || options.length > 5 || new Set(options).size !== options.length ||
      !Number.isInteger(data.quiz.correct_answer) || data.quiz.correct_answer < 0 || data.quiz.correct_answer >= options.length) {
    throw new Error("Invalid quiz answer/options");
  }
  const actions = data.recommended_actions.slice(0, 5).map((action) => clean(action, 320));
  if (!actions.length) throw new Error("Missing recommended actions");
  const safe = redactSensitiveText(message).text;
  return {
    id: crypto.randomUUID(), channel, message: safe,
    score, level: levelOf(score), // Keep score/label thresholds consistent with historical results.
    signs: data.red_flags.slice(0, 6).map((flag, index) => {
      if (!Number.isFinite(flag.weight)) throw new Error("Invalid flag weight");
      return {
        id: `ai-${index}`, title: clean(flag.title, 100), why: clean(flag.why, 500),
        weight: Math.max(0, Math.min(30, Math.round(flag.weight))),
        technique: clean(flag.technique, 100), techniqueText: clean(flag.technique_explanation, 500),
      };
    }),
    actions: [...actions, "Advisory only: independently verify through an official website or phone number you find yourself."],
    quiz: {
      question: clean(data.quiz.question, 280), options, answer: data.quiz.correct_answer,
      explain: clean(data.quiz.explanation, 500),
      meta: { source: "ai", education: clean(data.teach_me_why, 700) },
    },
    createdAt: new Date().toISOString(),
  };
}

export function ruleFallback(message: string, channel: Channel, reason: string): Result {
  const result = analyze(redactSensitiveText(message).text, channel);
  result.quiz.meta = {
    source: "rules", fallback: reason.slice(0, 400),
    education: "This is a basic pattern check, not AI analysis. Warning signs are clues, not proof; independently verify the sender before acting.",
  };
  return result;
}