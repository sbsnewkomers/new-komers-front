// MappingSelectorModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { SavedMapping } from "./types";
import { Database, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappings: SavedMapping[];
  onSelect: (mapping: SavedMapping) => void;
  onNewMapping: () => void;
}

export function MappingSelectorModal({ open, onOpenChange, mappings, onSelect, onNewMapping }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir un modèle de mapping</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {mappings.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              className="flex justify-between items-center h-auto py-4 px-4 hover:border-primary"
              onClick={() => onSelect(m)}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold">{m.name}</span>
                <span className="text-xs text-slate-500">{Object.keys(m.rules).length} colonnes configurées</span>
              </div>
              <Database className="h-4 w-4 text-slate-400" />
            </Button>
          ))}
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase text-slate-500">
              <span className="bg-white px-2">Ou</span>
            </div>
          </div>

          <Button variant="ghost" className="gap-2 border-dashed border-2 h-12" onClick={onNewMapping}>
            <Plus className="h-4 w-4" />
            Créer un nouveau mapping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}