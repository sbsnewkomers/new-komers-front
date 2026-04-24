import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { SavedMapping } from "./types";
import { BookMarked, Plus } from "lucide-react";
import { MappingTemplateList } from "./mapping/MappingTemplateList";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappings: SavedMapping[];
  onSelect: (mapping: SavedMapping) => void;
  onNewMapping: () => void;
}

export function MappingSelectorModal({
  open,
  onOpenChange,
  mappings,
  onSelect,
  onNewMapping,
}: Props) {
  const showSearch = mappings.length > 6;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookMarked className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle>Choisir un modèle de mapping</DialogTitle>
              <DialogDescription>
                Sélectionnez un modèle pour l&apos;appliquer à votre fichier, ou
                créez-en un nouveau.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="bg-slate-50/40">
          <MappingTemplateList
            mappings={mappings}
            onSelect={(m) => {
              onSelect(m);
              onOpenChange(false);
            }}
            showSearch={showSearch}
            showScopeFilter={mappings.length > 0}
            emptyMessage="Aucun modèle enregistré pour l’instant."
          />
        </DialogBody>

        <DialogFooter className="flex-wrap sm:justify-between">
          <Button
            variant="ghost"
            onClick={onNewMapping}
            className="text-slate-600 hover:text-primary"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Créer un nouveau mapping
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
