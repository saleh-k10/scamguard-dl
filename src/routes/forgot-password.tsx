import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecovery } from "@/components/PasswordRecovery";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Forgot password — ScamGuard" },
    { name: "description", content: "Request a secure password reset link for your ScamGuard account." },
    { property: "og:title", content: "Forgot password — ScamGuard" },
    { property: "og:description", content: "Recover access to your ScamGuard account securely." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <PasswordRecovery mode="request" />,
});