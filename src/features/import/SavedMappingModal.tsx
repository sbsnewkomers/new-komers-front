import { useEffect, useMemo, useState } from "react";
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
import { apiFetch } from "@/lib/apiClient";
import type { SavedMapping } from "./types";
import { BookMarked, CheckCircle2, Plus } from "lucide-react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { canDeleteMapping, isGlobalMapping } from "./MappingUtils";
import { MappingTemplateList } from "./mapping/MappingTemplateList";
import { DeleteMappingConfirm } from "./mapping/DeleteMappingConfirm";

interface SavedMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onSelectMapping: (mapping: SavedMapping) => void;
  onCreateNew: () => void;
  workspaceId?: string | null;
}

export function SavedMappingModal({
  open,
  onOpenChange,
  fileName,
  onSelectMapping,
  onCreateNew,
  workspaceId,
}: SavedMappingModalProps) {
  const { user: currentUser } = usePermissionsContext();
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [localMappings, setLocalMappings] = useState<SavedMapping[]>([]);
  const [globalMappings, setGlobalMappings] = useState<SavedMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mappingToDelete, setMappingToDelete] = useState<SavedMapping | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setLoading(true);

    const fetchLocal = async (): Promise<SavedMapping[]> => {
      if (workspaceId) {
        return apiFetch<SavedMapping[]>(
          `/mapping-templates/workspace/${workspaceId}`,
          { snackbar: { showSuccess: false, showError: false } },
        );
      }
      if (!isAdmin) {
        const wsList = await apiFetch<{ id: string; name: string }[]>(
          "/mapping-templates/my-workspaces",
          { snackbar: { showSuccess: false, showError: false } },
        );
        if (!wsList?.length) return [];
        const results = await Promise.all(
          wsList.map((ws) =>
            apiFetch<SavedMapping[]>(
              `/mapping-templates/workspace/${ws.id}`,
              { snackbar: { showSuccess: false, showError: false } },
            ).catch(() => [] as SavedMapping[]),
          ),
        );
        return results.flat();
      }
      return [];
    };

    Promise.all([
      fetchLocal().catch(() => [] as SavedMapping[]),
      apiFetch<SavedMapping[]>(`/mapping-templates/global`, {
        snackbar: { showSuccess: false, showError: false },
      }).catch(() => [] as SavedMapping[]),
    ])
      .then(([local, global]) => {
        setLocalMappings(local ?? []);
        setGlobalMappings(global ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, workspaceId, isAdmin]);

  const allMappings = useMemo(
    () => [...localMappings, ...globalMappings],
    [localMappings, globalMappings],
  );

  const defaultScope = useMemo(() => {
    if (localMappings.length === 0 && globalMappings.length > 0) return "global";
    return "all";
  }, [localMappings.length, globalMappings.length]);

  const handleConfirm = () => {
    const chosen = allMappings.find((m) => m.id === selectedId);
    if (!chosen) return;
    onSelectMapping(chosen);
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNew();
  };

  const confirmDelete = async () => {
    if (!mappingToDelete) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/mapping-templates/${mappingToDelete.id}`, {
        method: "DELETE",
        snackbar: {
          showSuccess: true,
          showError: true,
          successMessage: `Mapping "${mappingToDelete.name}" supprimé`,
        },
      });
      if (isGlobalMapping(mappingToDelete)) {
        setGlobalMappings((prev) =>
          prev.filter((x) => x.id !== mappingToDelete.id),
        );
      } else {
        setLocalMappings((prev) =>
          prev.filter((x) => x.id !== mappingToDelete.id),
        );
      }
      if (selectedId === mappingToDelete.id) setSelectedId(null);
      setMappingToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookMarked className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <DialogTitle>Choisir un mapping</DialogTitle>
                <DialogDescription>
                  Fichier&nbsp;:{" "}
                  <span className="font-medium text-slate-700">
                    {fileName || "—"}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="bg-slate-50/40">
            <MappingTemplateList
              mappings={allMappings}
              loading={loading}
              onSelect={(m) => setSelectedId(m.id)}
              onDelete={(m) => setMappingToDelete(m)}
              canDelete={(m) => canDeleteMapping(m, currentUser)}
              selectedId={selectedId ?? undefined}
              defaultScope={defaultScope}
              emptyMessage="Aucun mapping enregistré pour l’instant."
            />
          </DialogBody>

          <DialogFooter className="flex-wrap sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleCreateNew}
              className="text-slate-600 hover:text-primary"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Configurer un nouveau mapping
            </Button>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedId}>
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                Utiliser ce mapping
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteMappingConfirm
        open={Boolean(mappingToDelete)}
        onOpenChange={(v) => {
          if (!v) setMappingToDelete(null);
        }}
        mappingName={mappingToDelete?.name}
        isGlobal={
          mappingToDelete ? isGlobalMapping(mappingToDelete) : undefined
        }
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
