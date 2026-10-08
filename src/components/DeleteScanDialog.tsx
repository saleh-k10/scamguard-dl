import { useRef, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteScanDialog({ onDelete }: { onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const changeOpen = (next: boolean) => { if (!pending.current) { setOpen(next); setError(""); } };
  const remove = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await onDelete(); setOpen(false); }
    catch { setError("We couldn't confirm deletion. The scan may no longer be available. Check your connection and try again."); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-high" aria-label="Delete saved scan" title="Delete saved scan"><Trash2 aria-hidden="true" /></Button></DialogTrigger>
    <DialogContent className="max-w-[calc(100%-2rem)] rounded-[22px] bg-popover sm:max-w-md" onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onInteractOutside={(e) => { if (busy) e.preventDefault(); }}>
      <DialogHeader><DialogTitle>Delete this saved scan?</DialogTitle><DialogDescription className="mt-2 leading-relaxed">This permanently removes this scan from your history. Your account and other scans will not be affected.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm leading-relaxed text-high">{error}</p>}
      <DialogFooter className="gap-2"><Button variant="outline" disabled={busy} onClick={() => changeOpen(false)} className="rounded-full">Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove} className="rounded-full">{busy ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <Trash2 aria-hidden="true" />}{busy ? "Deleting…" : "Delete scan"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}