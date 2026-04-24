import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface DeleteMappingConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappingName?: string;
  isGlobal?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteMappingConfirm({
  open,
  onOpenChange,
  mappingName,
  isGlobal,
  loading,
  onConfirm,
}: DeleteMappingConfirmProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <AlertDialogTitle>Supprimer ce mapping ?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {mappingName ? (
              <>
                Le mapping{" "}
                <span className="font-medium text-slate-900">
                  « {mappingName} »
                </span>{" "}
                sera supprimé définitivement.
              </>
            ) : (
              <>Ce mapping sera supprimé définitivement.</>
            )}
            {isGlobal ? (
              <>
                {" "}
                Il s’agit d’un mapping <strong>global</strong>, visible par
                tous les espaces.
              </>
            ) : null}{" "}
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Suppression…
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
