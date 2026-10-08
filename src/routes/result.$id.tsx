import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LEVEL_BG, LEVEL_LABEL, LEVEL_SOFT, LEVEL_TEXT, SAMPLES, type Result } from "@/lib/analyzer";
import { deleteMyScan, getMyScan, getUnsaved } from "@/lib/scans";
import { DeleteScanDialog } from "@/components/DeleteScanDialog";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/result/$id")({
  head: () => ({
    meta: [
      { title: "Analysis result — ScamGuard" },
      { name: "description", content: "Risk score, warning signs, recommended actions and a Teach Me Why lesson for your message." },
      { property: "og:title", content: "Analysis result — ScamGuard" },
      { property: "og:description", content: "See the risk score and warning signs found in a suspicious message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

type Kind = "saved" | "sample" | "unsaved";

function ResultPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [r, setR] = useState<Result | null | undefined>(undefined);
  const [kind, setKind] = useState<Kind>("saved");
  useEffect(() => {
    let alive = true;
    setR(undefined);
    const sample = SAMPLES.find((x) => x.id === id);
    if (sample) { setKind("sample"); setR(sample); return; }
    const local = getUnsaved(id);
    if (local) { setKind("unsaved"); setR(local); return; }
    setKind("saved");
    getMyScan(id).then((x) => alive && setR(x)).catch(() => alive && setR(null));
    return () => { alive = false; };
  }, [id, user?.id]);

  if (r === undefined) return <main className="mx-auto max-w-5xl px-6 py-24 text-center text-muted-foreground">Loading…</main>;
  if (r === null)
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Result not found</h1>
        <p className="mt-2 text-muted-foreground">This scan doesn't exist or belongs to another account. Log in to see your saved scans.</p>
        <Link to="/check" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Check a message</Link>
      </main>
    );

  const lvl = r.level;
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6 md:py-16">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Analysis · {r.channel}</span>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{kind === "sample" ? "Example scan" : "Your result"}</h1>
          {kind === "sample" && <p className="mt-2 text-sm text-muted-foreground">This is a demo example, not part of your history.</p>}
          {kind === "unsaved" && <p className="mt-2 text-sm text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Log in</Link> to save scans to your history. This result disappears when you leave.</p>}
          {r.quiz.meta?.source === "ai" && <p className="mt-2 text-sm text-primary">AI-powered assessment · advisory only</p>}
        </div>
        <div className="flex items-center gap-2">
          {kind === "saved" && user && <DeleteScanDialog key={id} onDelete={async () => { await deleteMyScan(id); await navigate({ to: "/history", search: { scanDeleted: true }, replace: true }); }} />}
          <Link to="/check" className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-card">Check another</Link>
        </div>
      </div>
      {r.quiz.meta?.source === "rules" && <p role="status" className="mt-5 rounded-[12px] border border-medium/30 bg-medium/10 p-4 text-sm">{r.quiz.meta.fallback} This result is not AI analysis.</p>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[340px_1fr]">
        <section className={`rise glass-strong rounded-[22px] border-t-4 p-6 ${lvl === "high" ? "border-t-high" : lvl === "medium" ? "border-t-medium" : "border-t-low"}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Risk score</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LEVEL_SOFT[lvl]}`}>{LEVEL_LABEL[lvl]}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`font-display text-7xl font-bold leading-none ${LEVEL_TEXT[lvl]}`}>{r.score}</span>
            <span className="font-mono text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-border">
            <div className={`h-2.5 rounded-full ${LEVEL_BG[lvl]}`} style={{ width: `${r.score}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className={lvl === "low" ? "text-low font-semibold" : ""}>Low</span>
            <span className={`text-center ${lvl === "medium" ? "text-medium font-semibold" : ""}`}>Medium</span>
            <span className={`text-right ${lvl === "high" ? "text-high font-semibold" : ""}`}>High</span>
          </div>
          <div className="mt-6 rounded-[12px] border border-border bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{kind === "saved" ? "Message preview" : "Message analyzed"}</span>
            <p className="mt-1 line-clamp-5 whitespace-pre-wrap">{r.message}</p>
          </div>
        </section>

        <section className="rise glass rounded-[22px] p-6 [animation-delay:80ms]">
          <h2 className="text-2xl font-bold">Warning signs <span className="font-mono text-sm font-normal text-muted-foreground">· {r.signs.length} found</span></h2>
          {r.signs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No common warning signs were detected. That doesn't guarantee the message is safe.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {r.signs.map((s) => (
                <li key={s.id} className="rounded-[12px] border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <span className={s.weight >= 20 ? "text-high" : "text-medium"}>▲</span>{s.title}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.why}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 rounded-[12px] border border-primary/25 bg-primary/5 p-4">
            <div className="font-mono text-[11px] uppercase tracking-widest text-primary">Recommended next actions</div>
            <ol className="mt-2 space-y-1.5 text-sm">
              {r.actions.map((a, i) => (
                <li key={a} className="flex gap-3"><span className="font-mono text-muted-foreground">{i + 1}.</span>{a}</li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <TeachMeWhy r={r} />

      <p className="mt-6 rounded-[14px] border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Advisory only.</span> ScamGuard looks for common warning signs. This result does not prove whether a message is fraudulent or safe. Always verify through official channels before clicking links, sending money or sharing personal information.
      </p>
    </main>
  );
}

function TeachMeWhy({ r }: { r: Result }) {
  const [pick, setPick] = useState<number | null>(null);
  const techniques = Array.from(new Map(r.signs.map((s) => [s.technique, s.techniqueText])).entries());
  return (
    <section className="rise glass-strong mt-5 rounded-[22px] p-6 md:p-8 [animation-delay:140ms]">
      <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Teach me why</span>
      <h2 className="mt-2 text-3xl font-bold">How this kind of scam works</h2>
      {r.quiz.meta?.education && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.quiz.meta.education}</p>}
      {techniques.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {techniques.map(([t, d]) => (
            <div key={t} className="rounded-[14px] border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No scam techniques were detected here — but here's a quick check to sharpen your instincts.</p>
      )}

      <div className="mt-6 rounded-[14px] border border-border bg-surface p-5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Quick question</span>
        <p className="mt-1.5 font-medium">{r.quiz.question}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {r.quiz.options.map((o, i) => {
            const chosen = pick === i;
            const correct = i === r.quiz.answer;
            const cls = pick === null ? "border-border bg-card hover:border-primary/50" : correct ? "border-low/40 bg-low/10 text-low font-medium" : chosen ? "border-high/40 bg-high/10 text-high" : "border-border bg-card opacity-60";
            return (
              <button key={o} disabled={pick !== null} onClick={() => setPick(i)} className={`rounded-full border px-4 py-2 text-left text-sm transition ${cls}`}>{o}</button>
            );
          })}
        </div>
        {pick !== null && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className={`font-semibold ${pick === r.quiz.answer ? "text-low" : "text-high"}`}>{pick === r.quiz.answer ? "Correct. " : "Not quite. "}</span>
            {r.quiz.explain}
          </p>
        )}
      </div>
    </section>
  );
}
