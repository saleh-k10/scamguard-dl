import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginPasswordRecovery, clearPasswordRecovery } from "@/lib/password-recovery";
const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn(), exchange: vi.fn(), events: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.session, getUser: mocks.user, exchangeCodeForSession: mocks.exchange, onAuthStateChange: mocks.events } } }));
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); window.history.replaceState({}, "", "/reset-password");
  mocks.events.mockReturnValue({ data: { subscription: { unsubscribe: mocks.unsubscribe } } });
  mocks.session.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null });
  mocks.user.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
});
afterEach(() => { sessionStorage.clear(); window.history.replaceState({}, "", "/"); });
async function check() { const run = beginPasswordRecovery(); try { await run.promise; } finally { run.cancel(); } }
describe("Recovery provenance", () => {
  it("rejects an ordinary signed-in session without a recovery link", async () => {
    await expect(check()).rejects.toThrow(); expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("accepts implicit recovery links, allows same-tab reload, then clears recovery", async () => {
    window.history.replaceState({}, "", "/reset-password#type=recovery&access_token=synthetic-test-token&refresh_token=synthetic-test-refresh");
    await expect(check()).resolves.toBeUndefined();
    window.history.replaceState({}, "", "/reset-password");
    await expect(check()).resolves.toBeUndefined();
    clearPasswordRecovery(); await expect(check()).rejects.toThrow();
  });
  it("exchanges a PKCE code only when its redirect type proves recovery", async () => {
    window.history.replaceState({}, "", "/reset-password?code=synthetic-code");
    mocks.exchange.mockResolvedValue({ data: { session: {}, redirectType: "recovery" }, error: null });
    await expect(check()).resolves.toBeUndefined();
    expect(mocks.exchange).toHaveBeenCalledWith("synthetic-code");
    clearPasswordRecovery(); mocks.exchange.mockResolvedValue({ data: { session: {}, redirectType: null }, error: null });
    await expect(check()).rejects.toThrow();
  });
  it("uses the PASSWORD_RECOVERY event if Auth already exchanged the code", async () => {
    window.history.replaceState({}, "", "/reset-password?code=synthetic-code");
    mocks.session.mockImplementation(async () => { mocks.events.mock.calls[0]?.[0]("PASSWORD_RECOVERY"); return { data: { session: {} }, error: null }; });
    await expect(check()).resolves.toBeUndefined(); expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("rejects link errors before querying or exchanging credentials", async () => {
    window.history.replaceState({}, "", "/reset-password#error=access_denied&error_description=Expired");
    await expect(check()).rejects.toThrow(); expect(mocks.session).not.toHaveBeenCalled(); expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("rejects expired or another user's reload marker", async () => {
    sessionStorage.setItem("scamguard-password-recovery", JSON.stringify({ userId: "owner", at: Date.now() - 16 * 60_000 }));
    await expect(check()).rejects.toThrow();
    sessionStorage.setItem("scamguard-password-recovery", JSON.stringify({ userId: "someone-else", at: Date.now() }));
    await expect(check()).rejects.toThrow();
  });
});