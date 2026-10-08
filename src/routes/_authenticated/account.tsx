import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [
    { title: "Your account — ScamGuard" },
    { name: "description", content: "Review your ScamGuard account details and securely delete your account and saved scans." },
    { property: "og:title", content: "Your account — ScamGuard" },
    { property: "og:description", content: "Manage your ScamGuard account and personal scan history." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Account,
});

function Account() {
  const { user } = Route.useRouteContext();
  const name = user.user_metadata?.["full_name"] || user.user_metadata?.["name"] || "ScamGuard user";
  const requestDeletion = useServerFn(deleteAccount);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeAccount = async () => {
    // Existing bearer middleware obtains the current token and sends it in
    // Authorization, not serialized input. No caller-controlled target exists.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return { success: false as const, error: "Please log in again before deleting your account." };
    const result = await requestDeletion({ data: { confirmation: "DELETE" } });
    if (!result.success) return result;
    try { await supabase.auth.signOut({ scope: "local" }); }
    finally {
      queryClient.clear();
      await navigate({ to: "/", search: { accountDeleted: true }, replace: true });
    }
    return result;
  };
  return <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 md:py-16">
    <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Your account</span>
    <h1 className="mt-2 text-4xl font-bold md:text-5xl">Account</h1>
    <div className="glass-strong mt-8 rounded-[22px] p-5 sm:p-7">
      <div className="flex items-center gap-3"><UserRound className="size-5 text-primary" aria-hidden="true" /><h2 className="text-xl font-semibold">Personal details</h2></div>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-sm text-muted-foreground">Full name</dt><dd className="mt-1 break-words font-medium">{typeof name === "string" ? name : "ScamGuard user"}</dd></div>
        <div className="min-w-0"><dt className="text-sm text-muted-foreground">Email</dt><dd className="mt-1 break-all font-medium">{user.email}</dd></div>
      </dl>
    </div>
    <section className="mt-10 border-t border-high/25 pt-7">
      <h2 className="text-xl font-semibold text-high">Danger zone</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">Deleting your account permanently removes your saved scan history and access to this account. This cannot be undone.</p>
      <div className="mt-5"><DeleteAccountDialog onDelete={removeAccount} /></div>
    </section>
  </main>;
}