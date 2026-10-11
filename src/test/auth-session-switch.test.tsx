import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const m = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: { user: { id: string } } | null) => void),
  ctxUser: { id: "user-a", email: "a@example.com" },
  invalidate: vi.fn(), clear: vi.fn(), unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getUser: vi.fn(),
  onAuthStateChange: (cb: typeof m.listener) => { m.listener = cb; return { data: { subscription: { unsubscribe: m.unsubscribe } } }; },
} } }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ clear: m.clear }) }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options, useRouteContext: () => ({ user: m.ctxUser }) }),
  redirect: vi.fn(),
  useRouter: () => ({ invalidate: m.invalidate }),
  Outlet: () => <p>Private scans of {m.ctxUser.email} · Delete account</p>,
}));

const load = async () => (await import("@/routes/_authenticated/route")).Route as unknown as { options: { component: ComponentType } };
const emit = (event: string, id: string | null) => act(() => { m.listener?.(event, id ? { user: { id } } : null); });

beforeEach(() => { vi.clearAllMocks(); m.listener = null; m.ctxUser = { id: "user-a", email: "a@example.com" }; });
afterEach(cleanup);

describe("Authenticated layout reacts to auth changes from other tabs", () => {
  it("removes A's private UI on sign-out and resets cached data", async () => {
    const Layout = (await load()).options.component; render(<Layout />);
    expect(screen.getByText(/a@example.com/)).toBeVisible();
    emit("SIGNED_OUT", null);
    expect(screen.queryByText(/a@example.com/)).not.toBeInTheDocument();
    expect(m.clear).toHaveBeenCalled(); expect(m.invalidate).toHaveBeenCalled();
  });
  it("never shows A's UI (or its delete action) under B's session; remounts fresh for B", async () => {
    const Layout = (await load()).options.component; const view = render(<Layout />);
    emit("SIGNED_IN", "user-b");
    expect(screen.queryByText(/a@example.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Delete account/)).not.toBeInTheDocument();
    m.ctxUser = { id: "user-b", email: "b@example.com" }; view.rerender(<Layout />);
    expect(screen.getByText(/b@example.com/)).toBeVisible();
  });
  it("keeps stable sessions mounted on token refresh / same-user events", async () => {
    const Layout = (await load()).options.component; render(<Layout />);
    emit("TOKEN_REFRESHED", "user-a"); emit("USER_UPDATED", "user-a");
    expect(screen.getByText(/a@example.com/)).toBeVisible(); expect(m.clear).not.toHaveBeenCalled();
  });
});
