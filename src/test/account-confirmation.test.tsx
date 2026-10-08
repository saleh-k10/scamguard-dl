import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
afterEach(cleanup);

describe("Account deletion confirmation", () => {
  it("requires opening a dialog and typing exact DELETE; cancellation resets confirmation", () => {
    const remove = vi.fn();
    render(<DeleteAccountDialog onDelete={remove} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    const final = screen.getByRole("button", { name: "Permanently delete account" });
    expect(final).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "delete" } });
    expect(final).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    expect(final).toBeEnabled();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.getByRole("button", { name: "Permanently delete account" })).toBeDisabled();
    expect(remove).not.toHaveBeenCalled();
  });
  it("prevents repeated requests or dismissal while deleting and displays safe errors", async () => {
    let finish: ((result: { success: false; error: string }) => void) | undefined;
    const remove = vi.fn(() => new Promise<{ success: false; error: string }>((resolve) => { finish = resolve; }));
    render(<DeleteAccountDialog onDelete={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete account" }));
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(remove).toHaveBeenCalledTimes(1);
    await act(async () => { finish?.({ success: false, error: "Your account has not been deleted. Please try again." }); });
    expect(screen.getByRole("alert")).toHaveTextContent("Your account has not been deleted.");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
  it("shows a connection error without exposing internals", async () => {
    render(<DeleteAccountDialog onDelete={() => Promise.reject(new Error("private transport detail"))} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Permanently delete account" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Check your connection");
    expect(screen.queryByText("private transport detail")).not.toBeInTheDocument();
  });
});