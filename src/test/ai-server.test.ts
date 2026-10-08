import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  call: vi.fn(), maybeSingle: vi.fn(), upsert: vi.fn(),
}));
vi.mock("@/lib/ai/responses.server.ts", () => ({ createResponsesCall: mocks.call }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }), upsert: mocks.upsert }) },
}));
import { APICallError } from "ai";
import { runAIAnalysis } from "@/lib/ai/analysis.server";

describe("AI server fallback and availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.upsert.mockResolvedValue({ error: null });
  });
  it("uses rules without requesting AI when configuration is absent", async () => {
    const result = await runAIAnalysis(new Request("https://example.org"), "Urgent account warning", "sms");
    expect(result.quiz.meta?.source).toBe("rules");
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it("does not call AI while a durable pause is active", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { paused: true, reason: "AI credits need attention." }, error: null });
    const result = await runAIAnalysis(new Request("https://example.org"), "Urgent account warning", "email", "test-only-key");
    expect(result.quiz.meta?.fallback).toBe("AI credits need attention.");
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it("falls back on invalid structured output", async () => {
    mocks.call.mockReturnValue({ result: { output: Promise.resolve({ invalid: true }) } });
    const result = await runAIAnalysis(new Request("https://example.org"), "Urgent account warning", "email", "test-only-key");
    expect(result.quiz.meta?.source).toBe("rules");
    expect(mocks.call).toHaveBeenCalledTimes(1);
  });
  it("surfaces credit errors, persists a pause and never retries", async () => {
    mocks.call.mockImplementation(() => { throw new APICallError({
      message: "No credits", url: "https://example.org", requestBodyValues: {}, statusCode: 402,
      responseBody: JSON.stringify({ message: "Add AI credits to continue." }), isRetryable: false,
    }); });
    const result = await runAIAnalysis(new Request("https://example.org"), "Urgent account warning", "email", "test-only-key");
    expect(result.quiz.meta?.fallback).toContain("Add AI credits to continue.");
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ paused: true, status: 402 }));
    expect(mocks.call).toHaveBeenCalledTimes(1);
  });
  it("reports upstream timeouts without automatic retries or a permanent pause", async () => {
    mocks.call.mockImplementation(() => { throw new APICallError({
      message: "Timeout", url: "https://example.org", requestBodyValues: {}, statusCode: 504, isRetryable: true,
    }); });
    const result = await runAIAnalysis(new Request("https://example.org"), "Urgent account warning", "email", "test-only-key");
    expect(result.quiz.meta?.fallback).toContain("timed out");
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.call).toHaveBeenCalledTimes(1);
  });
});