import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name } },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else setNotice("Check your email to confirm your account, then log in.");
    }
  };

  const field = "mt-1.5 w-full rounded-[12px] border border-input bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring";
  return (
    <main className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div className="rise hidden md:block">
        <h1 className="text-5xl font-bold leading-tight">{isLogin ? "Welcome back." : "Keep your guard up."}</h1>
        <p className="mt-4 max-w-[38ch] text-muted-foreground">
          {isLogin ? "Log in to see your scan history and pick up where you left off." : "Create a free account to save scans and track the scam patterns you encounter."}
        </p>
      </div>
      <form onSubmit={submit} className="rise glass-strong rounded-[22px] p-6 sm:p-8 [animation-delay:80ms]">
        <h2 className="text-2xl font-bold">{isLogin ? "Log in" : "Create account"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"} className="font-medium text-primary hover:underline">{isLogin ? "Sign up" : "Log in"}</Link>
        </p>
        {!isLogin && (
          <label className="mt-6 block text-sm font-medium">Name<input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Alex Morgan" autoComplete="name" /></label>
        )}
        <label className={`${isLogin ? "mt-6" : "mt-4"} block text-sm font-medium`}>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@university.edu" autoComplete="email" /></label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} />
        </label>
        {error && <p className="mt-4 text-sm text-high">{error}</p>}
        {notice && <p className="mt-4 text-sm text-low">{notice}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>
      </form>
    </main>
  );
}
