import { useRef, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = { onDelete: () => Promise<{ success: true } | { success: false; error: string }> };

export function DeleteAccountDialog({ onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const changeOpen = (next: boolean) => {
    if (pending.current) return;
    setOpen(next); setConfirmation(""); setError("");
  };
  const submit = async () => {
    if (confirmation !== "DELETE" || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await onDelete();
      if (!result.success) setError(result.error);
    } catch {
      setError("We couldn't confirm account deletion. Check your connection, then log in again before trying once more.");
    } finally { pending.current = false; setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button variant="destructive" className="rounded-full"><Trash2 aria-hidden="true" />Delete account</Button></DialogTrigger>
    <DialogContent className="max-w-[calc(100%-2rem)] rounded-[22px] bg-popover sm:max-w-lg" onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogDescription className="mt-2 leading-relaxed">This permanently deletes your ScamGuard account and all saved scans. This cannot be undone.</DialogDescription>
      </DialogHeader>
      <div>
        <label htmlFor="delete-confirmation" className="block text-sm font-medium">Type DELETE to confirm</label>
        <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-lg border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
      </div>
      {error && <p role="alert" className="text-sm leading-relaxed text-high">{error}</p>}
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={busy} onClick={() => changeOpen(false)} className="rounded-full">Cancel</Button>
        <Button variant="destructive" disabled={confirmation !== "DELETE" || busy} onClick={submit} className="rounded-full">
          {busy ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
          {busy ? "Deleting…" : "Permanently delete account"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}