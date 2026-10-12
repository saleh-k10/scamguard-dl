import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background" />
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-md bg-primary font-semibold text-primary-foreground">S</span>
      <span className="font-display text-lg font-bold">ScamGuard</span>
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
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-4 sm:flex sm:justify-between sm:gap-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {user && <Link to="/dashboard" className={link} activeProps={{ className: "text-foreground font-medium" }}>Dashboard</Link>}
          <Link to="/check" className={link} activeProps={{ className: "text-foreground font-medium" }}>Check a message</Link>
          <Link to="/history" className={link} activeProps={{ className: "text-foreground font-medium" }}>History</Link>
          {user && <Link to="/account" className={link} activeProps={{ className: "text-foreground font-medium" }}>Account</Link>}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <Button variant="outline" onClick={logout} className="border-primary/60 text-primary">Log out</Button>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Log in</Link>
              <Button asChild variant="outline" className="border-primary/60 text-primary"><Link to="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-6 border-t border-border py-2 md:hidden">
        <Link to="/check" className={link}>Check</Link>
        <Link to="/history" className={link}>History</Link>
        {user && <Link to="/account" className={link}>Account</Link>}
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
