import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmailVerification } from "@/components/EmailVerification";

const PUBLISHED_URL = "https://scamguard-dl.lovable.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { name?: string | undefined; email?: string | undefined; password?: string | undefined };

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!isLogin && !name.trim()) errs.name = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    if (busy) return;
    setBusy(true);
    try {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return setError(error.message);
      navigate({ to: "/dashboard" });
    } else {
      const fullName = name.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${PUBLISHED_URL}/auth/callback`,
          data: { name: fullName, full_name: fullName },
        },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else {
        setPassword("");
        setVerificationEmail(email.trim());
      }
    }
    } catch {
      setError("We couldn't connect to ScamGuard. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1.5 w-full rounded-[12px] border border-input bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring";
  const fieldErr = (msg?: string) => msg && <span className="mt-1.5 block text-sm font-normal text-high">{msg}</span>;
  return (
    <main className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div className="rise hidden md:block">
        <h1 className="text-5xl font-bold leading-tight">{isLogin ? "Welcome back." : "Keep your guard up."}</h1>
        <p className="mt-4 max-w-[38ch] text-muted-foreground">
          {isLogin ? "Log in to see your scan history and pick up where you left off." : "Create a free account to save scans and track the scam patterns you encounter."}
        </p>
      </div>
      {verificationEmail && !isLogin ? <EmailVerification email={verificationEmail} redirectTo={`${PUBLISHED_URL}/auth/callback`} /> : <form noValidate onSubmit={submit} className="rise glass-strong rounded-[22px] p-6 sm:p-8 [animation-delay:80ms]">
        <h2 className="text-2xl font-bold">{isLogin ? "Log in" : "Create account"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"} className="font-medium text-primary hover:underline">{isLogin ? "Sign up" : "Log in"}</Link>
        </p>
        {!isLogin && (
          <label className="mt-6 block text-sm font-medium">Full Name<input required aria-invalid={!!fieldErrors.name} value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })); }} className={field} placeholder="Alex Morgan" autoComplete="name" />{fieldErr(fieldErrors.name)}</label>
        )}
        <label className={`${isLogin ? "mt-6" : "mt-4"} block text-sm font-medium`}>Email<input required aria-invalid={!!fieldErrors.email} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })); }} className={field} placeholder="you@university.edu" autoComplete="email" />{fieldErr(fieldErrors.email)}</label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input required aria-invalid={!!fieldErrors.password} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: undefined })); }} className={field} placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} />
          {fieldErr(fieldErrors.password)}
        </label>
        {isLogin && <div className="mt-3 text-right"><Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>}
        {error && <p role="alert" className="mt-4 text-sm text-high">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-6 h-auto w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60">
          {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </Button>
      </form>}
    </main>
  );
}
