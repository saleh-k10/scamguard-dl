import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ header: vi.fn(), setHeader: vi.fn(), deleteOwn: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  inputValidator: (validate: (input: unknown) => unknown) => ({
    handler: (handler: () => unknown) => async ({ data }: { data: unknown }) => { validate(data); return handler(); },
  }),
}) }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: mocks.header, setResponseHeader: mocks.setHeader }));
vi.mock("@/lib/account.server", () => ({ deleteOwnAccount: mocks.deleteOwn }));
import { deleteAccount } from "@/lib/account.functions";

describe("Delete-account RPC boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.header.mockReturnValue("Bearer session-token"); mocks.deleteOwn.mockResolvedValue({ success: true }); });
  it("uses only the Authorization header and prevents caching", async () => {
    expect(await deleteAccount({ data: { confirmation: "DELETE" } })).toEqual({ success: true });
    expect(mocks.header).toHaveBeenCalledWith("authorization");
    expect(mocks.deleteOwn).toHaveBeenCalledWith("Bearer session-token");
    expect(mocks.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });
  it.each([{ confirmation: "delete" }, {}, { confirmation: "DELETE", userId: "someone-else" }, { confirmation: "DELETE", email: "someone@example.org" }])("rejects invalid confirmation or a caller-selected target", async (data) => {
    // Deliberately malformed wire payload, not the typed client contract.
    const call = deleteAccount as unknown as (args: { data: unknown }) => Promise<unknown>;
    await expect(call({ data })).rejects.toThrow();
    expect(mocks.deleteOwn).not.toHaveBeenCalled();
  });
});