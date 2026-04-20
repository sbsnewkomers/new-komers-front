// pages/import/SavedMappingModal.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import { SavedMapping } from "./types";
import {
  BookMarked, CheckCircle2, Clock, Globe, FolderOpen,
  Loader2, Database, Settings2, Trash2,
} from "lucide-react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

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
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [localMappings, setLocalMappings] = useState<SavedMapping[]>([]);
  const [globalMappings, setGlobalMappings] = useState<SavedMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setActiveTab('local');
    setLoading(true);

    const fetchLocal = async (): Promise<SavedMapping[]> => {
      // workspaceId connu → fetch direct
      if (workspaceId) {
        return apiFetch<SavedMapping[]>(`/mapping-templates/workspace/${workspaceId}`, {
          snackbar: { showSuccess: false, showError: false },
        });
      }
      // non-admin sans entité sélectionnée → fetch via my-workspaces
      if (!isAdmin) {
        const wsList = await apiFetch<{ id: string; name: string }[]>(
          '/mapping-templates/my-workspaces',
          { snackbar: { showSuccess: false, showError: false } }
        );
        if (!wsList?.length) return [];
        const results = await Promise.all(
          wsList.map(ws =>
            apiFetch<SavedMapping[]>(
              `/mapping-templates/workspace/${ws.id}`,
              { snackbar: { showSuccess: false, showError: false } }
            ).catch(() => [] as SavedMapping[])
          )
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
        // Auto-switch sur l'onglet qui a des données
        if (!local?.length && global?.length) setActiveTab('global');
      })
      .finally(() => setLoading(false));
  }, [open, workspaceId, isAdmin]);

  const displayedMappings = activeTab === 'local' ? localMappings : globalMappings;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, m: SavedMapping) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le mapping "${m.name}" ?`)) return;
    setDeletingId(m.id);
    try {
      await apiFetch(`/mapping-templates/${m.id}`, {
        method: 'DELETE',
        snackbar: { showSuccess: true, showError: true, successMessage: `✅ Mapping supprimé` },
      });
      if (activeTab === 'local') {
        setLocalMappings(prev => prev.filter(x => x.id !== m.id));
      } else {
        setGlobalMappings(prev => prev.filter(x => x.id !== m.id));
      }
      if (selectedId === m.id) setSelectedId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirm = () => {
    const allMappings = [...localMappings, ...globalMappings];
    const chosen = allMappings.find((m) => m.id === selectedId);
    if (!chosen) return;
    onSelectMapping(chosen);
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNew();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-5 w-5 text-primary" />
            Choisir un mapping
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-500 -mt-1 mb-4">
          Fichier :{" "}
          <span className="font-medium text-slate-700">{fileName}</span>
        </p>

        {/* ── Onglets Local / Global ── */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'local'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Locaux
            {localMappings.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                {localMappings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'global'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Globaux
            {globalMappings.length > 0 && (
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full">
                {globalMappings.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Contenu ── */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des mappings…
          </div>
        ) : displayedMappings.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
              <Database className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm">Aucun mapping {activeTab === 'local' ? 'local' : 'global'} trouvé</p>
            <p className="text-xs mt-1">
              {activeTab === 'local'
                ? 'Configurez un mapping et enregistrez-le pour le réutiliser'
                : 'Aucun mapping partagé disponible sur la plateforme'}
            </p>
          </div>
        ) : (
          <ul className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {displayedMappings.map((m) => (
              <li
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                  selectedId === m.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookMarked
                    className={`h-4 w-4 shrink-0 ${
                      selectedId === m.id ? 'text-primary' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {m.createdAt && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {Object.keys(m.rules).length} champs
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                {selectedId === m.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                {(() => {
                  const isGlobal = !m.workspaceId || m.scope === 'GLOBAL';
                  const canDelete = isGlobal
                    ? isAdmin
                    : (
                        isAdmin ||
                        currentUser?.role === 'HEAD_MANAGER' ||
                        (currentUser?.role === 'MANAGER' && m.createdBy === currentUser?.id)
                      );
                  return canDelete ? (
                    <button
                      onClick={(e) => handleDelete(e, m)}
                      disabled={deletingId === m.id}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Supprimer ce mapping"
                    >
                      {deletingId === m.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  ) : null;
                })()}
              </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Footer ── */}
        <div className="flex justify-between items-center pt-3 border-t mt-2">
          {/* Bouton configurer nouveau mapping */}
          <Button
            variant="ghost"
            className="gap-2 text-sm text-slate-500 hover:text-primary"
            onClick={handleCreateNew}
          >
            <Settings2 className="h-4 w-4" />
            Configurer un nouveau mapping
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={!selectedId}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Utiliser ce mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}