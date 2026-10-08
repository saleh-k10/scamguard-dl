import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const COOLDOWN_MS = 60_000;

export function EmailVerification({ email, redirectTo }: { email: string; redirectTo: string }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const deadline = useRef(Date.now() + COOLDOWN_MS);
  const inFlight = useRef(false);
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const resend = async () => {
    if (inFlight.current || Date.now() < deadline.current) return;
    inFlight.current = true;
    setSending(true);
    setFeedback(null);
    deadline.current = Date.now() + COOLDOWN_MS;
    setRemaining(60);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setFeedback({ kind: "error", message: error.status === 429
          ? "Too many email requests. Please wait a little longer before trying again."
          : `We couldn't resend your confirmation email. ${error.message}` });
      } else {
        setFeedback({ kind: "success", message: "Confirmation email requested. Check your inbox and spam folder for the latest link." });
      }
    } catch {
      setFeedback({ kind: "error", message: "We couldn't reach the email service. Check your connection and try again shortly." });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="verification-title" className="rise glass-strong min-w-0 rounded-[22px] p-6 sm:p-8 [animation-delay:80ms]">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <MailCheck className="size-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-xs font-semibold uppercase text-primary">One last step</p>
      <h2 id="verification-title" className="text-2xl font-bold">Check your inbox</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We’ve requested a confirmation email for</p>
      <p className="mt-1 break-all text-[15px] font-semibold">{email}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Open the latest confirmation link to verify your email and continue to ScamGuard. If you don’t see it, check your spam or junk folder.</p>
      <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">You can open the confirmation link on any device. If you confirm on another device, return here and log in with your email and password.</p>
      <div className="mt-5 min-h-12" aria-live="polite" aria-atomic="true">
        {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={`flex items-start gap-2 text-sm leading-relaxed ${feedback.kind === "error" ? "text-high" : "text-low"}`}>
          {feedback.kind === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {feedback.message}
        </p>}
      </div>
      <Button type="button" disabled={sending || remaining > 0} onClick={resend} className="h-auto min-h-12 w-full whitespace-normal rounded-full px-4 py-3.5 font-semibold" aria-busy={sending}>
        {sending ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
        {sending ? "Sending…" : "Resend confirmation email"}
      </Button>
      <p className="mt-2 min-h-5 text-center text-xs text-muted-foreground">{remaining > 0 ? `You can resend in ${remaining}s.` : "You can request a new confirmation link now."}</p>
      <Button asChild variant="ghost" className="mt-4 h-auto min-h-11 w-full whitespace-normal rounded-full py-3">
        <Link to="/login">Already confirmed? Log in <ArrowRight aria-hidden="true" /></Link>
      </Button>
    </section>
  );
}