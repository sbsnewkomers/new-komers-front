import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2, ArrowRight, Sparkles, FileUp, Loader2, Search,
  AlertCircle, Filter, Database, Clock, Upload, PenTool,
  FolderOpen, Eye, Save, Globe, Trash2,
} from "lucide-react";
import { Basic_COLUMNS } from "./constants";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/apiClient";
import { SavedMapping } from "./types";
import { cleanMapping } from './MappingUtils';
import { Card, CardContent } from "@/components/ui/Card";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

interface MappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onValidateMapping: (mapping?: Record<string, string>) => void;
  onImport?: () => void;
  isSubmitting: boolean;
  entityId?: string | null;
  entityType?: 'Group' | 'Company' | null;
  showImportButton?: boolean;
  onFileUpload?: (file: File) => void;
  workspaceId?: string | null;
}

type ConfigMode = 'file' | 'local' | 'global';
type DetailMode = "view" | "edit";

// ─────────────────────────────────────────────────────────────
// Sous-composant : panneau liste de mappings
// ─────────────────────────────────────────────────────────────
interface MappingListPanelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  mappings: SavedMapping[];
  isLoading: boolean;
  blocked?: boolean;
  blockedMessage?: string;
  onView: (m: SavedMapping) => void;
  formatDate: (d: string) => string;
  // workspace selector dans le panneau lui-même
  showWorkspaceSelector?: boolean;
  accessibleWorkspaces?: { id: string; name: string }[];
  selectedWorkspaceId?: string | null;
  onSelectWorkspace?: (id: string) => void;
  onDelete: (m: SavedMapping) => void;
  currentUserId?: string;
  userRole?: string;
}

