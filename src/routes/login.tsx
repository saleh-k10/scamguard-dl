import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — ScamGuard" },
      { name: "description", content: "Log in to ScamGuard to view your scan history." },
      { property: "og:title", content: "Log in — ScamGuard" },
      { property: "og:description", content: "Access your ScamGuard account." },
    ],
  }),
  component: () => <AuthCard mode="login" />,
});
