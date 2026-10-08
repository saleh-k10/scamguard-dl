import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { analyze, type Channel } from "@/lib/analyzer";
import { createScan, setUnsaved } from "@/lib/scans";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check a message — ScamGuard" },
      { name: "description", content: "Paste a suspicious email, SMS or message and get an instant scam risk assessment." },
      { property: "og:title", content: "Check a message — ScamGuard" },
      { property: "og:description", content: "Paste a suspicious message and analyze it for scam warning signs." },
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

  const [err, setErr] = useState("");
  const run = async () => {
    if (text.trim().length < 10) return;
    setBusy(true);
    setErr("");
    await new Promise((res) => setTimeout(res, 600));
    const r = analyze(text, channel);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setUnsaved(r);
      nav({ to: "/result/$id", params: { id: r.id } });
      return;
    }
    try {
      const id = await createScan(r);
      nav({ to: "/result/$id", params: { id } });
    } catch {
      setBusy(false);
      setErr("Couldn't save this scan. Please try again.");
    }
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
            <button
              key={c.id}
              role="radio"
              aria-checked={channel === c.id}
              onClick={() => setChannel(c.id)}
              className={`rounded-full py-2 text-sm font-medium transition ${channel === c.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label htmlFor="msg" className="mt-6 block text-sm font-medium">Message text</label>
        <textarea
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={channel === "sms" ? "e.g. Your parcel is on hold. Pay the £1.99 fee at…" : "Paste the email or message text here…"}
          className="mt-2 w-full resize-y rounded-[14px] border border-input bg-surface p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{text.length} characters</span>
          <button className="hover:text-foreground" onClick={() => setText("URGENT: Your bank account has been suspended. Verify your identity within 2 hours to avoid closure: bit.ly/secure-verify")}>Try an example</button>
        </div>

        <button
          onClick={run}
          disabled={busy || text.trim().length < 10}
          className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Analyzing…" : "Analyze Message"}
        </button>
        {err && <p className="mt-3 text-center text-sm text-high">{err}</p>}
        <p className="mt-4 text-center text-xs text-muted-foreground">Only a short preview and the result are saved to your account — never the full message. Results are advisory only.</p>
      </div>
    </main>
  );
}
