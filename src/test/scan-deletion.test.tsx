import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteMyScan } from "@/lib/scans";
import { DeleteScanDialog } from "@/components/DeleteScanDialog";
const mocks = vi.hoisted(() => ({ user: vi.fn(), from: vi.fn(), remove: vi.fn(), eq: vi.fn(), select: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.user }, from: mocks.from } }));
const id = "12345678-1234-4234-8234-123456789abc";
beforeEach(() => {
  vi.clearAllMocks(); mocks.user.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
  mocks.from.mockReturnValue({ delete: mocks.remove }); mocks.remove.mockReturnValue({ eq: mocks.eq }); mocks.eq.mockReturnValue({ select: mocks.select });
  mocks.select.mockResolvedValue({ data: [{ id }], error: null });
});
afterEach(cleanup);
describe("Scan deletion client/RLS boundary", () => {
  it("validates scan IDs before any request", async () => { await expect(deleteMyScan("invalid")).rejects.toThrow(); expect(mocks.user).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled(); });
  it("blocks signed-out requests", async () => { mocks.user.mockResolvedValue({ data: { user: null }, error: null }); await expect(deleteMyScan(id)).rejects.toThrow(); expect(mocks.from).not.toHaveBeenCalled(); });
  it("uses only the existing authenticated client and scan ID, never a caller-selected owner", async () => {
    await deleteMyScan(id);
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("scans"); expect(mocks.remove).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.eq).toHaveBeenCalledExactlyOnceWith("id", id); expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id");
  });
  it("does not claim success when RLS hides another owner's scan or a scan is missing", async () => { mocks.select.mockResolvedValue({ data: [], error: null }); await expect(deleteMyScan(id)).rejects.toThrow("could not be confirmed"); });
  it("hides database errors", async () => { mocks.select.mockResolvedValue({ data: null, error: { message: "private db info" } }); await expect(deleteMyScan(id)).rejects.toThrow("Scan deletion could not be confirmed."); });
});
describe("Scan deletion confirmation", () => {
  it("requires confirmation and cancellation deletes nothing", () => {
    const remove = vi.fn(); render(<DeleteScanDialog onDelete={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete saved scan" }));
    expect(screen.getByRole("dialog")).toBeVisible(); expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(remove).not.toHaveBeenCalled();
  });
  it("waits for confirmed success and blocks repeat clicks or dismissal", async () => {
    let finish: (() => void) | undefined;
    const remove = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<DeleteScanDialog onDelete={remove} />); fireEvent.click(screen.getByRole("button", { name: "Delete saved scan" })); fireEvent.click(screen.getByRole("button", { name: "Delete scan" }));
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Close" })); expect(screen.getByRole("dialog")).toBeVisible(); expect(remove).toHaveBeenCalledTimes(1);
    await act(async () => { finish?.(); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps the dialog open on errors without exposing internals", async () => {
    render(<DeleteScanDialog onDelete={() => Promise.reject(new Error("private db error"))} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete saved scan" })); await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Delete scan" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("couldn't confirm deletion"); expect(screen.queryByText("private db error")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Delete scan" })).toBeEnabled();
  });
});