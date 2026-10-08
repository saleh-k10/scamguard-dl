import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ScamGuard" },
      { name: "description", content: "Your ScamGuard dashboard." },
      { property: "og:title", content: "Dashboard — ScamGuard" },
      { property: "og:description", content: "Check messages and review your scans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const name = (user.user_metadata?.["name"] as string | undefined) || user.email;
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6 md:py-16">
      <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Dashboard</span>
      <h1 className="mt-2 text-4xl font-bold md:text-5xl">Welcome, {name}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/check" className="glass-strong rounded-[22px] p-6 hover:opacity-90">
          <h2 className="text-xl font-bold">Check a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">Paste a suspicious email or SMS to see its warning signs.</p>
        </Link>
        <Link to="/history" className="glass-strong rounded-[22px] p-6 hover:opacity-90">
          <h2 className="text-xl font-bold">Scan history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Review the messages you've checked before.</p>
        </Link>
      </div>
    </main>
  );
}
