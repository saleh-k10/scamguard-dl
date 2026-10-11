import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Gate user whose session ended (sign-out or switch, possibly in another tab).
  const [endedFor, setEndedFor] = useState<string | null>(null);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      if (id === user.id) return;
      // Sign-out or a different user: unmount private pages (dropping their
      // state and any in-flight reads), clear cache, and re-run the gate.
      setEndedFor(user.id);
      queryClient.clear();
      void router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [user.id, queryClient, router]);
  if (endedFor === user.id) return null;
  return <Outlet key={user.id} />;
}
