import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirming your account — ScamGuard" },
      { name: "description", content: "Finishing sign-in to ScamGuard." },
      { property: "og:title", content: "Confirming your account — ScamGuard" },
      { property: "og:description", content: "Finishing sign-in to ScamGuard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const errDesc = params.get("error_description") || hash.get("error_description");
    if (errDesc) {
      setError(errDesc);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    (async () => {
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setError(error.message);
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) go();
    })();
    const t = setTimeout(() => {
      if (!done) setError("We couldn't confirm your session. Please log in.");
    }, 8000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <div className="glass-strong rounded-[22px] p-8">
        <h1 className="text-2xl font-bold">{error ? "Confirmation problem" : "Confirming your account…"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error ?? "One moment while we sign you in to ScamGuard."}
        </p>
        {error && (
          <a href="/login" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Go to log in</a>
        )}
      </div>
    </main>
  );
}
