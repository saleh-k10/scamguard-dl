import { describe, expect, it } from "vitest";
import { normalizeAIAnalysis, ruleFallback } from "@/lib/ai-analysis";
import { redactSensitiveText } from "@/lib/sensitive-text";
import { makePreview } from "@/lib/scans";

const valid = {
  risk_score: 82.4, risk_level: "low",
  red_flags: [{ title: "Pressure", why: "A short deadline discourages verification.", weight: 99, technique: "Urgency", technique_explanation: "Pressure can interfere with judgement." }],
  recommended_actions: ["Contact the bank using its official website."],
  teach_me_why: "An unexpected deadline is a warning sign, not proof of fraud.",
  quiz: { question: "What should you do?", options: ["Verify independently", "Share a password", "Pay immediately"], correct_answer: 0, explanation: "Use official contact details." },
};

describe("AI structured analysis", () => {
  it("maps the contract to the existing UI and normalizes score/weight/level", () => {
    const result = normalizeAIAnalysis(valid, "An unexpected bank warning", "sms");
    expect(result.score).toBe(82);
    expect(result.level).toBe("high");
    expect(result.signs[0]?.weight).toBe(30);
    expect(result.quiz.answer).toBe(0);
    expect(result.quiz.meta?.source).toBe("ai");
    expect(result.actions.at(-1)).toContain("independently verify");
  });
  it("rejects malformed structure, empty fields and unusable quizzes", () => {
    expect(() => normalizeAIAnalysis({}, "message", "email")).toThrow();
    expect(() => normalizeAIAnalysis({ ...valid, quiz: { ...valid.quiz, correct_answer: 6 } }, "message", "email")).toThrow();
    expect(() => normalizeAIAnalysis({ ...valid, recommended_actions: [] }, "message", "email")).toThrow();
    expect(() => normalizeAIAnalysis({ ...valid, quiz: { ...valid.quiz, options: ["same", "same"] } }, "message", "email")).toThrow();
  });
  it("clamps out-of-range scores without breaking the visual scale", () => {
    expect(normalizeAIAnalysis({ ...valid, risk_score: 150 }, "message", "email").score).toBe(100);
    expect(normalizeAIAnalysis({ ...valid, risk_score: -10 }, "message", "email").level).toBe("low");
  });
  it("rejects categorical safety or fraud claims", () => {
    expect(() => normalizeAIAnalysis({ ...valid, teach_me_why: "This message is safe." }, "message", "email")).toThrow();
    expect(() => normalizeAIAnalysis({ ...valid, teach_me_why: "This is definitely a scam." }, "message", "email")).toThrow();
  });
  it("preserves a marked, usable rule-based fallback and safe preview", () => {
    const result = ruleFallback("URGENT account suspended. password: SecretPass123! Visit bit.ly/test", "email", "AI timed out.");
    expect(result.quiz.meta).toMatchObject({ source: "rules", fallback: "AI timed out." });
    expect(result.message).not.toContain("SecretPass123");
    expect(result.signs.length).toBeGreaterThan(0);
    expect(result.quiz.options[result.quiz.answer]).toBeDefined();
    expect(makePreview(result.message.repeat(5)).length).toBeLessThanOrEqual(120);
  });
});

describe("Sensitive text redaction", () => {
  it("removes explicit passwords, OTPs, card numbers, tokens and private keys", () => {
    const input = 'password: SuperSecret123! OTP is 123456 card 4111 1111 1111 1111 sk-abcdefghijklmnopqrstuv -----BEGIN PRIVATE KEY-----secret-material-----END PRIVATE KEY-----';
    const result = redactSensitiveText(input);
    expect(result.detected).toBe(true);
    for (const secret of ['SuperSecret123!', '123456', '4111', 'abcdefghijklmnopqrstuv', 'secret-material']) expect(result.text).not.toContain(secret);
  });
  it("keeps scam warning context and redacts URL tokens", () => {
    expect(redactSensitiveText('Verify your account at https://example.org/login?token=privatevalue').text).toBe('Verify your account at https://example.org/login?token=[REDACTED]');
    expect(redactSensitiveText('URGENT: your account is frozen. Visit bit.ly/test').detected).toBe(false);
  });
});