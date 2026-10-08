import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LEVEL_LABEL, LEVEL_SOFT, type Level, type Result } from "@/lib/analyzer";
import { listMyScans } from "@/lib/scans";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Scan history — ScamGuard" },
      { name: "description", content: "Review the messages you've checked and their risk levels." },
      { property: "og:title", content: "Scan history — ScamGuard" },
      { property: "og:description", content: "Your past ScamGuard checks in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

const filters: ("all" | Level)[] = ["all", "high", "medium", "low"];

function History() {
  const [items, setItems] = useState<Result[] | null>(null);
  const [error, setError] = useState(false);
  const [f, setF] = useState<"all" | Level>("all");
  useEffect(() => {
    listMyScans().then(setItems).catch(() => { setError(true); setItems([]); });
  }, []);
  const all = items ?? [];
  const shown = all.filter((i) => f === "all" || i.level === f);
  const count = (l: Level) => all.filter((i) => i.level === l).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6 md:py-16">
      <span className="font-mono text-[11px] uppercase tracking-widest text-primary">History</span>
      <h1 className="mt-2 text-4xl font-bold md:text-5xl">Scan history</h1>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {(["high", "medium", "low"] as Level[]).map((l) => (
          <div key={l} className="glass rounded-[18px] p-4 sm:p-5">
            <div className={`font-display text-3xl font-bold ${l === "high" ? "text-high" : l === "medium" ? "text-medium" : "text-low"}`}>{count(l)}</div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{LEVEL_LABEL[l]}</div>
          </div>
        ))}
      </div>

      <div className="glass-strong mt-6 rounded-[22px] p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((x) => (
            <button key={x} onClick={() => setF(x)} className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${f === x ? "bg-foreground text-background" : "border border-border bg-surface text-muted-foreground hover:text-foreground"}`}>{x}</button>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-border">
          {shown.map((r) => (
            <li key={r.id}>
              <Link to="/result/$id" params={{ id: r.id }} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 hover:opacity-80">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">"{r.message}"</div>
                  <div className="mt-1 font-mono text-xs uppercase text-muted-foreground">
                    {r.channel} · {new Date(r.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-semibold ${LEVEL_SOFT[r.level]}`}>{r.score} · {r.level}</span>
              </Link>
            </li>
          ))}
          {items === null && <li className="py-10 text-center text-sm text-muted-foreground">Loading your scans…</li>}
          {items !== null && error && <li className="py-10 text-center text-sm text-high">Couldn't load your scans. Please refresh.</li>}
          {items !== null && !error && all.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">No scans yet — <Link to="/check" className="text-primary hover:underline">check a message</Link>.</li>}
          {all.length > 0 && shown.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">No scans at this level.</li>}
        </ul>
      </div>
    </main>
  );
}
