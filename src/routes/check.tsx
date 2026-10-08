import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { type Channel, type Result } from "@/lib/analyzer";
import { analyzeWithAI } from "@/lib/analysis.functions";
import { ruleFallback } from "@/lib/ai-analysis";
import { MAX_MESSAGE_LENGTH, redactSensitiveText } from "@/lib/sensitive-text";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { createScan, setUnsaved } from "@/lib/scans";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check a message — ScamGuard" },
      { name: "description", content: "Paste a suspicious email, SMS or message and get an instant scam risk assessment." },
      { property: "og:title", content: "Check a message — ScamGuard" },
      { property: "og:description", content: "Paste a suspicious message and analyze it for scam warning signs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Check,
});

const channels: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "other", label: "Other" },
];

function Check() {
  const [channel, setChannel] = useState<Channel>("email");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const requestAnalysis = useServerFn(analyzeWithAI);
  const active = useRef<AbortController | null>(null);
  const [slow, setSlow] = useState(false);
  const sensitive = redactSensitiveText(text).detected;
  useEffect(() => () => { active.current?.abort(); }, []);
  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const timer = window.setTimeout(() => setSlow(true), 25_000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  const [err, setErr] = useState("");
  const run = async () => {
    if (text.trim().length < 10 || text.length > MAX_MESSAGE_LENGTH || busy) return;
    setBusy(true);
    setErr("");
    const controller = new AbortController();
    active.current = controller;
    const safe = redactSensitiveText(text).text;
    let r: Result;
    try {
      try {
        r = await requestAnalysis({ data: { message: safe, channel }, signal: controller.signal });
      } catch {
        if (controller.signal.aborted) return;
        r = ruleFallback(safe, channel, "AI couldn't be reached or the request timed out. Showing the basic pattern check instead.");
      }
      if (controller.signal.aborted) return;
      await showResult(r);
    } catch {
      setErr("Couldn't save this scan. Please try again.");
    } finally {
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  };
  const showResult = async (r: Result) => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      setUnsaved(r);
      await nav({ to: "/result/$id", params: { id: r.id } });
    } else {
      const id = await createScan(r);
      await nav({ to: "/result/$id", params: { id } });
    }
  };
  const useBasicCheck = async () => {
    const controller = active.current;
    if (!controller) return;
    active.current?.abort();
    active.current = null;
    try {
      await showResult(ruleFallback(text, channel, "You chose the basic pattern check instead of waiting for AI."));
    } catch { setErr("Couldn't save this scan. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 md:py-16">
      <div className="rise">
        <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Analyze</span>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Check a message</h1>
        <p className="mt-3 text-muted-foreground">Paste the full text. Don't click any links in it while you decide.</p>
      </div>

      <div className="rise glass-strong mt-8 rounded-[22px] p-5 sm:p-7 [animation-delay:80ms]">
        <div className="text-sm font-medium">Where did you receive it?</div>
        <div role="radiogroup" className="mt-3 grid grid-cols-3 gap-2 rounded-full border border-border bg-surface p-1">
          {channels.map((c) => (
            <Button
              key={c.id}
              role="radio"
              aria-checked={channel === c.id}
              disabled={busy}
              variant="ghost"
              onClick={() => setChannel(c.id)}
              className={`rounded-full py-2 text-sm font-medium transition ${channel === c.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {c.label}
            </Button>
          ))}
        </div>

        <label htmlFor="msg" className="mt-6 block text-sm font-medium">Message text</label>
        <textarea
          id="msg"
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={channel === "sms" ? "e.g. Your parcel is on hold. Pay the £1.99 fee at…" : "Paste the email or message text here…"}
          className="mt-2 w-full resize-y rounded-[14px] border border-input bg-surface p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{text.length} / {MAX_MESSAGE_LENGTH}</span>
          <Button variant="link" disabled={busy} className="h-auto p-0 text-xs" onClick={() => setText("URGENT: Your bank account has been suspended. Verify your identity within 2 hours to avoid closure: bit.ly/secure-verify")}>Try an example</Button>
        </div>
        {sensitive && <p role="alert" className="mt-4 rounded-[12px] border border-medium/30 bg-medium/10 p-3 text-sm">This text may contain passwords, codes, card numbers or secrets. Obvious matches will be redacted before analysis and saving, but detection is not guaranteed. Remove sensitive information before continuing.</p>}

        <Button
          onClick={run}
          disabled={busy || text.trim().length < 10}
          className="mt-6 h-auto w-full rounded-full py-3.5 text-sm font-semibold"
        >
          {busy && <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />}
          {busy ? "Analyzing with AI…" : "Analyze Message"}
        </Button>
        {busy && <div className="mt-3 text-center">
          <p role="status" className="text-sm text-muted-foreground">{slow ? "AI is taking longer than usual. You can keep waiting or use the basic check." : "Assessing warning signs and preparing your explanation…"}</p>
          <Button variant="link" onClick={useBasicCheck} className="mt-1">Use basic check instead</Button>
        </div>}
        {err && <p role="alert" className="mt-3 text-center text-sm text-high">{err}</p>}
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">Message text with detected secrets redacted is sent to Lovable AI for analysis. Only a short preview and structured results are saved to signed-in accounts — never the full message. Results are advisory only.</p>
      </div>
    </main>
  );
}
