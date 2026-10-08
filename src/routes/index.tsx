import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { accountDeleted?: boolean } => (search["accountDeleted"] === true || search["accountDeleted"] === "true" ? { accountDeleted: true } : {}),
  head: () => ({
    meta: [
      { title: "ScamGuard — Think before you click" },
      { name: "description", content: "Check suspicious emails and SMS for scam warning signs, get a risk score, and learn how to spot scams yourself." },
      { property: "og:title", content: "ScamGuard — Think before you click" },
      { property: "og:description", content: "Paste a suspicious message, get a 0–100 risk score and learn the warning signs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const steps = [
  { n: "01", t: "Paste", d: "Drop in the email, SMS or message text you're unsure about." },
  { n: "02", t: "Analyze", d: "AI assesses the message for scam indicators and suggests a risk level — not a verdict." },
  { n: "03", t: "Learn", d: "Teach Me Why explains each sign so you can spot the next one alone." },
];

function Landing() {
  const { accountDeleted } = Route.useSearch();
  return (
    <>
      {accountDeleted && <p role="status" className="mx-auto mt-5 max-w-6xl border-y border-low/25 bg-low/10 px-6 py-3 text-sm">Your account and saved scan history have been deleted.</p>}
      <header className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="rise">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="pulse-dot size-1.5 rounded-full bg-low" />Free · private · advisory
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.02] md:text-6xl">Think before<br />you click.</h1>
          <p className="mt-5 max-w-[44ch] text-pretty text-lg text-muted-foreground">
            Phishing emails and scam texts are designed to look real and make you act fast. Paste a suspicious message and ScamGuard scores the risk, flags the warning signs, and teaches you why — before it costs you anything.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/check" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Check a Message</Link>
            <a href="#how" className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium hover:bg-card">How it works</a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="size-3.5" aria-hidden="true" />AI-powered analysis</p>
        </div>
        <div className="rise [animation-delay:120ms]">
          <div className="glass-strong rounded-[22px] p-5">
            <div className="mb-4 flex items-center gap-2"><span className="size-2.5 rounded-full bg-high" /><span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">incoming · flagged</span></div>
            <div className="rounded-[14px] border border-border bg-surface p-4 text-sm leading-relaxed">
              "URGENT: your account is frozen. Verify your bank details within 2 hours or lose access — <span className="text-high underline decoration-high/40">bit.ly/acct-fix</span>"
            </div>
            <div className="mt-4 flex items-end gap-4">
              <div className="font-display text-6xl font-bold leading-none text-high">87</div>
              <div className="pb-1">
                <div className="font-mono text-xs text-muted-foreground">/100 risk</div>
                <div className="mt-1 inline-flex rounded-full bg-high/10 px-2.5 py-0.5 text-xs font-semibold text-high">High risk</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[["text-high", "Unknown shortened link"], ["text-medium", "Artificial urgency deadline"], ["text-high", "Asks for bank details"]].map(([c, t]) => (
                <div key={t} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-sm"><span className={c}>▲</span>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="glass rounded-[20px] p-6 md:p-8">
          <span className="font-mono text-[11px] uppercase tracking-widest text-primary">The problem</span>
          <p className="mt-3 max-w-[70ch] font-display text-xl leading-snug md:text-2xl">
            Scams no longer look like scams. They copy real banks, delivery companies and universities — and rely on one moment of hurry. A second opinion before you click is the simplest protection there is.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl border-t border-border px-6 py-10 md:py-12" aria-labelledby="ai-transparency">
        <div className="flex items-center gap-2 text-primary"><Sparkles className="size-4" aria-hidden="true" /><span className="font-mono text-[11px] uppercase tracking-widest">Transparency</span></div>
        <h2 id="ai-transparency" className="mt-3 text-3xl font-bold">How ScamGuard uses AI</h2>
        <div className="mt-6 grid gap-7 md:grid-cols-3">
          <div><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-3 text-lg font-semibold">Assessment, not certainty</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">AI assesses wording, links, requests and social-engineering cues. It returns a risk assessment, not a verdict. Independently verify suspicious messages through official channels.</p></div>
          <div><LockKeyhole className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-3 text-lg font-semibold">Privacy with practical limits</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Obvious sensitive credentials are redacted where practical before AI processing; detection is not guaranteed. Signed-in history stores only a short preview and structured results — never the full raw message.</p></div>
          <div><Sparkles className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-3 text-lg font-semibold">A fallback when needed</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">If AI is unavailable, ScamGuard can use its basic pattern checker instead. Results clearly identify the assessment used and remain advisory.</p></div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12">
        <h2 className="mb-6 text-3xl font-bold">Paste → Analyze → Learn</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="rise glass rounded-[18px] p-6" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="font-mono text-xs text-primary">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link to="/check" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Check a Message</Link>
        </div>
      </section>
    </>
  );
}
