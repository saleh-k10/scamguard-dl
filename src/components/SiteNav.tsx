import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-orb-1 blur-3xl" />
      <div className="absolute top-24 -right-32 size-[560px] rounded-full bg-orb-2 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-[520px] rounded-full bg-orb-3 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 size-[360px] rounded-full bg-orb-4 blur-3xl" />
    </div>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-semibold text-primary-foreground">S</span>
      <span className="font-display text-lg font-bold tracking-tight">ScamGuard</span>
    </Link>
  );
}

const link = "text-sm text-muted-foreground hover:text-foreground transition-colors";

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
  return (
    <nav className="glass sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {user && <Link to="/dashboard" className={link} activeProps={{ className: "text-foreground font-medium" }}>Dashboard</Link>}
          <Link to="/check" className={link} activeProps={{ className: "text-foreground font-medium" }}>Check a message</Link>
          <Link to="/history" className={link} activeProps={{ className: "text-foreground font-medium" }}>History</Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <button onClick={logout} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">Log out</button>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Log in</Link>
              <Link to="/signup" className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">Sign up</Link>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-6 border-t border-border py-2 md:hidden">
        <Link to="/check" className={link}>Check</Link>
        <Link to="/history" className={link}>History</Link>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10 text-xs leading-relaxed text-muted-foreground">
      © 2026 ScamGuard · Educational tool — results are advisory only and never a substitute for independent verification.
    </footer>
  );
}
