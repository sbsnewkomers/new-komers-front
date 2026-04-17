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
          <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
            <div className="rounded-lg bg-amber-50 p-1.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            ATTENTION
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-slate-600">
            Cette action est irréversible. Les données existantes pour cette période
            seront remplacées par le contenu du fichier importé. Pour confirmer,
            saisissez{" "}
            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono font-bold text-amber-700">
              REMPLACER
            </span>{" "}
            ci-dessous.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder="Saisir REMPLACER"
          value={confirmInput}
          onChange={(e) => onConfirmInputChange(e.target.value)}
          className="mt-4"
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
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Confirmer l&apos;import
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}