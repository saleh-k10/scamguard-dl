import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — ScamGuard" },
      { name: "description", content: "Create a free ScamGuard account to save your scans." },
      { property: "og:title", content: "Sign up — ScamGuard" },
      { property: "og:description", content: "Create a free ScamGuard account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthCard mode="signup" />,
});
