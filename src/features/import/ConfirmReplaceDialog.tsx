import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle } from "lucide-react";

interface ConfirmReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  onConfirm: () => void;
}

export function ConfirmReplaceDialog({
  open,
  onOpenChange,
  confirmInput,
  onConfirmInputChange,
  onConfirm,
}: ConfirmReplaceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/15 p-1.5">
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </div>
            ATTENTION
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-(--nebula-muted)">
            Cette action est irréversible. Les données existantes pour cette période
            seront remplacées par le contenu du fichier importé. Pour confirmer,
            saisissez{" "}
            <span className="rounded border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 font-mono font-bold text-amber-100">
              REMPLACER
            </span>{" "}
            ci-dessous.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder="Saisir REMPLACER"
          value={confirmInput}
          onChange={(e) => onConfirmInputChange(e.target.value)}
          className="mt-4 border-white/10 bg-white/5 text-white placeholder:text-(--nebula-muted)"
        />
        <AlertDialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirmInputChange("");
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={confirmInput !== "REMPLACER"}
            onClick={onConfirm}
            className="border border-amber-400/40 bg-amber-500/25 text-amber-50 hover:bg-amber-500/35 disabled:opacity-40"
          >
            Confirmer l&apos;import
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}