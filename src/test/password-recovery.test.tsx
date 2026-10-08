import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordRecovery } from "@/components/PasswordRecovery";

const mocks = vi.hoisted(() => ({ request: vi.fn(), update: vi.fn(), signOut: vi.fn(), begin: vi.fn(), clear: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { resetPasswordForEmail: mocks.request, updateUser: mocks.update, signOut: mocks.signOut } } }));
vi.mock("@/lib/password-recovery", async (original) => ({ ...await original<typeof import("@/lib/password-recovery")>(), beginPasswordRecovery: mocks.begin, clearPasswordRecovery: mocks.clear }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ to, children, ...props }: React.PropsWithChildren<{ to: string }>) => <a href={to} {...props}>{children}</a> }));
beforeEach(() => { vi.clearAllMocks(); mocks.begin.mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() }); mocks.signOut.mockResolvedValue({ error: null }); });
afterEach(cleanup);
const fillPasswords = (password: string, confirmation: string) => {
  fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: confirmation } });
};

describe("Password recovery forms", () => {
  it("blocks empty and invalid emails", () => {
    render(<PasswordRecovery mode="request" />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(screen.getByText("Email is required.")).toBeVisible();
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("uses the published reset URL and shows non-enumerating success with cooldown", async () => {
    mocks.request.mockResolvedValue({ error: null });
    render(<PasswordRecovery mode="request" />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "student@example.org" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Send reset link" })); });
    expect(mocks.request).toHaveBeenCalledExactlyOnceWith("student@example.org", { redirectTo: "https://scamguard-dl.lovable.app/reset-password" });
    expect(screen.getByRole("status")).toHaveTextContent("If an account exists");
    expect(screen.getByRole("button", { name: "Request again in 60s" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });
  it.each([429, 500])("handles request error %s without revealing internal details", async (status) => {
    mocks.request.mockResolvedValue({ error: { status, message: "private provider detail" } });
    render(<PasswordRecovery mode="request" />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "student@example.org" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Send reset link" })); });
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByText("private provider detail")).not.toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects short passwords and mismatches without updating", async () => {
    await act(async () => { render(<PasswordRecovery mode="reset" />); });
    fillPasswords("short", "other");
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByText("Use at least 8 characters.")).toBeVisible();
    expect(screen.getByText("Passwords don't match.")).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("updates only after validation, ends the local session, and offers login", async () => {
    mocks.update.mockResolvedValue({ error: null });
    await act(async () => { render(<PasswordRecovery mode="reset" />); });
    fillPasswords("test-new-password", "test-new-password");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Update password" })); });
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ password: "test-new-password" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.clear).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Password updated" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });
  it("shows safe password update errors and retains the form", async () => {
    mocks.update.mockResolvedValue({ error: { message: "private error" } });
    await act(async () => { render(<PasswordRecovery mode="reset" />); });
    fillPasswords("test-new-password", "test-new-password");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Update password" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("request a fresh reset link");
    expect(screen.queryByText("private error")).not.toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("handles invalid or expired links without exposing the password form", async () => {
    mocks.begin.mockReturnValue({ promise: Promise.reject(new Error("private token")), cancel: vi.fn() });
    await act(async () => { render(<PasswordRecovery mode="reset" />); });
    expect(screen.getByRole("heading", { name: "Reset link unavailable" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});