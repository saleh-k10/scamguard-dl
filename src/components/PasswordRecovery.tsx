import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { beginPasswordRecovery, clearPasswordRecovery, newPasswordSchema, PASSWORD_RESET_URL, recoveryEmailSchema } from "@/lib/password-recovery";

const field = "mt-2 w-full rounded-[12px] border border-input bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring";

export function PasswordRecovery({ mode }: { mode: "request" | "reset" }) {
  const resetting = mode === "reset";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "invalid">("checking");
  const [cooldown, setCooldown] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    if (!resetting) return;
    let alive = true;
    const recovery = beginPasswordRecovery();
    const scrub = () => window.history.replaceState(window.history.state, "", "/reset-password");
    const timeout = setTimeout(() => {
      if (!alive) return;
      alive = false; recovery.cancel(); clearPasswordRecovery(); scrub(); setSessionState("invalid");
    }, 10_000);
    recovery.promise.then(() => { if (alive) { scrub(); setSessionState("ready"); } }).catch(() => {
      if (alive) { clearPasswordRecovery(); scrub(); setSessionState("invalid"); }
    }).finally(() => { clearTimeout(timeout); recovery.cancel(); });
    return () => { alive = false; clearTimeout(timeout); recovery.cancel(); };
  }, [resetting]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || (!resetting && cooldown > 0) || (resetting && sessionState !== "ready")) return;
    setError("");
    const parsed = resetting ? newPasswordSchema.safeParse({ password, confirmation }) : recoveryEmailSchema.safeParse(email);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const key = resetting ? String(issue.path[0]) : "email"; if (!next[key]) next[key] = issue.message; }
      setFields(next); return;
    }
    setFields({}); pending.current = true; setBusy(true);
    try {
      if (resetting) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          if (updateError.code === "same_password") setError("Choose a different password from your current one.");
          else if (updateError.code === "weak_password") setError("Choose a stronger password with a mix of letters, numbers, and symbols.");
          else setError("We couldn't update your password. Try again, or request a fresh reset link.");
          return;
        }
        clearPasswordRecovery(); setPassword(""); setConfirmation("");
        // A successful recovery ends in an explicit login, not an implicit dashboard session.
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        setSuccess(true);
      } else {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: PASSWORD_RESET_URL });
        setCooldown(60);
        if (requestError) { setError(requestError.status === 429 ? "Please wait a minute before requesting another link." : "We couldn't send the reset request. Please try again shortly."); return; }
        setSuccess(true);
      }
    } catch { setError("We couldn't connect. Check your connection and try again."); }
    finally { pending.current = false; setBusy(false); }
  };

  const fieldError = (key: string) => fields[key] && <span id={`${key}-error`} className="mt-1.5 block text-sm font-normal text-high">{fields[key]}</span>;
  const invalid = resetting && sessionState === "invalid";
  const checking = resetting && sessionState === "checking";
  return <main className="mx-auto max-w-md px-5 py-14 sm:py-20">
    <section className="rise glass-strong rounded-[22px] p-6 sm:p-8">
      {success ? <>
        <CheckCircle2 className="h-8 w-8 text-low" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">{resetting ? "Password updated" : "Check your inbox"}</h1>
        <p role="status" className="mt-3 text-sm leading-relaxed text-muted-foreground">{resetting ? "Your new password is ready. Log in to continue to ScamGuard." : "If an account exists for that email, you'll receive a password reset link. Check your inbox and spam folder."}</p>
        {!resetting && <Button variant="outline" disabled={cooldown > 0} onClick={() => setSuccess(false)} className="mt-5 w-full rounded-full">{cooldown > 0 ? `Request again in ${cooldown}s` : "Request another link"}</Button>}
        <Button asChild className="mt-5 w-full rounded-full"><Link to="/login">Log in</Link></Button>
      </> : invalid ? <>
        <KeyRound className="h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Reset link unavailable</h1>
        <p role="alert" className="mt-3 text-sm leading-relaxed text-muted-foreground">This link may have expired, already been used, or be invalid. Request a new link and open the latest email.</p>
        <Button asChild className="mt-6 w-full rounded-full"><Link to="/forgot-password">Request a new link</Link></Button>
      </> : checking ? <div role="status" className="py-8 text-center"><LoaderCircle className="mx-auto h-7 w-7 text-primary motion-safe:animate-spin" aria-hidden="true" /><h1 className="mt-4 text-2xl font-bold">Checking your reset link…</h1></div> : <form noValidate onSubmit={submit}>
        {resetting ? <KeyRound className="h-8 w-8 text-primary" aria-hidden="true" /> : <Mail className="h-8 w-8 text-primary" aria-hidden="true" />}
        <h1 className="mt-4 text-2xl font-bold">{resetting ? "Set a new password" : "Forgot your password?"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{resetting ? "Use at least 8 characters for your new password." : "Enter your email and we'll send a link to reset your password."}</p>
        {resetting ? <>
          <label className="mt-6 block text-sm font-medium">New password<input type="password" value={password} maxLength={128} autoComplete="new-password" disabled={busy} aria-invalid={!!fields.password} aria-describedby={fields.password ? "password-error" : undefined} onChange={(e) => setPassword(e.target.value)} className={field} />{fieldError("password")}</label>
          <label className="mt-4 block text-sm font-medium">Confirm new password<input type="password" value={confirmation} maxLength={128} autoComplete="new-password" disabled={busy} aria-invalid={!!fields.confirmation} aria-describedby={fields.confirmation ? "confirmation-error" : undefined} onChange={(e) => setConfirmation(e.target.value)} className={field} />{fieldError("confirmation")}</label>
        </> : <label className="mt-6 block text-sm font-medium">Email<input type="email" value={email} maxLength={255} autoComplete="email" disabled={busy} aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-error" : undefined} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@university.edu" />{fieldError("email")}</label>}
        {error && <p role="alert" className="mt-4 text-sm leading-relaxed text-high">{error}</p>}
        <Button type="submit" disabled={busy || (!resetting && cooldown > 0)} className="mt-6 h-auto w-full rounded-full py-3.5">{busy ? "Please wait…" : resetting ? "Update password" : cooldown > 0 ? `Try again in ${cooldown}s` : "Send reset link"}</Button>
        <Button asChild variant="ghost" className="mt-3 w-full rounded-full"><Link to={resetting ? "/forgot-password" : "/login"}>{resetting ? "Request a fresh reset link" : "Back to log in"}</Link></Button>
      </form>}
    </section>
  </main>;
}