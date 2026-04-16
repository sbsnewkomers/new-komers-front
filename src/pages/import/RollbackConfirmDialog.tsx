import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { RotateCcw } from "lucide-react";
import { ImportHistoryRow } from './types';

interface RollbackConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ImportHistoryRow | null;
  onConfirm: () => void;
}

export function RollbackConfirmDialog({ open, onOpenChange, target, onConfirm }: RollbackConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
            <div className="rounded-lg bg-amber-50 p-1.5">
              <RotateCcw className="h-5 w-5 text-amber-600" />
            </div>
            Confirmer le rollback
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-slate-600">
            Vous êtes sur le point d&apos;annuler l&apos;import du fichier{" "}
            <span className="font-semibold text-slate-700">
              {target?.file}
            </span>{" "}
            du {target?.date}. Cette action restaurera les données précédentes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
            onClick={onConfirm}
          >
            <RotateCcw className="h-4 w-4" />
            Confirmer le rollback
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}