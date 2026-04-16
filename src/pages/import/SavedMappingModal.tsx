// pages/import/SavedMappingModal.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import { SavedMapping } from "./types";
import { BookMarked, CheckCircle2, Clock, Loader2, PlusCircle } from "lucide-react";

interface SavedMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onSelectMapping: (mapping: SavedMapping) => void;
  onCreateNew: () => void; // ouvre le MappingModal classique
}

export function SavedMappingModal({
  open,
  onOpenChange,
  fileName,
  onSelectMapping,
  onCreateNew,
}: SavedMappingModalProps) {
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setLoading(true);
    apiFetch<SavedMapping[]>("/mapping-templates/user/me", {
      snackbar: { showSuccess: false, showError: false },
    })
      .then((data) => setSavedMappings(data ?? []))
      .catch(() => setSavedMappings([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleConfirm = () => {
    const chosen = savedMappings.find((m) => m.id === selectedId);
    if (!chosen) return;
    onSelectMapping(chosen);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-5 w-5 text-primary" />
            Choisir un mapping sauvegardé
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-500 -mt-1 mb-3">
          Fichier : <span className="font-medium text-slate-700">{fileName}</span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des mappings…
          </div>
        ) : savedMappings.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Aucun mapping sauvegardé trouvé.
          </div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {savedMappings.map((m) => (
              <li
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                  selectedId === m.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookMarked
                    className={`h-4 w-4 shrink-0 ${
                      selectedId === m.id ? "text-primary" : "text-slate-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                    {m.createdAt && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
                {selectedId === m.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between items-center pt-2 border-t mt-2">
          <Button
            variant="ghost"
            className="gap-2 text-sm text-slate-500"
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Créer un nouveau mapping
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedId}>
              Utiliser ce mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}