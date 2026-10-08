import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecovery } from "@/components/PasswordRecovery";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Reset password — ScamGuard" },
    { name: "description", content: "Choose a new password using your secure ScamGuard recovery link." },
    { property: "og:title", content: "Reset password — ScamGuard" },
    { property: "og:description", content: "Securely set a new password for your ScamGuard account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <PasswordRecovery mode="reset" />,
});