import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, LockKeyhole, ArrowRight, Mail, AlertTriangle, Clock3, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <header className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:py-16 lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <p className="mb-5 text-[11px] font-semibold uppercase text-primary">MESSAGE SAFETY, EXPLAINED</p>
          <h1 className="text-[42px] font-bold leading-[1.06] md:text-[60px] lg:text-[64px]">Think before<br /><span className="text-primary">you click.</span></h1>
          <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-muted-foreground">Spot suspicious messages. Understand the warning signs. Decide what to do next.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="h-12 px-5 font-semibold"><Link to="/check">Check a Message<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild variant="outline" className="h-12 border-primary/50 px-5"><a href="#how">How it works</a></Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />AI-powered assessment · Advisory only</p>
        </div>
        <div className="example-backdrop min-w-0">
          <div className="glass-strong rounded-xl p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">EXAMPLE ASSESSMENT</p>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2.5"><Mail className="size-5 shrink-0 text-primary" aria-hidden="true" /><h2 className="min-w-0 text-sm font-semibold sm:text-base">Suspicious message</h2></div>
              <span className="shrink-0 rounded-md border border-high/35 bg-high/10 px-2 py-1 text-[11px] font-semibold text-high">High risk</span>
            </div>
            <p className="mt-4 break-words rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-muted-foreground">URGENT: Your account is frozen. Verify your bank details within 2 hours or lose access: <span className="text-foreground [overflow-wrap:anywhere]">https://account-check.example/verify</span></p>
            <div className="mt-5 flex items-baseline gap-3"><span className="text-6xl font-bold leading-none">87</span><span className="text-xs text-muted-foreground">/100 risk score</span></div>
            <div className="relative mt-4 h-2 rounded-full bg-border" aria-label="Example risk score: 87 out of 100">
              <div className="h-full w-[87%] rounded-full bg-high" />
              <span className="absolute left-[87%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-high" />
            </div>
            <div className="mt-5 divide-y divide-border">
              {[{ Icon: Clock3, text: "Artificial urgency", color: "text-medium" }, { Icon: AlertTriangle, text: "Requests bank details", color: "text-high" }, { Icon: Link2, text: "Unfamiliar link", color: "text-high" }].map(({ Icon, text, color }) => <div key={text} className="flex items-center gap-3 py-3 text-sm"><Icon className={`size-4 shrink-0 ${color}`} aria-hidden="true" />{text}</div>)}
            </div>
            <p className="mt-3 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />Verify through official channels.</p>
          </div>
        </div>
      </header>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-12 sm:px-6">
        <h2 className="sr-only">Paste → Analyze → Learn</h2>
        <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {steps.map((s) => <div key={s.n} className="py-7 md:px-7 md:first:pl-0 md:last:pr-0"><div className="flex items-center gap-3"><span className="font-mono text-xs text-primary">{s.n}</span><h3 className="text-lg font-semibold">{s.t}</h3></div><p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{s.d}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="border-t border-border py-7 md:py-8">
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

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mt-10 flex justify-center">
          <Button asChild className="h-12 px-6 font-semibold"><Link to="/check">Check a Message<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </>
  );
}
