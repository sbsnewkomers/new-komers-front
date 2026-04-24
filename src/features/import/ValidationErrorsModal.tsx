// ValidationErrorsModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { AlertTriangle, Copy, XCircle, AlertCircle, Info } from "lucide-react";
import { ValidationError } from './types';
import { useState } from "react";

interface ValidationErrorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationError[];
}

export function ValidationErrorsModal({ open, onOpenChange, errors }: ValidationErrorsModalProps) {
  const [copied, setCopied] = useState(false);

  const getErrorIcon = (reason: string) => {
    const msg = reason.toLowerCase();
    if (msg.includes('obligatoire') || msg.includes('required') || msg.includes('manquant') || msg.includes('bloqué')) {
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />;
    }
    if (msg.includes('format') || msg.includes('invalide') || msg.includes('incorrect')) {
      return <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />;
    }
    return <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />;
  };

  const copyErrorsToClipboard = () => {
    const errorText = errors.map(e => {
      return `Ligne ${e.line}: ${e.reason}\n   Colonne: ${e.column}\n   Valeur reçue: "${e.value}"\n`;
    }).join('\n---\n');
    
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Grouper les erreurs par ligne
  const groupErrorsByLine = () => {
    const grouped: { [key: number]: ValidationError[] } = {};
    errors.forEach(error => {
      const line = error.line || 0;
      if (!grouped[line]) {
        grouped[line] = [];
      }
      grouped[line].push(error);
    });
    return grouped;
  };

  const groupedErrors = groupErrorsByLine();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <div className="rounded-lg bg-red-50 p-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            Erreurs de validation
            {errors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-500">
                ({errors.length} erreur{errors.length > 1 ? 's' : ''})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          {errors.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucune erreur à afficher
            </div>
          ) : (
            <div className="space-y-4">
              {/* Résumé des erreurs */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">
                  {errors.length} erreur(s) trouvée(s)
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Veuillez corriger ces erreurs avant de réimporter
                </p>
              </div>

              {/* Tableau des erreurs */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="min-w-[80px] font-semibold">Ligne</TableHead>
                      <TableHead className="min-w-[140px] font-semibold">Colonne</TableHead>
                      <TableHead className="min-w-[180px] font-semibold">Valeur reçue</TableHead>
                      <TableHead className="font-semibold" colSpan={2}>Raison / Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.map((error, idx) => (
                      <TableRow key={idx} className="hover:bg-red-50/50">
                        <TableCell className="font-mono text-red-600 align-top">
                          {error.line}
                        </TableCell>
                        <TableCell className="font-medium text-gray-700 align-top">
                          {error.column}
                        </TableCell>
                        <TableCell className="align-top">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">
                            {error.value || "(vide)"}
                          </code>
                        </TableCell>
                        <TableCell className="text-red-600 align-top" colSpan={2}>
                          <div className="flex gap-2">
                            {/* {getErrorIcon(error.reason)} */}
                            <span>{error.reason}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Avertissement si beaucoup d'erreurs */}
              {errors.length > 20 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-xs">
                    ⚠️ Plus de 20 erreurs détectées. Les 20 premières sont affichées.
                    Corrigez d'abord les premières erreurs et réessayez.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {errors.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyErrorsToClipboard}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copié !" : "Copier les erreurs"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}