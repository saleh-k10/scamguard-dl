import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "@/components/AuthCard";
import { EmailVerification } from "@/components/EmailVerification";

const mocks = vi.hoisted(() => ({ signup: vi.fn(), resend: vi.fn(), login: vi.fn(), navigate: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: mocks.signup, resend: mocks.resend, signInWithPassword: mocks.login } } }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...props }: React.PropsWithChildren<{ to: string }>) => <a href={to} {...props}>{children}</a>,
}));

const email = "student@example.org";
const redirectTo = "https://scamguard-dl.lovable.app/auth/callback";
async function advanceCooldown() { await act(async () => { vi.advanceTimersByTime(60_000); }); }

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Signup verification", () => {
  it("blocks invalid fields without creating an account", () => {
    render(<AuthCard mode="signup" />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Full name is required.")).toBeVisible();
    expect(screen.getByText("Email is required.")).toBeVisible();
    expect(screen.getByText("Password is required.")).toBeVisible();
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(screen.getByText("Password must be at least 6 characters.")).toBeVisible();
    expect(mocks.signup).not.toHaveBeenCalled();
  });

  it("preserves metadata and callback, shows verification only after success", async () => {
    mocks.signup.mockResolvedValue({ data: { session: null }, error: null });
    render(<AuthCard mode="signup" />);
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: " Student Name " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Create account" })); });
    expect(mocks.signup).toHaveBeenCalledWith(expect.objectContaining({ email, options: { emailRedirectTo: redirectTo, data: { name: "Student Name", full_name: "Student Name" } } }));
    expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    expect(screen.getByText("You can open the confirmation link on any device. If you confirm on another device, return here and log in with your email and password.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Already confirmed? Log in" })).toHaveAttribute("href", "/login");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("resends signup confirmation with sending, success and cooldown states", async () => {
    let complete: ((value: { error: null }) => void) | undefined;
    mocks.resend.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    render(<EmailVerification email={email} redirectTo={redirectTo} />);
    expect(screen.getByRole("button", { name: "Resend confirmation email" })).toBeDisabled();
    await advanceCooldown();
    fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" }));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(mocks.resend).toHaveBeenCalledExactlyOnceWith({ type: "signup", email, options: { emailRedirectTo: redirectTo } });
    await act(async () => { complete?.({ error: null }); });
    expect(screen.getByRole("status")).toHaveTextContent("Confirmation email requested.");
    expect(screen.getByRole("button", { name: "Resend confirmation email" })).toBeDisabled();
    await advanceCooldown();
    expect(screen.getByRole("button", { name: "Resend confirmation email" })).toBeEnabled();
  });

  it.each([
    ["service error", () => Promise.resolve({ error: { message: "Email unavailable", status: 500 } }), "Email unavailable"],
    ["rate limit", () => Promise.resolve({ error: { message: "Rate limited", status: 429 } }), "Too many email requests"],
    ["network failure", () => Promise.reject(new Error("Offline")), "Check your connection"],
  ])("handles %s without repeated clicks", async (_label, implementation, message) => {
    mocks.resend.mockImplementation(implementation);
    render(<EmailVerification email={email} redirectTo={redirectTo} />);
    await advanceCooldown();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" })); });
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Resend confirmation email" })).toBeDisabled();
  });
});