function MappingListPanel({
  title,
  subtitle,
  icon,
  mappings,
  isLoading,
  blocked = false,
  blockedMessage,
  onView,
  formatDate,
  showWorkspaceSelector = false,
  accessibleWorkspaces = [],
  selectedWorkspaceId,
  onSelectWorkspace,
  onDelete,
  currentUserId,
  userRole,
}: MappingListPanelProps) {
  if (blocked) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center py-8 px-6">
          <div className="inline-flex p-3 rounded-full bg-amber-50 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">{blockedMessage ?? "Accès restreint"}</p>
          <p className="text-xs text-slate-400 mt-1">
            Sélectionnez d'abord une entité (Groupe ou Entreprise)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
      {/* Sélecteur de workspace TOUJOURS affiché si showWorkspaceSelector=true */}
      {showWorkspaceSelector && accessibleWorkspaces.length > 0 && (
        <div className="flex-shrink-0 p-3 border-b border-slate-100 bg-slate-50">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Choisir un workspace
          </label>
          <select
            value={selectedWorkspaceId ?? ""}
            onChange={(e) => onSelectWorkspace?.(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">— Sélectionner un workspace —</option>
            {accessibleWorkspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          {selectedWorkspaceId && (
            <p className="text-[10px] text-slate-400 mt-1">
              Sélectionnez un autre workspace pour changer l'affichage
            </p>
          )}
        </div>
      )}

      <div className="flex-shrink-0 p-3 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {showWorkspaceSelector && !selectedWorkspaceId ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
                <FolderOpen className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Sélectionnez un workspace</p>
              <p className="text-xs text-slate-400 mt-1">
                Choisissez un workspace ci-dessus pour voir ses mappings
              </p>
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
                <Database className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Aucun mapping trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Configurez un mapping et enregistrez-le pour le réutiliser
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mappings.map((m) => (
                <Card
                  key={m.id}
                  className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-primary/30"
                  onClick={() => onView(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(m); }
                  }}
                  aria-label={`Voir les détails du mapping ${m.name}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-3.5 w-3.5 text-primary/60" />
                          <h3 className="text-sm font-semibold text-slate-800 truncate">{m.name}</h3>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(m.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {Object.keys(m.rules).length} champs mappés
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        {(() => {
                          const isGlobal = !m.workspaceId || m.scope === 'GLOBAL';
                          const canDelete = isGlobal
                            ? (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN')
                            : (
                                userRole === 'SUPER_ADMIN' ||
                                userRole === 'ADMIN' ||
                                userRole === 'HEAD_MANAGER' ||
                                (userRole === 'MANAGER' && m.createdBy === currentUserId)
                              );
                          return canDelete ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(m); }}
                              className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                              title="Supprimer ce mapping"
                              aria-label={`Supprimer ${m.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toggle Local / Global
// ─────────────────────────────────────────────────────────────
interface ScopeToggleProps {
  scope: 'LOCAL' | 'GLOBAL';
  onChange: (scope: 'LOCAL' | 'GLOBAL') => void;
  disabled?: boolean;
}

function ScopeToggle({ scope, onChange, disabled }: ScopeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('GLOBAL')}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          scope === 'GLOBAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Globe className="h-3 w-3" />
        Global
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('LOCAL')}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          scope === 'LOCAL' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <FolderOpen className="h-3 w-3" />
        Local
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Select workspace inline
// ─────────────────────────────────────────────────────────────
interface WorkspaceSelectorInlineProps {
  workspaces: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string) => void;
  isLoading?: boolean;
}

function WorkspaceSelectorInline({ workspaces, value, onChange, isLoading }: WorkspaceSelectorInlineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Chargement...
      </div>
    );
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[200px]"
    >
      <option value="">— Choisir un workspace —</option>
      {workspaces.map(ws => (
        <option key={ws.id} value={ws.id}>{ws.name}</option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : modale de détail / édition d'un mapping
// ─────────────────────────────────────────────────────────────
interface MappingDetailModalProps {
  showMappingDetail: boolean;
  setShowMappingDetail: (v: boolean) => void;
  selectedSavedMapping: SavedMapping | null;
  detailMode: DetailMode;
  setDetailMode: (v: DetailMode) => void;
  editSavedMapping: Record<string, string>;
  setEditSavedMapping: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  originalEditMapping: Record<string, string>;
  isMappingChanged: boolean;
  isEditValid: boolean;
  formatDate: (d: string) => string;
  handleSaveAsNewMapping: () => void;
  newMappingName: string;
  setNewMappingName: (v: string) => void;
  isSaving: boolean;
  isAdmin: boolean;
  saveAsNewScope: 'LOCAL' | 'GLOBAL';
  setSaveAsNewScope: (v: 'LOCAL' | 'GLOBAL') => void;
  accessibleWorkspaces: { id: string; name: string }[];
  saveAsNewWorkspaceId: string | null;
  setSaveAsNewWorkspaceId: (id: string) => void;
  isLoadingWorkspaces?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
}

function MappingDetailModal({
  showMappingDetail,
  setShowMappingDetail,
  selectedSavedMapping,
  detailMode,
  setDetailMode,
  editSavedMapping,
  setEditSavedMapping,
  originalEditMapping,
  isMappingChanged,
  isEditValid,
  formatDate,
  handleSaveAsNewMapping,
  newMappingName,
  setNewMappingName,
  isSaving,
  isAdmin,
  saveAsNewScope,
  setSaveAsNewScope,
  accessibleWorkspaces,
  saveAsNewWorkspaceId,
  setSaveAsNewWorkspaceId,
  isLoadingWorkspaces,
  successMessage,
  errorMessage,
}: MappingDetailModalProps) {
  return (
    <Dialog open={showMappingDetail} onOpenChange={setShowMappingDetail}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col bg-white rounded-xl overflow-hidden">

        {/* Messages feedback en haut de la modale détail */}
        {errorMessage && (
          <div className="flex-shrink-0 mx-4 mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />{errorMessage}
            </p>
          </div>
        )}
        {successMessage && (
          <div className="flex-shrink-0 mx-4 mt-4 p-3 bg-emerald-500 rounded-lg shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0 bg-white/20 rounded-full p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">{successMessage}</p>
              <p className="text-[10px] text-emerald-100 mt-0.5">La fenêtre va se fermer automatiquement...</p>
            </div>
            <div className="flex-shrink-0">
              <Loader2 className="h-3.5 w-3.5 text-white/70 animate-spin" />
            </div>
          </div>
        )}
        <DialogHeader className="p-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-800">
                  {detailMode === "edit" ? "Modifier le mapping" : "Détail du mapping"}
                </DialogTitle>
                <p className="text-xs text-slate-500">{selectedSavedMapping?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {detailMode === "view" && (
                <Button size="sm" onClick={() => setDetailMode("edit")}>
                  <PenTool className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              )}
              {detailMode === "edit" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailMode("view");
                    setEditSavedMapping(originalEditMapping);
                    setNewMappingName("");
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
          {selectedSavedMapping && (
            <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
              <span>Créé le : <span className="text-slate-700">{formatDate(selectedSavedMapping.createdAt)}</span></span>
              <span>Modifié le : <span className="text-slate-700">{formatDate(selectedSavedMapping.updatedAt)}</span></span>
            </div>
          )}
        </DialogHeader>

        {detailMode === "edit" && (
          <div className="flex-shrink-0 p-4 border-b bg-white space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom du nouveau mapping <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newMappingName}
                onChange={(e) => setNewMappingName(e.target.value)}
                placeholder="Ex: Mapping fournisseur A - Mars 2024"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              {!newMappingName.trim() && (
                <p className="text-[10px] text-amber-600 mt-1">Un nom est requis pour enregistrer ce mapping</p>
              )}
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600">Scope :</span>
                  <ScopeToggle scope={saveAsNewScope} onChange={setSaveAsNewScope} />
                  <span className="text-[10px] text-slate-400">
                    {saveAsNewScope === 'GLOBAL'
                      ? 'Partagé sur toute la plateforme (aucun workspace requis)'
                      : 'Lié à un workspace spécifique'}
                  </span>
                </div>

                {saveAsNewScope === 'LOCAL' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-600">
                      Workspace <span className="text-red-500">*</span> :
                    </span>
                    <WorkspaceSelectorInline
                      workspaces={accessibleWorkspaces}
                      value={saveAsNewWorkspaceId}
                      onChange={setSaveAsNewWorkspaceId}
                      isLoading={isLoadingWorkspaces}
                    />
                    {!saveAsNewWorkspaceId && (
                      <p className="text-[10px] text-amber-600">Un workspace est requis pour un mapping local</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-shrink-0 grid grid-cols-2 gap-0 border-b border-slate-100">
          <div className="px-4 py-2 bg-slate-50 border-r border-slate-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileUp className="h-3 w-3" />
              Colonne du fichier
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-50">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              Champ base de données
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedSavedMapping && (
            <div className="divide-y divide-slate-100">
              {Basic_COLUMNS.map((col) => {
                const sourceValue = editSavedMapping[col.name] || "";
                const isMapped = !!sourceValue;
                return (
                  <div
                    key={col.name}
                    className={`grid grid-cols-2 gap-0 transition-colors ${isMapped ? "bg-emerald-50/30" : "bg-white"}`}
                  >
                    <div className="px-4 py-2.5 border-r border-slate-100 flex items-center">
                      {detailMode === "edit" ? (
                        <input
                          type="text"
                          value={sourceValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[<>"']/g, '');
                            setEditSavedMapping(prev => ({ ...prev, [col.name]: val }));
                          }}
                          placeholder="Nom de la colonne..."
                          className={`w-full px-2.5 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                            isMapped
                              ? "border-emerald-200 bg-white text-emerald-700 placeholder:text-emerald-300"
                              : "border-slate-200 bg-white text-slate-600 placeholder:text-slate-300"
                          }`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {isMapped
                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            : <div className="h-3 w-3 rounded-full border-2 border-slate-200 flex-shrink-0" />
                          }
                          <span className={`text-xs ${isMapped ? "text-emerald-700 font-medium" : "text-slate-400 italic"}`}>
                            {isMapped ? sourceValue : "Non configuré"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2.5 flex items-center gap-2">
                      <ArrowRight className={`h-3 w-3 flex-shrink-0 ${isMapped ? "text-emerald-400" : "text-slate-300"}`} />
                      {detailMode === "edit" ? (
                        <select
                          value={col.name}
                          onChange={(e) => {
                            const newDbField = e.target.value;
                            setEditSavedMapping(prev => {
                              const next = { ...prev };
                              const currentSource = next[col.name] || "";
                              delete next[col.name];
                              if (newDbField) next[newDbField] = currentSource;
                              return next;
                            });
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          <option value="">— Sélectionner —</option>
                          {Basic_COLUMNS.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}{c.required ? " *" : ""}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <span className={`text-xs font-medium flex-1 ${col.required ? "text-slate-800" : "text-slate-600"}`}>
                            {col.name}
                          </span>
                          {col.required && (
                            <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Requis
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-3 border-t bg-slate-50/50 flex justify-between items-center">
          <div className="text-[10px] text-slate-400">
            {Object.values(editSavedMapping).filter(v => v).length} / {Basic_COLUMNS.length} champs configurés
          </div>
          <div className="flex gap-2">
            {detailMode === "edit" && isMappingChanged && (
              <Button
                size="sm"
                onClick={handleSaveAsNewMapping}
                disabled={
                  !isEditValid ||
                  !newMappingName.trim() ||
                  isSaving ||
                  (isAdmin && saveAsNewScope === 'LOCAL' && !saveAsNewWorkspaceId)
                }
                className={
                  (!isEditValid || !newMappingName.trim() || isSaving ||
                  (isAdmin && saveAsNewScope === 'LOCAL' && !saveAsNewWorkspaceId))
                    ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                {isSaving
                  ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  : <Save className="h-3 w-3 mr-1" />
                }
                {isSaving ? "Enregistrement..." : "Enregistrer comme nouveau"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowMappingDetail(false)}>
              Fermer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant principal : MappingModal
// ─────────────────────────────────────────────────────────────
export function MappingModal({
  open,
  onOpenChange,
  csvHeaders,
  mapping,
  onMappingChange,
  onValidateMapping,
  onImport,
  isSubmitting,
  entityId,
  entityType,
  showImportButton = false,
  onFileUpload,
  workspaceId,
}: MappingModalProps) {
  const { user: currentUser } = usePermissionsContext();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
  const [showMappedOnly, setShowMappedOnly] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>('file');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [localMappings, setLocalMappings] = useState<SavedMapping[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  const [globalMappings, setGlobalMappings] = useState<SavedMapping[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // Workspaces accessibles
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

  // ── workspace actif pour l'onglet "Locaux" (panneau liste)
  // Ce state est LA source de vérité pour l'affichage des mappings locaux.
  // Il est synchronisé depuis :
  //   - workspaceId (prop) s'il est connu
  //   - saveWorkspaceId quand l'admin le sélectionne dans le header (mode "Par fichier")
  //   - la sélection directe dans le panneau "Locaux"
  const [activeLocalWorkspaceId, setActiveLocalWorkspaceId] = useState<string | null>(null);

  // ── workspace sélectionné pour sauvegarder (header mode fichier)
  const [saveWorkspaceId, setSaveWorkspaceId] = useState<string | null>(null);

  // ── auto-détection workspaceId pour non-admins
  const [autoDetectedWorkspaceId, setAutoDetectedWorkspaceId] = useState<string | null>(null);
  const [needsWorkspaceSelection, setNeedsWorkspaceSelection] = useState(false);

  // Détail / édition
  const [selectedSavedMapping, setSelectedSavedMapping] = useState<SavedMapping | null>(null);
  const [showMappingDetail, setShowMappingDetail] = useState(false);
  const [editSavedMapping, setEditSavedMapping] = useState<Record<string, string>>({});
  const [detailMode, setDetailMode] = useState<DetailMode>("view");
  const [originalEditMapping, setOriginalEditMapping] = useState<Record<string, string>>({});
  const [mappingDeleteError, setMappingDeleteError] = useState<{
    show: boolean;
    mappingName: string;
    details: string;
  } | null>(null);

  const [mappingName, setMappingName] = useState("");
  const [newMappingName, setNewMappingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Scope pour sauvegarde courante
  const [saveScope, setSaveScope] = useState<'LOCAL' | 'GLOBAL'>('GLOBAL');

  // Scope + workspace pour "enregistrer comme nouveau"
  const [saveAsNewScope, setSaveAsNewScope] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
  const [saveAsNewWorkspaceId, setSaveAsNewWorkspaceId] = useState<string | null>(null);

  // Ref pour éviter double-fetch
  const prevActiveLocalWorkspaceId = useRef<string | null>(null);

  // ── Fetch workspaces accessibles ──────────────────────────
  const fetchAccessibleWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const wsList = await apiFetch<{ id: string; name: string }[]>(
        '/mapping-templates/my-workspaces',
        { snackbar: { showSuccess: false, showError: false } }
      );
      setAccessibleWorkspaces(wsList ?? []);
      return wsList ?? [];
    } catch {
      setAccessibleWorkspaces([]);
      return [];
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  // ── Fetch mappings locaux pour un workspace donné ─────────
  const fetchLocalMappingsForWorkspace = useCallback(async (wsId: string) => {
    setIsLoadingLocal(true);
    try {
      const data = await apiFetch<SavedMapping[]>(
        `/mapping-templates/workspace/${wsId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      setLocalMappings(data ?? []);
    } catch {
      setLocalMappings([]);
    } finally {
      setIsLoadingLocal(false);
    }
  }, []);

  // ── Effet : re-fetch mappings locaux dès que activeLocalWorkspaceId change ──
  useEffect(() => {
    if (!open) return;
    if (activeLocalWorkspaceId && activeLocalWorkspaceId !== prevActiveLocalWorkspaceId.current) {
      prevActiveLocalWorkspaceId.current = activeLocalWorkspaceId;
      fetchLocalMappingsForWorkspace(activeLocalWorkspaceId);
    } else if (!activeLocalWorkspaceId) {
      setLocalMappings([]);
    }
  }, [activeLocalWorkspaceId, open, fetchLocalMappingsForWorkspace]);

  // ── Quand l'admin change le workspace dans le header (mode Par fichier)
  //    → synchroniser activeLocalWorkspaceId pour l'onglet Locaux
  const handleHeaderWorkspaceChange = useCallback((id: string) => {
    setSaveWorkspaceId(id || null);
    // Sync vers l'onglet Locaux
    setActiveLocalWorkspaceId(id || null);
  }, []);

  // ── Quand l'utilisateur sélectionne un workspace dans le panneau Locaux
  const handlePanelWorkspaceChange = useCallback((wsId: string) => {
    setActiveLocalWorkspaceId(wsId || null);
    // Si c'est un admin, synchroniser aussi saveWorkspaceId
    if (isAdmin) {
      setSaveWorkspaceId(wsId || null);
    }
  }, [isAdmin]);

  const fetchGlobalMappings = useCallback(async () => {
    setIsLoadingGlobal(true);
    try {
      const data = await apiFetch<SavedMapping[]>(
        `/mapping-templates/global`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      setGlobalMappings(data ?? []);
    } catch {
      setGlobalMappings([]);
    } finally {
      setIsLoadingGlobal(false);
    }
  }, []);

  // ── Auto-détection workspaceId pour non-admins ─────────────
  const autoDetectWorkspaceForNonAdmin = useCallback(async () => {
    if (isAdmin) return;

    if (workspaceId) {
      setAutoDetectedWorkspaceId(workspaceId);
      setSaveWorkspaceId(workspaceId);
      setActiveLocalWorkspaceId(workspaceId);
      setNeedsWorkspaceSelection(false);
      return;
    }

    try {
      const wsList = await apiFetch<{ id: string; name: string }[]>(
        '/mapping-templates/my-workspaces',
        { snackbar: { showSuccess: false, showError: false } }
      );

      if (wsList?.length === 1) {
        setAutoDetectedWorkspaceId(wsList[0].id);
        setSaveWorkspaceId(wsList[0].id);
        setActiveLocalWorkspaceId(wsList[0].id);
        setNeedsWorkspaceSelection(false);
        setAccessibleWorkspaces(wsList);
      } else if (wsList?.length > 1) {
        setAutoDetectedWorkspaceId(null);
        setSaveWorkspaceId(null);
        setActiveLocalWorkspaceId(null);
        setNeedsWorkspaceSelection(true);
        setAccessibleWorkspaces(wsList);
      } else {
        setAutoDetectedWorkspaceId(null);
        setSaveWorkspaceId(null);
        setActiveLocalWorkspaceId(null);
        setNeedsWorkspaceSelection(false);
      }
    } catch {
      setAutoDetectedWorkspaceId(null);
      setNeedsWorkspaceSelection(false);
    }
  }, [isAdmin, workspaceId]);

  // ── Initialisation à l'ouverture de la modale ──────────────
  useEffect(() => {
    if (open) {
      prevActiveLocalWorkspaceId.current = null;

      fetchGlobalMappings();
      setSelectedSavedMapping(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setMappingName("");
      setNewMappingName("");
      setSaveScope(isAdmin ? 'GLOBAL' : 'LOCAL');
      setSaveAsNewScope(isAdmin ? 'GLOBAL' : 'LOCAL');
      setSaveAsNewWorkspaceId(workspaceId ?? null);

      if (isAdmin) {
        fetchAccessibleWorkspaces();
        const initWs = workspaceId ?? null;
        setSaveWorkspaceId(initWs);
        setActiveLocalWorkspaceId(initWs);
        setAutoDetectedWorkspaceId(null);
        setNeedsWorkspaceSelection(false);
        if (initWs) {
          fetchLocalMappingsForWorkspace(initWs);
        } else {
          setLocalMappings([]);
        }
      } else {
        autoDetectWorkspaceForNonAdmin();
      }
    }
  }, [open, workspaceId, isAdmin]);

  const closeModal = useCallback(() => {
    onOpenChange(false);
    setShowMappingDetail(false);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [onOpenChange]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Date invalide';
    }
  }, []);

  const viewMappingDetail = useCallback((m: SavedMapping) => {
    setSelectedSavedMapping(m);
    const rules = m.rules || {};
    const fullRules: Record<string, string> = {};
    Basic_COLUMNS.forEach((col) => {
      const found = Object.keys(rules).find((csvCol) => rules[csvCol] === col.name);
      fullRules[col.name] = found || "";
    });
    setEditSavedMapping(fullRules);
    setOriginalEditMapping(fullRules);
    setDetailMode("view");
    setNewMappingName("");
    // Scope par défaut : celui du mapping ouvert (GLOBAL si global, LOCAL sinon)
    const isGlobalMapping = !m.workspaceId || m.scope === 'GLOBAL';
    setSaveAsNewScope(isAdmin ? (isGlobalMapping ? 'GLOBAL' : 'LOCAL') : 'LOCAL');
    // workspaceId : on prend celui de la prop si l'entité est sélectionnée, sinon null
    // entityId/entityType seront résolus au moment de la sauvegarde selon le contexte courant
    setSaveAsNewWorkspaceId(workspaceId ?? null);
    setShowMappingDetail(true);
  }, [workspaceId, isAdmin]);

  const isMappingChanged = useMemo(
    () => JSON.stringify(editSavedMapping) !== JSON.stringify(originalEditMapping),
    [editSavedMapping, originalEditMapping]
  );

  const isEditValid = useMemo(() => {
    return Basic_COLUMNS.filter(col => col.required).every(col => {
      const v = editSavedMapping[col.name];
      return v && v.trim() !== "";
    });
  }, [editSavedMapping]);

  const handleMappingChange = useCallback((fieldName: string, value: string) => {
    const newMapping = { ...mapping };
    Object.keys(newMapping).forEach((k) => { if (newMapping[k] === fieldName) newMapping[k] = ""; });
    if (value && value !== "none") newMapping[value] = fieldName;
    onMappingChange(newMapping);
  }, [mapping, onMappingChange]);

  const mappingValuesHash = useMemo(() => Object.values(mapping).sort().join('|'), [mapping]);

  const filteredHeaders = useMemo(() => {
    let headers = csvHeaders.filter(h => h.toLowerCase().includes(searchTerm.toLowerCase()));
    if (showMappedOnly) headers = headers.filter(h => Object.values(mapping).includes(h));
    return headers;
  }, [csvHeaders, searchTerm, showMappedOnly, mappingValuesHash]);

  const displayedColumns = showOnlyRequired ? Basic_COLUMNS.filter(col => col.required) : Basic_COLUMNS;
  const requiredColumns = Basic_COLUMNS.filter(col => col.required);
  const mappedRequired = requiredColumns.filter(col => Object.values(mapping).includes(col.name)).length;
  const totalMapped = Object.values(mapping).filter(v => v && v !== "").length;
  const isComplete = mappedRequired === requiredColumns.length;
  const hasFile = csvHeaders.length > 0;

  const clearMapping = useCallback(() => {
    const initial: Record<string, string> = {};
    csvHeaders.forEach((h) => {
      const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
      initial[h] = match ? match.name : "";
    });
    onMappingChange(initial);
    setSelectedSavedMapping(null);
  }, [csvHeaders, onMappingChange]);

  const handleImportClick = useCallback(() => {
    if (onImport) onImport();
  }, [onImport]);

  // ── Enregistrer mapping courant ─────────────────────────────
  const handleSaveCurrentMapping = useCallback(async () => {
    if (!mappingName.trim()) return;
    setIsSaving(true);

    const currentRules = cleanMapping(mapping);
    const effectiveScope = isAdmin ? saveScope : 'LOCAL';

    let effectiveWorkspaceId: string | null = null;

    if (effectiveScope === 'LOCAL') {
      effectiveWorkspaceId =
        workspaceId
        ?? autoDetectedWorkspaceId
        ?? saveWorkspaceId
        ?? null;

      if (!effectiveWorkspaceId) {
        setErrorMessage("Veuillez sélectionner un workspace avant d'enregistrer.");
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      name: mappingName.trim(),
      rules: currentRules,
      entityId: entityId || null,
      entityType: entityType || null,
      workspaceId: effectiveWorkspaceId,
      scope: effectiveScope,
    };

    try {
      await apiFetch("/mapping-templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Re-fetch les deux listes
      await Promise.all([
        effectiveWorkspaceId ? fetchLocalMappingsForWorkspace(effectiveWorkspaceId) : Promise.resolve(),
        fetchGlobalMappings(),
      ]);
      setErrorMessage(null);
      setSuccessMessage("Mapping enregistré avec succès !");
      setMappingName("");
      setTimeout(() => { closeModal(); setSuccessMessage(null); }, 800);
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible d'enregistrer le mapping");
    } finally {
      setIsSaving(false);
    }
  }, [
    mapping, mappingName, entityId, entityType,
    workspaceId, autoDetectedWorkspaceId,
    isAdmin, saveScope, saveWorkspaceId,
    fetchLocalMappingsForWorkspace, fetchGlobalMappings, closeModal,
  ]);

  // ── Enregistrer comme nouveau (depuis détail) ───────────────
  const handleSaveAsNewMapping = useCallback(async () => {
    if (!selectedSavedMapping || !newMappingName.trim()) return;
    setIsSaving(true);

    const invertedMapping: Record<string, string> = {};
    Object.entries(editSavedMapping).forEach(([dbField, csvColumn]) => {
      if (csvColumn && csvColumn.trim() !== "") invertedMapping[csvColumn] = dbField;
    });
    const cleaned = cleanMapping(invertedMapping);

    const effectiveScope = isAdmin ? saveAsNewScope : 'LOCAL';

    let effectiveWorkspaceId: string | null = null;

    if (effectiveScope === 'LOCAL') {
      effectiveWorkspaceId =
        workspaceId
        ?? autoDetectedWorkspaceId
        ?? saveAsNewWorkspaceId
        ?? null;

      if (!effectiveWorkspaceId) {
        setErrorMessage("Un workspace est requis pour un mapping local. Sélectionnez un workspace.");
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      name: newMappingName.trim(),
      rules: cleaned,
      entityId: effectiveScope === 'LOCAL' ? (entityId || selectedSavedMapping.entityId || null) : null,
      entityType: effectiveScope === 'LOCAL' ? (entityType || selectedSavedMapping.entityType || null) : null,
      workspaceId: effectiveWorkspaceId,
      scope: effectiveScope,
    };

    try {
      await apiFetch("/mapping-templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await Promise.all([
        effectiveWorkspaceId ? fetchLocalMappingsForWorkspace(effectiveWorkspaceId) : Promise.resolve(),
        fetchGlobalMappings(),
      ]);
      setErrorMessage(null);
      setSuccessMessage("Nouveau mapping enregistré avec succès !");
      setNewMappingName("");
      setTimeout(() => {
        setShowMappingDetail(false);
        onOpenChange(false);
        setSuccessMessage(null);
      }, 800);
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible d'enregistrer le nouveau mapping");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSavedMapping, editSavedMapping, newMappingName,
    entityId, entityType, workspaceId, autoDetectedWorkspaceId,
    isAdmin, saveAsNewScope, saveAsNewWorkspaceId,
    fetchLocalMappingsForWorkspace, fetchGlobalMappings, onOpenChange,
  ]);

  const handleDeleteMapping = useCallback(async (m: SavedMapping) => {
    if (!confirm(`Supprimer le mapping "${m.name}" ?`)) return;

    try {
      await apiFetch(`/mapping-templates/${m.id}`, {
        method: 'DELETE',
        snackbar: {
          showSuccess: true,
          showError: false,
          successMessage: `✅ Mapping "${m.name}" supprimé`,
        },
      });
      // Re-fetch selon le scope du mapping supprimé
      const isGlobal = !m.workspaceId || m.scope === 'GLOBAL';
      if (isGlobal) {
        await fetchGlobalMappings();
      } else if (activeLocalWorkspaceId) {
        await fetchLocalMappingsForWorkspace(activeLocalWorkspaceId);
      }
    } catch (err: any) {
      console.error('Erreur suppression mapping:', err);

      const errorMessage = err?.message || '';
      const errorString = String(errorMessage).toLowerCase();

      const isForeignKeyViolation =
        errorString.includes('contrainte de clé étrangère') ||
        errorString.includes('violation de clé étrangère') ||
        errorString.includes('foreign key') ||
        errorString.includes('fk_entry_mapping') ||
        errorString.includes('accounting_entries');

      if (isForeignKeyViolation) {
        setMappingDeleteError({
          show: true,
          mappingName: m.name,
          details: "Ce mapping est utilisé par des écritures comptables existantes.",
        });
      } else {
        setErrorMessage(`Impossible de supprimer le mapping "${m.name}". ${errorMessage || 'Erreur inconnue'}`);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    }
  }, [fetchGlobalMappings, fetchLocalMappingsForWorkspace, activeLocalWorkspaceId]);

  const handleFileInputClick = useCallback(() => {
    document.getElementById('mapping-file-input')?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) onFileUpload(file);
  }, [onFileUpload]);

  // ── Admin : affiche le sélecteur de workspace dans le header quand nécessaire ──
  // (pas de workspaceId connu via l'entité sélectionnée)
  const showHeaderWorkspaceSelector = isAdmin && !workspaceId;

  const canSaveMapping = useMemo(() => {
    const baseValid = mappingName.trim() !== "" && isComplete && hasFile;
    if (!baseValid) return false;

    if (isAdmin && saveScope === 'LOCAL' && !workspaceId && !saveWorkspaceId) return false;

    if (!isAdmin) {
      const resolvedWs = workspaceId ?? autoDetectedWorkspaceId ?? saveWorkspaceId;
      if (!resolvedWs) return false;
    }

    return true;
  }, [mappingName, isComplete, hasFile, isAdmin, saveScope, workspaceId, saveWorkspaceId, autoDetectedWorkspaceId]);

  const getImportButtonDisabled = useCallback(() => {
    if (configMode === 'file') return !isComplete || !hasFile;
    if (configMode === 'local' || configMode === 'global') return !selectedSavedMapping;
    return false;
  }, [configMode, isComplete, hasFile, selectedSavedMapping]);

  const headerSubtitle = {
    file: "Associez les colonnes de votre fichier aux champs attendus par le système",
    local: "Réutilisez un mapping déjà configuré pour ce workspace",
    global: "Réutilisez un mapping partagé sur toute la plateforme",
  }[configMode];

  // ── Détermine si le panneau Locaux doit afficher un sélecteur de workspace ──
  // Pour les admins : toujours (pour pouvoir changer)
  // Pour les non-admins avec plusieurs workspaces : toujours
  const showLocalPanelWorkspaceSelector = isAdmin
    ? true
    : needsWorkspaceSelection;

  const DeleteErrorDialog = () => {
    if (!mappingDeleteError?.show) return null;
    return (
      <Dialog open={mappingDeleteError.show} onOpenChange={() => setMappingDeleteError(null)}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                Impossible de supprimer ce mapping
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-700">
              Le mapping <span className="font-semibold text-primary">"{mappingDeleteError.mappingName}"</span> ne peut pas être supprimé car il est actuellement utilisé.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">📌 Pourquoi ce message ?</p>
              <p className="text-sm text-amber-700">
                Ce mapping a été utilisé pour importer ou structurer des données.
                La suppression pourrait causer des incohérences dans votre base de données.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">✅ Comment faire ?</p>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Créez un <strong>nouveau mapping</strong> si besoin</li>
                <li>Le mapping existant restera disponible en lecture seule</li>
                <li>Contactez un administrateur si vous souhaitez forcer la suppression</li>
              </ul>
            </div>
            {mappingDeleteError.details && (
              <details className="text-xs text-slate-500 mt-2">
                <summary className="cursor-pointer">Détails techniques</summary>
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-x-auto">
                  {mappingDeleteError.details}
                </pre>
              </details>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setMappingDeleteError(null)} variant="outline">Fermer</Button>
            <Button onClick={() => setMappingDeleteError(null)} className="bg-primary">Compris</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[92dvh] w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-7xl flex flex-col overflow-hidden rounded-xl bg-white p-0">

          {errorMessage && (
            <div className="flex-shrink-0 mx-4 mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />{errorMessage}
              </p>
            </div>
          )}
          {successMessage && (
            <div className="flex-shrink-0 mx-4 mt-4 p-3 bg-emerald-500 rounded-lg shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0 bg-white/20 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white">{successMessage}</p>
                <p className="text-[10px] text-emerald-100 mt-0.5">La fenêtre va se fermer automatiquement...</p>
              </div>
              <div className="flex-shrink-0">
                <Loader2 className="h-3.5 w-3.5 text-white/70 animate-spin" />
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex-shrink-0">
            <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-800">
                      Configuration du mapping des champs
                    </DialogTitle>
                    <p className="text-xs text-slate-500">{headerSubtitle}</p>
                  </div>
                </div>

                {/* Nom + Toggle scope + Select workspace (mode fichier) */}
                {configMode === 'file' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-medium text-slate-600">
                        Nom du mapping <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mappingName}
                        onChange={(e) => setMappingName(e.target.value)}
                        placeholder="Ex: Mapping fournisseur A"
                        className="w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
                      />
                      {isAdmin && (
                        <>
                          <span className="text-xs text-slate-300">|</span>
                          <ScopeToggle
                            scope={saveScope}
                            onChange={(s) => {
                              setSaveScope(s);
                              if (s === 'GLOBAL') setSaveWorkspaceId(null);
                            }}
                          />
                        </>
                      )}
                    </div>

                    {/* Sélecteur workspace pour ADMIN en LOCAL sans entité */}
                    {showHeaderWorkspaceSelector && saveScope === 'LOCAL' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-600">
                          Workspace <span className="text-red-500">*</span> :
                        </span>
                        <WorkspaceSelectorInline
                          workspaces={accessibleWorkspaces}
                          value={saveWorkspaceId}
                          onChange={handleHeaderWorkspaceChange}
                          isLoading={isLoadingWorkspaces}
                        />
                        {!saveWorkspaceId && (
                          <span className="text-[10px] text-amber-600">Requis pour un mapping local</span>
                        )}
                      </div>
                    )}

                    {/* Sélecteur workspace pour non-admin avec plusieurs workspaces */}
                    {!isAdmin && needsWorkspaceSelection && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-600">
                          Workspace <span className="text-red-500">*</span> :
                        </span>
                        <WorkspaceSelectorInline
                          workspaces={accessibleWorkspaces}
                          value={saveWorkspaceId}
                          onChange={(id) => {
                            setSaveWorkspaceId(id);
                            setAutoDetectedWorkspaceId(id);
                            setActiveLocalWorkspaceId(id);
                          }}
                          isLoading={isLoadingWorkspaces}
                        />
                        {!saveWorkspaceId && (
                          <span className="text-[10px] text-amber-600">
                            Requis — vous avez accès à plusieurs workspaces
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Onglets */}
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                  <button
                    onClick={() => setConfigMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${configMode === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Par fichier
                  </button>

                  <button
                    onClick={() => setConfigMode('global')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${configMode === 'global' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Globaux
                    {globalMappings.length > 0 && (
                      <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded-full">
                        {globalMappings.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setConfigMode('local')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${configMode === 'local' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Locaux
                    {localMappings.length > 0 && (
                      <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1 rounded-full">
                        {localMappings.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Corps */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">

            {configMode === 'file' ? (
              <>
                {/* Panneau gauche : colonnes du fichier */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-b border-slate-100 bg-slate-50/30 lg:border-b-0 lg:border-r">
                  <div className="flex-shrink-0 p-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileUp className="h-3.5 w-3.5 text-primary" />
                          Colonnes détectées
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {csvHeaders.length} colonne{csvHeaders.length > 1 ? "s" : ""} trouvée{csvHeaders.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      {hasFile && (
                        <button
                          onClick={() => setShowMappedOnly(!showMappedOnly)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md transition-all ${showMappedOnly ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {showMappedOnly ? "Mappées" : "Toutes"}
                        </button>
                      )}
                    </div>
                    {hasFile && (
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 overscroll-contain">
                    {!hasFile ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="inline-flex p-2 rounded-full bg-amber-50">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Aucun fichier chargé</p>
                          <p className="text-[10px] text-slate-400 mt-1">Importez d'abord un fichier Excel/CSV/TXT</p>
                        </div>
                        <Button size="sm" className="mt-2" onClick={handleFileInputClick}>
                          <Upload className="h-3 w-3 mr-1" />
                          Importer fichier
                        </Button>
                        <input
                          id="mapping-file-input"
                          type="file"
                          accept=".csv, .xlsx"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    ) : filteredHeaders.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-400">Aucune colonne trouvée</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredHeaders.map((h) => {
                          const isMapped = Object.values(mapping).includes(h);
                          const mappedTo = Object.entries(mapping).find(([, v]) => v === h)?.[0];
                          return (
                            <div
                              key={h}
                              className={`group p-1.5 rounded-md transition-all ${isMapped ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-slate-200 hover:border-primary/40"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {isMapped
                                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                    : <div className="h-3 w-3 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                  }
                                  <span className={`text-[11px] truncate ${isMapped ? "font-medium text-emerald-700" : "text-slate-700"}`} title={h}>{h}</span>
                                </div>
                                {isMapped && mappedTo && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-200 text-emerald-700 rounded-full ml-1 flex-shrink-0">→ {mappedTo}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {hasFile && (
                    <div className="flex-shrink-0 p-2 border-t border-slate-100 bg-white">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-emerald-600">✓ {totalMapped} mappée(s)</span>
                        <span className="text-slate-400">○ {csvHeaders.length - totalMapped} restante(s)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Panneau droit : champs attendus */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
                  <div className="flex-shrink-0 p-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Champs attendus
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {Basic_COLUMNS.length} champs • {requiredColumns.length} requis
                        </p>
                      </div>
                      <button
                        onClick={() => setShowOnlyRequired(!showOnlyRequired)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md transition-all ${showOnlyRequired ? "bg-primary/10 text-primary font-medium" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        <Filter className="h-2.5 w-2.5" />
                        {showOnlyRequired ? "Requis" : "Tous"}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1.5">
                      {displayedColumns.map((field) => {
                        const currentMapping = Object.entries(mapping).find(([, v]) => v === field.name)?.[0] || "";
                        const isMapped = !!currentMapping;
                        return (
                          <div
                            key={field.name}
                            className={`rounded-md border p-2 transition-all ${field.required ? "bg-white border-slate-200" : "bg-slate-50/50 border-slate-100"} ${isMapped ? "border-emerald-200 bg-emerald-50/5" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <label htmlFor={`field-${field.name}`} className={`text-[11px] font-semibold ${field.required ? "text-slate-800" : "text-slate-600"}`}>
                                  {field.name}
                                </label>
                                {field.required && (
                                  <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Requis</span>
                                )}
                              </div>
                              {isMapped && (
                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full truncate max-w-[150px]" title={currentMapping}>
                                  {currentMapping}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 w-full">
                              <ArrowRight className={`h-3 w-3 flex-shrink-0 ${isMapped ? "text-emerald-500" : "text-slate-400"}`} />
                              <select
                                id={`field-${field.name}`}
                                value={currentMapping}
                                onChange={(e) => handleMappingChange(field.name, e.target.value)}
                                disabled={!hasFile}
                                className={`flex-1 min-w-0 px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${!hasFile ? "bg-slate-50 text-slate-400 cursor-not-allowed" : isMapped ? "border-emerald-200 bg-emerald-50/30 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}
                              >
                                <option value="none">— Sélectionner —</option>
                                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>

            ) : configMode === 'global' ? (
              <MappingListPanel
                title="Mappings globaux"
                subtitle="Mappings partagés sur toute la plateforme — cliquez pour voir les détails"
                icon={<Globe className="h-4 w-4 text-emerald-600" />}
                mappings={globalMappings}
                isLoading={isLoadingGlobal}
                blocked={false}
                onView={viewMappingDetail}
                formatDate={formatDate}
                onDelete={handleDeleteMapping}
                currentUserId={currentUser?.id}
                userRole={currentUser?.role}
              />

            ) : (
              // configMode === 'local'
              <MappingListPanel
                title="Mappings locaux"
                subtitle={
                  showLocalPanelWorkspaceSelector && !activeLocalWorkspaceId
                    ? "Sélectionnez un workspace pour voir ses mappings"
                    : activeLocalWorkspaceId
                      ? `Mappings du workspace — cliquez pour voir les détails`
                      : "Mappings de votre workspace — cliquez pour voir les détails"
                }
                icon={<FolderOpen className="h-4 w-4 text-primary" />}
                mappings={localMappings}
                isLoading={isLoadingLocal}
                blocked={false}
                onView={viewMappingDetail}
                formatDate={formatDate}
                // Le sélecteur est toujours visible pour les admins (pour changer de workspace)
                // et pour les non-admins avec plusieurs workspaces
                showWorkspaceSelector={showLocalPanelWorkspaceSelector}
                accessibleWorkspaces={accessibleWorkspaces}
                selectedWorkspaceId={activeLocalWorkspaceId}
                onSelectWorkspace={handlePanelWorkspaceChange}
                onDelete={handleDeleteMapping}
                currentUserId={currentUser?.id}
                userRole={currentUser?.role}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0">
            <DialogFooter className="p-3 border-t bg-slate-50/50">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                  onClick={clearMapping}
                  className="text-[10px] text-slate-500 hover:text-amber-600 transition-colors px-2 py-1"
                >
                  ✕ Effacer le mapping actuel
                </button>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {configMode === 'file' && (
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentMapping}
                      className="h-8 w-full bg-emerald-600 px-3 text-xs hover:bg-emerald-700 sm:h-7 sm:w-auto"
                      disabled={!canSaveMapping || isSaving}
                    >
                      {isSaving
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3 mr-1" />
                      }
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  )}
                  {showImportButton && (
                    <Button
                      size="sm"
                      onClick={handleImportClick}
                      className="h-8 w-full bg-primary px-3 text-xs hover:bg-primary/90 sm:h-7 sm:w-auto"
                      disabled={getImportButtonDisabled() || isSaving}
                    >
                      <FileUp className="h-3 w-3 mr-1" />
                      Importer
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <MappingDetailModal
        showMappingDetail={showMappingDetail}
        setShowMappingDetail={setShowMappingDetail}
        selectedSavedMapping={selectedSavedMapping}
        detailMode={detailMode}
        setDetailMode={setDetailMode}
        editSavedMapping={editSavedMapping}
        setEditSavedMapping={setEditSavedMapping}
        originalEditMapping={originalEditMapping}
        isMappingChanged={isMappingChanged}
        isEditValid={isEditValid}
        formatDate={formatDate}
        handleSaveAsNewMapping={handleSaveAsNewMapping}
        newMappingName={newMappingName}
        setNewMappingName={setNewMappingName}
        isSaving={isSaving}
        isAdmin={isAdmin}
        saveAsNewScope={saveAsNewScope}
        setSaveAsNewScope={(s) => {
          setSaveAsNewScope(s);
          if (s === 'GLOBAL') setSaveAsNewWorkspaceId(null);
        }}
        accessibleWorkspaces={accessibleWorkspaces}
        saveAsNewWorkspaceId={saveAsNewWorkspaceId}
        setSaveAsNewWorkspaceId={setSaveAsNewWorkspaceId}
        isLoadingWorkspaces={isLoadingWorkspaces}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      <DeleteErrorDialog />
    </>
  );
}