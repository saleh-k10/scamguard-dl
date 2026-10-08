import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const PASSWORD_RESET_URL = "https://scamguard-dl.lovable.app/reset-password";
export const recoveryEmailSchema = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(255, "Email is too long.");
export const newPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Use no more than 128 characters."),
  confirmation: z.string().min(1, "Confirm your new password."),
}).refine((input) => input.password === input.confirmation, { path: ["confirmation"], message: "Passwords don't match." });

const MARKER = "scamguard-password-recovery";
const MAX_RECOVERY_AGE = 15 * 60_000;

// A normal signed-in session alone never unlocks this form.
export function beginPasswordRecovery() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get("code");
  const implicitRecovery = hash.get("type") === "recovery" && !!hash.get("access_token") && !!hash.get("refresh_token");
  let recoveryEvent = false;
  let cancelled = false;
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") recoveryEvent = true;
  });
  const promise = (async () => {
    if (params.has("error") || hash.has("error") || params.has("error_description") || hash.has("error_description")) throw new Error("Invalid recovery link");
    // Wait for Auth's automatic URL processing before explicitly exchanging a code.
    const current = await supabase.auth.getSession();
    if (current.error) throw new Error("Recovery unavailable");
    let proven = recoveryEvent || (implicitRecovery && !!current.data.session);
    if (code && !proven) {
      const exchanged = await supabase.auth.exchangeCodeForSession(code);
      if (exchanged.error || !exchanged.data.session) throw new Error("Invalid recovery code");
      proven = true;
    }
    const verified = await supabase.auth.getUser();
    if (verified.error || !verified.data.user || cancelled) throw new Error("Recovery unavailable");
    const userId = verified.data.user.id;
    if (!proven && !code && !implicitRecovery) {
      try {
        const stored = JSON.parse(sessionStorage.getItem(MARKER) || "null");
        proven = stored?.userId === userId && typeof stored?.at === "number" && Date.now() - stored.at >= 0 && Date.now() - stored.at < MAX_RECOVERY_AGE;
      } catch { proven = false; }
    }
    if (!proven) throw new Error("A recovery link is required");
    try { sessionStorage.setItem(MARKER, JSON.stringify({ userId, at: Date.now() })); } catch { /* Reload simply requires a fresh link. */ }
  })();
  return { promise, cancel: () => { cancelled = true; data.subscription.unsubscribe(); } };
}

export function clearPasswordRecovery() {
  try { sessionStorage.removeItem(MARKER); } catch { /* Storage may be unavailable. */ }
}