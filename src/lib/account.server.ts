import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type DeleteAccountResult = { success: true } | { success: false; error: string };

// The target is always resolved by Auth, never supplied by the caller.
export async function deleteOwnAccount(authorization: string | undefined): Promise<DeleteAccountResult> {
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return { success: false, error: "Please log in again before deleting your account." };
  let scansRemoved = false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return await deleteValidatedAccount(supabaseAdmin, token, () => { scansRemoved = true; });
  } catch {
    return { success: false, error: scansRemoved
      ? "Your scan history was removed, but account deletion could not be confirmed. Please log in again and try deleting your account once more."
      : "We couldn't delete your account. No account deletion was completed. Please try again shortly." };
  }
}

async function deleteValidatedAccount(admin: SupabaseClient<Database>, token: string, onScansRemoved: () => void): Promise<DeleteAccountResult> {
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { success: false, error: "Your session has expired. Please log in again before deleting your account." };
  const userId = data.user.id;
  const { error: scanError } = await admin.from("scans").delete().eq("user_id", userId);
  if (scanError) return { success: false, error: "We couldn't remove your scan history, so your account has not been deleted. Please try again shortly." };
  onScansRemoved();
  const { error: accountError } = await admin.auth.admin.deleteUser(userId);
  if (accountError) return { success: false, error: "Your scan history was removed, but your account could not be deleted. Please try again shortly." };
  return { success: true };
}