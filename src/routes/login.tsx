import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — ScamGuard" },
      { name: "description", content: "Log in to ScamGuard to view your scan history." },
      { property: "og:title", content: "Log in — ScamGuard" },
      { property: "og:description", content: "Access your ScamGuard account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthCard mode="login" />,
});
