import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), remove: vi.fn(), eq: vi.fn(), deleteUser: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { getUser: mocks.getUser, admin: { deleteUser: mocks.deleteUser } }, from: mocks.from,
} }));
import { deleteOwnAccount } from "@/lib/account.server";

describe("Self-service account deletion authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ delete: mocks.remove });
    mocks.remove.mockReturnValue({ eq: mocks.eq });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
    mocks.eq.mockResolvedValue({ error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
  });
  it.each([undefined, "", "Basic invalid", "Bearer ", "Bearer token extra"])("rejects missing or malformed authorization %s before any privileged operation", async (header) => {
    expect((await deleteOwnAccount(header)).success).toBe(false);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it.each([
    { data: { user: null }, error: null },
    { data: { user: { id: "forged-owner" } }, error: { message: "invalid token" } },
  ])("does not delete anything when Auth rejects the token", async (response) => {
    mocks.getUser.mockResolvedValue(response);
    expect((await deleteOwnAccount("Bearer invalid-token")).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("revalidates the exact bearer token and deletes only the verified user's rows then account", async () => {
    expect(await deleteOwnAccount("Bearer current-session-token")).toEqual({ success: true });
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith("current-session-token");
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("scans");
    expect(mocks.eq).toHaveBeenCalledExactlyOnceWith("user_id", "verified-owner");
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith("verified-owner");
    expect(mocks.eq.mock.invocationCallOrder[0]).toBeLessThan(mocks.deleteUser.mock.invocationCallOrder[0] ?? 0);
  });
  it("keeps the auth account when scan cleanup fails and hides internal errors", async () => {
    mocks.eq.mockResolvedValue({ error: { message: "private database diagnostic" } });
    const result = await deleteOwnAccount("Bearer current-session-token");
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("account has not been deleted") });
    expect(JSON.stringify(result)).not.toContain("private database diagnostic");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("clearly reports partial completion when auth deletion fails", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { message: "private auth diagnostic" } });
    expect(await deleteOwnAccount("Bearer current-session-token")).toMatchObject({ success: false, error: expect.stringContaining("scan history was removed") });
  });
  it("safely handles network errors during validation", async () => {
    mocks.getUser.mockRejectedValue(new Error("private transport error"));
    const result = await deleteOwnAccount("Bearer current-session-token");
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private transport error");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("reports uncertainty without hiding removed scans if the final request throws", async () => {
    mocks.deleteUser.mockRejectedValue(new Error("private transport error"));
    expect(await deleteOwnAccount("Bearer current-session-token")).toMatchObject({ success: false, error: expect.stringContaining("deletion could not be confirmed") });
  });
});