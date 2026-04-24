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
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eraser,
  FileUp,
  Filter,
  Layers,
  Pencil,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Basic_COLUMNS } from "./constants";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { SavedMapping } from "./types";
import {
  cleanMapping,
  canDeleteMapping,
  formatMappingDate,
  isGlobalMapping,
} from "./MappingUtils";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { MappingProgress } from "./mapping/MappingProgress";
import { MappingFieldRow } from "./mapping/MappingFieldRow";
import { MappingFeedback } from "./mapping/MappingFeedback";
import { MappingTemplateList } from "./mapping/MappingTemplateList";
import {
  SaveMappingDialog,
  type SaveMappingDialogValue,
} from "./mapping/SaveMappingDialog";
import { DeleteMappingConfirm } from "./mapping/DeleteMappingConfirm";

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
  entityType?: "Group" | "Company" | null;
  showImportButton?: boolean;
  onFileUpload?: (file: File) => void;
  workspaceId?: string | null;
}

type Tab = "editor" | "templates";
type DetailMode = "view" | "edit";
type FeedbackState = { tone: "success" | "error"; message: string } | null;

export function MappingModal({
  open,
  onOpenChange,
  csvHeaders,
  mapping,
  onMappingChange,
  onImport,
  isSubmitting,
  entityId,
  entityType,
  showImportButton = false,
  onFileUpload,
  workspaceId,
}: MappingModalProps) {
  const { user: currentUser } = usePermissionsContext();
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  // ───────────────────────────────────────────── UI state
  const [tab, setTab] = useState<Tab>("editor");
  const [showSource, setShowSource] = useState(true);
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Templates state
  const [localMappings, setLocalMappings] = useState<SavedMapping[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [globalMappings, setGlobalMappings] = useState<SavedMapping[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [activeLocalWorkspaceId, setActiveLocalWorkspaceId] = useState<
    string | null
  >(null);
  const [autoDetectedWorkspaceId, setAutoDetectedWorkspaceId] = useState<
    string | null
  >(null);
  const [needsWorkspaceSelection, setNeedsWorkspaceSelection] = useState(false);

  // Detail modal state
  const [selectedSavedMapping, setSelectedSavedMapping] =
    useState<SavedMapping | null>(null);
  const [showMappingDetail, setShowMappingDetail] = useState(false);
  const [editSavedMapping, setEditSavedMapping] = useState<
    Record<string, string>
  >({});
  const [originalEditMapping, setOriginalEditMapping] = useState<
    Record<string, string>
  >({});
  const [detailMode, setDetailMode] = useState<DetailMode>("view");
  const [detailFeedback, setDetailFeedback] = useState<FeedbackState>(null);

  // Delete confirm state
  const [mappingToDelete, setMappingToDelete] = useState<SavedMapping | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorDialog, setDeleteErrorDialog] = useState<
    { name: string; details: string } | null
  >(null);

  // Save dialogs state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveAsNewDialogOpen, setSaveAsNewDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState<string | null>(null);

  const prevActiveLocalWorkspaceId = useRef<string | null>(null);

  // ───────────────────────────────────────────── Fetchers
  const fetchAccessibleWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const wsList = await apiFetch<{ id: string; name: string }[]>(
        "/mapping-templates/my-workspaces",
        { snackbar: { showSuccess: false, showError: false } },
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

  const fetchLocalMappingsForWorkspace = useCallback(async (wsId: string) => {
    setIsLoadingLocal(true);
    try {
      const data = await apiFetch<SavedMapping[]>(
        `/mapping-templates/workspace/${wsId}`,
        { snackbar: { showSuccess: false, showError: false } },
      );
      setLocalMappings(data ?? []);
    } catch {
      setLocalMappings([]);
    } finally {
      setIsLoadingLocal(false);
    }
  }, []);

  const fetchGlobalMappings = useCallback(async () => {
    setIsLoadingGlobal(true);
    try {
      const data = await apiFetch<SavedMapping[]>(`/mapping-templates/global`, {
        snackbar: { showSuccess: false, showError: false },
      });
      setGlobalMappings(data ?? []);
    } catch {
      setGlobalMappings([]);
    } finally {
      setIsLoadingGlobal(false);
    }
  }, []);

  const autoDetectWorkspaceForNonAdmin = useCallback(async () => {
    if (isAdmin) return;
    if (workspaceId) {
      setAutoDetectedWorkspaceId(workspaceId);
      setActiveLocalWorkspaceId(workspaceId);
      setNeedsWorkspaceSelection(false);
      return;
    }
    try {
      const wsList = await apiFetch<{ id: string; name: string }[]>(
        "/mapping-templates/my-workspaces",
        { snackbar: { showSuccess: false, showError: false } },
      );
      if (wsList?.length === 1) {
        setAutoDetectedWorkspaceId(wsList[0].id);
        setActiveLocalWorkspaceId(wsList[0].id);
        setNeedsWorkspaceSelection(false);
        setAccessibleWorkspaces(wsList);
      } else if (wsList?.length > 1) {
        setAutoDetectedWorkspaceId(null);
        setActiveLocalWorkspaceId(null);
        setNeedsWorkspaceSelection(true);
        setAccessibleWorkspaces(wsList);
      } else {
        setAutoDetectedWorkspaceId(null);
        setActiveLocalWorkspaceId(null);
        setNeedsWorkspaceSelection(false);
      }
    } catch {
      setAutoDetectedWorkspaceId(null);
      setNeedsWorkspaceSelection(false);
    }
  }, [isAdmin, workspaceId]);

  // ───────────────────────────────────────────── Effects
  useEffect(() => {
    if (!open) return;
    if (
      activeLocalWorkspaceId &&
      activeLocalWorkspaceId !== prevActiveLocalWorkspaceId.current
    ) {
      prevActiveLocalWorkspaceId.current = activeLocalWorkspaceId;
      fetchLocalMappingsForWorkspace(activeLocalWorkspaceId);
    } else if (!activeLocalWorkspaceId) {
      setLocalMappings([]);
    }
  }, [activeLocalWorkspaceId, open, fetchLocalMappingsForWorkspace]);

  useEffect(() => {
    if (!open) return;
    prevActiveLocalWorkspaceId.current = null;
    fetchGlobalMappings();
    setSelectedSavedMapping(null);
    setFeedback(null);
    setDetailFeedback(null);
    setLastSavedHash(null);
    setTab("editor");
    if (isAdmin) {
      fetchAccessibleWorkspaces();
      const initWs = workspaceId ?? null;
      setActiveLocalWorkspaceId(initWs);
      setAutoDetectedWorkspaceId(null);
      setNeedsWorkspaceSelection(false);
      if (initWs) fetchLocalMappingsForWorkspace(initWs);
      else setLocalMappings([]);
    } else {
      autoDetectWorkspaceForNonAdmin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspaceId, isAdmin]);

  // ───────────────────────────────────────────── Derived
  const requiredColumns = useMemo(
    () => Basic_COLUMNS.filter((c) => c.required),
    [],
  );
  const mappedRequired = requiredColumns.filter((col) =>
    Object.values(mapping).includes(col.name),
  ).length;
  const totalMapped = Object.values(mapping).filter(
    (v) => v && v !== "",
  ).length;
  const isComplete = mappedRequired === requiredColumns.length;
  const hasFile = csvHeaders.length > 0;

  const displayedColumns = showOnlyRequired ? requiredColumns : Basic_COLUMNS;
  const currentMappingHash = useMemo(
    () => JSON.stringify(cleanMapping(mapping)),
    [mapping],
  );
  const isCurrentMappingSaved =
    lastSavedHash !== null && lastSavedHash === currentMappingHash;

  const usedColumns = useMemo(() => {
    const s = new Set<string>();
    Object.keys(mapping).forEach((k) => {
      if (mapping[k]) s.add(k);
    });
    return s;
  }, [mapping]);

  const sourceMappings = useMemo(() => {
    return csvHeaders.map((h) => {
      const dbField = mapping[h] || "";
      return { header: h, dbField };
    });
  }, [csvHeaders, mapping]);

  const unmappedHeaders = sourceMappings.filter((s) => !s.dbField).length;

  // ───────────────────────────────────────────── Handlers
  const closeModal = useCallback(() => {
    onOpenChange(false);
    setShowMappingDetail(false);
    setFeedback(null);
    setDetailFeedback(null);
  }, [onOpenChange]);

  const handleMappingChange = useCallback(
    (fieldName: string, value: string) => {
      const newMapping = { ...mapping };
      Object.keys(newMapping).forEach((k) => {
        if (newMapping[k] === fieldName) newMapping[k] = "";
      });
      if (value && value !== "none") newMapping[value] = fieldName;
      onMappingChange(newMapping);
    },
    [mapping, onMappingChange],
  );

  const clearMapping = useCallback(() => {
    const initial: Record<string, string> = {};
    csvHeaders.forEach((h) => {
      const match = Basic_COLUMNS.find(
        (col) => col.name.toLowerCase() === h.toLowerCase(),
      );
      initial[h] = match ? match.name : "";
    });
    onMappingChange(initial);
    setSelectedSavedMapping(null);
  }, [csvHeaders, onMappingChange]);

  const handleImportClick = useCallback(() => {
    if (onImport) onImport();
  }, [onImport]);

  const viewMappingDetail = useCallback((m: SavedMapping) => {
    setSelectedSavedMapping(m);
    const rules = m.rules || {};
    const fullRules: Record<string, string> = {};
    Basic_COLUMNS.forEach((col) => {
      const found = Object.keys(rules).find(
        (csvCol) => rules[csvCol] === col.name,
      );
      fullRules[col.name] = found || "";
    });
    setEditSavedMapping(fullRules);
    setOriginalEditMapping(fullRules);
    setDetailMode("view");
    setDetailFeedback(null);
    setShowMappingDetail(true);
  }, []);

  const isMappingChanged = useMemo(
    () =>
      JSON.stringify(editSavedMapping) !== JSON.stringify(originalEditMapping),
    [editSavedMapping, originalEditMapping],
  );
  const isEditValid = useMemo(() => {
    return requiredColumns.every((col) => {
      const v = editSavedMapping[col.name];
      return v && v.trim() !== "";
    });
  }, [editSavedMapping, requiredColumns]);

  const handleFileInputClick = useCallback(() => {
    document.getElementById("mapping-file-input")?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileUpload) onFileUpload(file);
    },
    [onFileUpload],
  );

  // ───────────────────────────────────────────── Save flows
  const handleConfirmSaveCurrent = useCallback(
    async (value: SaveMappingDialogValue) => {
      setIsSaving(true);
      try {
        const currentRules = cleanMapping(mapping);
        const effectiveScope = isAdmin ? value.scope : "LOCAL";
        let effectiveWorkspaceId: string | null = null;
        if (effectiveScope === "LOCAL") {
          effectiveWorkspaceId =
            value.workspaceId ??
            workspaceId ??
            autoDetectedWorkspaceId ??
            null;
          if (!effectiveWorkspaceId) {
            setFeedback({
              tone: "error",
              message:
                "Veuillez sélectionner un workspace avant d'enregistrer.",
            });
            return;
          }
        }
        const payload = {
          name: value.name,
          rules: currentRules,
          entityId: entityId || null,
          entityType: entityType || null,
          workspaceId: effectiveWorkspaceId,
          scope: effectiveScope,
        };
        await apiFetch("/mapping-templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await Promise.all([
          effectiveWorkspaceId
            ? fetchLocalMappingsForWorkspace(effectiveWorkspaceId)
            : Promise.resolve(),
          fetchGlobalMappings(),
        ]);
        setFeedback({
          tone: "success",
          message: "Mapping enregistré avec succès.",
        });
        setLastSavedHash(currentMappingHash);
        setSaveDialogOpen(false);
      } catch (err) {
        console.error(err);
        setFeedback({
          tone: "error",
          message: "Impossible d'enregistrer le mapping.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [
      mapping,
      isAdmin,
      workspaceId,
      autoDetectedWorkspaceId,
      entityId,
      entityType,
      fetchLocalMappingsForWorkspace,
      fetchGlobalMappings,
      closeModal,
      currentMappingHash,
    ],
  );

  const handleConfirmSaveAsNew = useCallback(
    async (value: SaveMappingDialogValue) => {
      if (!selectedSavedMapping) return;
      setIsSaving(true);
      try {
        const invertedMapping: Record<string, string> = {};
        Object.entries(editSavedMapping).forEach(([dbField, csvColumn]) => {
          if (csvColumn && csvColumn.trim() !== "")
            invertedMapping[csvColumn] = dbField;
        });
        const cleaned = cleanMapping(invertedMapping);
        const effectiveScope = isAdmin ? value.scope : "LOCAL";
        let effectiveWorkspaceId: string | null = null;
        if (effectiveScope === "LOCAL") {
          effectiveWorkspaceId =
            value.workspaceId ??
            workspaceId ??
            autoDetectedWorkspaceId ??
            null;
          if (!effectiveWorkspaceId) {
            setDetailFeedback({
              tone: "error",
              message:
                "Un workspace est requis pour un mapping local.",
            });
            return;
          }
        }
        const payload = {
          name: value.name,
          rules: cleaned,
          entityId:
            effectiveScope === "LOCAL"
              ? entityId || selectedSavedMapping.entityId || null
              : null,
          entityType:
            effectiveScope === "LOCAL"
              ? entityType || selectedSavedMapping.entityType || null
              : null,
          workspaceId: effectiveWorkspaceId,
          scope: effectiveScope,
        };
        await apiFetch("/mapping-templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await Promise.all([
          effectiveWorkspaceId
            ? fetchLocalMappingsForWorkspace(effectiveWorkspaceId)
            : Promise.resolve(),
          fetchGlobalMappings(),
        ]);
        setDetailFeedback({
          tone: "success",
          message: "Nouveau mapping enregistré.",
        });
        setSaveAsNewDialogOpen(false);
        setShowMappingDetail(false);
      } catch (err) {
        console.error(err);
        setDetailFeedback({
          tone: "error",
          message: "Impossible d'enregistrer le nouveau mapping.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [
      selectedSavedMapping,
      editSavedMapping,
      isAdmin,
      workspaceId,
      autoDetectedWorkspaceId,
      entityId,
      entityType,
      fetchLocalMappingsForWorkspace,
      fetchGlobalMappings,
      onOpenChange,
    ],
  );

  // ───────────────────────────────────────────── Delete flow
  const handleAskDelete = useCallback((m: SavedMapping) => {
    setMappingToDelete(m);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!mappingToDelete) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/mapping-templates/${mappingToDelete.id}`, {
        method: "DELETE",
        snackbar: {
          showSuccess: true,
          showError: false,
          successMessage: `Mapping "${mappingToDelete.name}" supprimé`,
        },
      });
      if (isGlobalMapping(mappingToDelete)) {
        await fetchGlobalMappings();
      } else if (activeLocalWorkspaceId) {
        await fetchLocalMappingsForWorkspace(activeLocalWorkspaceId);
      }
      setMappingToDelete(null);
    } catch (err: unknown) {
      console.error("Erreur suppression mapping:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      const lowered = msg.toLowerCase();
      const isForeignKey =
        lowered.includes("contrainte de clé étrangère") ||
        lowered.includes("violation de clé étrangère") ||
        lowered.includes("foreign key") ||
        lowered.includes("fk_entry_mapping") ||
        lowered.includes("accounting_entries");
      if (isForeignKey) {
        setDeleteErrorDialog({
          name: mappingToDelete.name,
          details:
            "Ce mapping est utilisé par des écritures comptables existantes.",
        });
      } else {
        setFeedback({
          tone: "error",
          message: `Impossible de supprimer le mapping « ${mappingToDelete.name} ». ${msg || "Erreur inconnue"}`,
        });
      }
      setMappingToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [
    mappingToDelete,
    fetchGlobalMappings,
    fetchLocalMappingsForWorkspace,
    activeLocalWorkspaceId,
  ]);

  // ───────────────────────────────────────────── Import disabled
  const importDisabled = !isComplete || !hasFile || isSubmitting;
  const canSaveCurrent = isComplete && hasFile;

  // ───────────────────────────────────────────── Workspace selector (templates)
  const needsTemplateWorkspaceSelector = isAdmin || needsWorkspaceSelection;

  const allTemplates = useMemo(
    () => [...localMappings, ...globalMappings],
    [localMappings, globalMappings],
  );
  const workspaceLabelFor = useCallback(
    (m: SavedMapping) => {
      if (!m.workspaceId) return undefined;
      const ws = accessibleWorkspaces.find((w) => w.id === m.workspaceId);
      return ws?.name;
    },
    [accessibleWorkspaces],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="6xl" className="sm:max-h-[90dvh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <DialogTitle>Configuration du mapping</DialogTitle>
                <DialogDescription>
                  Associez les colonnes de votre fichier aux champs attendus,
                  ou réutilisez un modèle enregistré.
                </DialogDescription>
              </div>
            </div>
            <div
              role="tablist"
              aria-label="Sections du mapping"
              className="mt-3 inline-flex self-start rounded-full border border-slate-200 bg-slate-50 p-1"
            >
              <TabButton
                active={tab === "editor"}
                onClick={() => setTab("editor")}
                icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                label="Configurer"
              />
              <TabButton
                active={tab === "templates"}
                onClick={() => setTab("templates")}
                icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
                label="Modèles"
                badge={allTemplates.length}
              />
            </div>
          </DialogHeader>

          <DialogBody className="bg-slate-50/40">
            {feedback ? (
              <div className="mb-4">
                <MappingFeedback
                  tone={feedback.tone}
                  message={feedback.message}
                  onDismiss={() => setFeedback(null)}
                />
              </div>
            ) : null}

            {tab === "editor" ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-w-0 space-y-3">
                    <MappingProgress
                      mappedRequired={mappedRequired}
                      totalRequired={requiredColumns.length}
                      totalMapped={totalMapped}
                      totalFields={Basic_COLUMNS.length}
                    />

                    {!hasFile ? (
                      <NoFileCard
                        onUploadClick={handleFileInputClick}
                        onFileChange={handleFileChange}
                      />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            Champs attendus
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowOnlyRequired((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                              showOnlyRequired
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <Filter className="h-3 w-3" aria-hidden />
                            {showOnlyRequired ? "Requis" : "Tous"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {displayedColumns.map((field) => {
                            const currentSource =
                              Object.entries(mapping).find(
                                ([, v]) => v === field.name,
                              )?.[0] || "";
                            return (
                              <MappingFieldRow
                                key={field.name}
                                field={field}
                                value={currentSource}
                                sourceColumns={csvHeaders}
                                usedColumns={usedColumns}
                                onChange={(val) =>
                                  handleMappingChange(field.name, val)
                                }
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <aside
                    className={`min-w-0 rounded-xl border border-slate-200 bg-white ${
                      hasFile ? "" : "hidden lg:block"
                    }`}
                    aria-label="Colonnes du fichier"
                  >
                    <button
                      type="button"
                      onClick={() => setShowSource((v) => !v)}
                      aria-expanded={showSource}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="flex items-center gap-2">
                        <FileUp
                          className="h-4 w-4 text-slate-500"
                          aria-hidden
                        />
                        <span className="text-sm font-medium text-slate-900">
                          Colonnes du fichier
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
                          {csvHeaders.length}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            showSource ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </span>
                    </button>
                    {showSource ? (
                      <div className="border-t border-slate-100 p-3">
                        {hasFile ? (
                          <>
                            <p className="mb-2 text-xs text-slate-500">
                              {unmappedHeaders} non mappée
                              {unmappedHeaders > 1 ? "s" : ""} sur{" "}
                              {csvHeaders.length}
                            </p>
                            <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
                              {sourceMappings.map((s) => (
                                <li
                                  key={s.header}
                                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                                    s.dbField
                                      ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
                                      : "border-slate-100 bg-white text-slate-600"
                                  }`}
                                >
                                  {s.dbField ? (
                                    <CheckCircle2
                                      className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                                      aria-hidden
                                    />
                                  ) : (
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-full border border-slate-300"
                                      aria-hidden
                                    />
                                  )}
                                  <span
                                    className="truncate font-medium"
                                    title={s.header}
                                  >
                                    {s.header}
                                  </span>
                                  {s.dbField ? (
                                    <span className="ml-auto truncate rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                                      {s.dbField}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Importez un fichier pour voir ses colonnes.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </aside>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {needsTemplateWorkspaceSelector && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label
                      htmlFor="mapping-workspace-select"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      Workspace pour les mappings locaux
                    </label>
                    <select
                      id="mapping-workspace-select"
                      value={activeLocalWorkspaceId ?? ""}
                      onChange={(e) =>
                        setActiveLocalWorkspaceId(e.target.value || null)
                      }
                      disabled={isLoadingWorkspaces}
                      className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <option value="">— Tous les workspaces —</option>
                      {accessibleWorkspaces.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <MappingTemplateList
                  mappings={allTemplates}
                  loading={isLoadingLocal || isLoadingGlobal}
                  onSelect={viewMappingDetail}
                  onDelete={handleAskDelete}
                  canDelete={(m) => canDeleteMapping(m, currentUser)}
                  workspaceLabel={workspaceLabelFor}
                  emptyMessage="Aucun mapping enregistré pour le moment."
                />
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex-wrap sm:justify-between">
            <Button
              variant="ghost"
              onClick={clearMapping}
              disabled={totalMapped === 0}
              className="text-slate-500 hover:text-amber-600"
            >
              <Eraser className="mr-2 h-4 w-4" aria-hidden />
              Effacer le mapping
            </Button>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {tab === "editor" ? (
                <Button
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!canSaveCurrent || isSaving || isCurrentMappingSaved}
                  className={
                    isCurrentMappingSaved
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }
                >
                  {isCurrentMappingSaved ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {isCurrentMappingSaved ? "Enregistré" : "Enregistrer"}
                </Button>
              ) : null}
              {showImportButton && tab === "editor" ? (
                <Button onClick={handleImportClick} disabled={importDisabled}>
                  <FileUp className="mr-2 h-4 w-4" aria-hidden />
                  Importer
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save current mapping dialog */}
      <SaveMappingDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        title="Enregistrer le mapping"
        description="Choisissez un nom et une portée pour réutiliser ce mapping."
        allowScopeSelection={isAdmin}
        needsWorkspace={true}
        workspaces={accessibleWorkspaces}
        isLoadingWorkspaces={isLoadingWorkspaces}
        isSaving={isSaving}
        defaultScope={isAdmin ? "GLOBAL" : "LOCAL"}
        defaultWorkspaceId={
          workspaceId ?? autoDetectedWorkspaceId ?? activeLocalWorkspaceId
        }
        onConfirm={handleConfirmSaveCurrent}
      />

      {/* Detail / edit modal */}
      <MappingDetailModal
        open={showMappingDetail}
        onOpenChange={(v) => setShowMappingDetail(v)}
        mapping={selectedSavedMapping}
        detailMode={detailMode}
        setDetailMode={(m) => {
          setDetailMode(m);
          if (m === "view") {
            setEditSavedMapping(originalEditMapping);
          }
        }}
        editSavedMapping={editSavedMapping}
        setEditSavedMapping={(v) => setEditSavedMapping(v)}
        csvHeaders={csvHeaders}
        isAdmin={isAdmin}
        isMappingChanged={isMappingChanged}
        isEditValid={isEditValid}
        onOpenSaveAsNew={() => setSaveAsNewDialogOpen(true)}
        feedback={detailFeedback}
        onDismissFeedback={() => setDetailFeedback(null)}
      />

      {/* Save as new dialog (from detail modal) */}
      <SaveMappingDialog
        open={saveAsNewDialogOpen}
        onOpenChange={setSaveAsNewDialogOpen}
        title="Enregistrer comme nouveau mapping"
        description="Créez une nouvelle version du mapping sans modifier l'original."
        submitLabel="Enregistrer comme nouveau"
        allowScopeSelection={isAdmin}
        needsWorkspace={true}
        workspaces={accessibleWorkspaces}
        isLoadingWorkspaces={isLoadingWorkspaces}
        isSaving={isSaving}
        defaultScope={
          isAdmin
            ? selectedSavedMapping && isGlobalMapping(selectedSavedMapping)
              ? "GLOBAL"
              : "LOCAL"
            : "LOCAL"
        }
        defaultWorkspaceId={
          workspaceId ?? autoDetectedWorkspaceId ?? activeLocalWorkspaceId
        }
        onConfirm={handleConfirmSaveAsNew}
      />

      {/* Delete confirm */}
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
        onConfirm={handleConfirmDelete}
      />

      {/* Delete foreign-key error dialog */}
      <Dialog
        open={Boolean(deleteErrorDialog)}
        onOpenChange={(v) => {
          if (!v) setDeleteErrorDialog(null);
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="h-4 w-4" aria-hidden />
              </span>
              <DialogTitle>Impossible de supprimer ce mapping</DialogTitle>
            </div>
            <DialogDescription>
              Le mapping
              {deleteErrorDialog ? (
                <>
                  {" "}
                  <span className="font-medium text-slate-900">
                    « {deleteErrorDialog.name} »
                  </span>
                </>
              ) : null}{" "}
              est utilisé par des écritures comptables existantes.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3 text-sm text-slate-700">
            <p>
              La suppression pourrait causer des incohérences dans votre base
              de données.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1 text-sm font-medium text-slate-800">
                Comment faire ?
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                <li>Créez un nouveau mapping si besoin.</li>
                <li>Le mapping existant reste disponible en lecture.</li>
                <li>
                  Contactez un administrateur pour forcer la suppression.
                </li>
              </ul>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteErrorDialog(null)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Subcomponents
// ────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
      {typeof badge === "number" && badge > 0 ? (
        <span
          className={`rounded-full px-1.5 text-[10px] tabular-nums ${
            active ? "bg-slate-100 text-slate-700" : "bg-white text-slate-500"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function NoFileCard({
  onUploadClick,
  onFileChange,
}: {
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-700">
          Aucun fichier chargé
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Importez d'abord un fichier Excel/CSV/TXT pour mapper ses colonnes.
        </p>
      </div>
      <Button size="sm" onClick={onUploadClick}>
        <Upload className="mr-2 h-4 w-4" aria-hidden />
        Importer un fichier
      </Button>
      <input
        id="mapping-file-input"
        type="file"
        accept=".csv, .xlsx"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

interface MappingDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mapping: SavedMapping | null;
  detailMode: DetailMode;
  setDetailMode: (m: DetailMode) => void;
  editSavedMapping: Record<string, string>;
  setEditSavedMapping: (
    v:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  csvHeaders: string[];
  isAdmin: boolean;
  isMappingChanged: boolean;
  isEditValid: boolean;
  onOpenSaveAsNew: () => void;
  feedback: FeedbackState;
  onDismissFeedback: () => void;
}

function MappingDetailModal({
  open,
  onOpenChange,
  mapping,
  detailMode,
  setDetailMode,
  editSavedMapping,
  setEditSavedMapping,
  csvHeaders,
  isMappingChanged,
  isEditValid,
  onOpenSaveAsNew,
  feedback,
  onDismissFeedback,
}: MappingDetailModalProps) {
  const sourceColumns = useMemo(() => {
    // If the original mapping references columns not present in csvHeaders
    // (e.g. opened before a file is loaded), still include them so users
    // can see what was mapped.
    if (csvHeaders.length > 0) return csvHeaders;
    const refCols = Object.values(editSavedMapping).filter(
      (v): v is string => Boolean(v),
    );
    return Array.from(new Set(refCols));
  }, [csvHeaders, editSavedMapping]);

  const usedColumns = useMemo(() => {
    const s = new Set<string>();
    Object.values(editSavedMapping).forEach((v) => {
      if (v) s.add(v);
    });
    return s;
  }, [editSavedMapping]);

  const mappedCount = Object.values(editSavedMapping).filter(
    (v) => v && v !== "",
  ).length;
  const requiredCount = Basic_COLUMNS.filter((c) => c.required).length;
  const mappedRequiredCount = Basic_COLUMNS.filter(
    (c) => c.required && editSavedMapping[c.name],
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Layers className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle>
                {detailMode === "edit"
                  ? "Modifier le mapping"
                  : mapping?.name || "Détail du mapping"}
              </DialogTitle>
              {mapping ? (
                <DialogDescription>
                  {detailMode === "edit"
                    ? "Modifiez les associations puis enregistrez en tant que nouveau mapping."
                    : `Créé le ${formatMappingDate(mapping.createdAt)} • Modifié le ${formatMappingDate(mapping.updatedAt)}`}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 bg-slate-50/40">
          {feedback ? (
            <MappingFeedback
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={onDismissFeedback}
            />
          ) : null}

          <MappingProgress
            mappedRequired={mappedRequiredCount}
            totalRequired={requiredCount}
            totalMapped={mappedCount}
            totalFields={Basic_COLUMNS.length}
          />

          {detailMode === "edit" && csvHeaders.length === 0 ? (
            <MappingFeedback
              tone="info"
              title="Aperçu uniquement"
              message="Aucun fichier n'est chargé — les colonnes sources proposées sont celles enregistrées avec ce mapping."
            />
          ) : null}

          <div className="space-y-2">
            {Basic_COLUMNS.map((field) => (
              <MappingFieldRow
                key={field.name}
                field={field}
                value={editSavedMapping[field.name] || ""}
                sourceColumns={sourceColumns}
                usedColumns={usedColumns}
                disabled={detailMode === "view"}
                onChange={
                  detailMode === "edit"
                    ? (val) =>
                        setEditSavedMapping((prev) => ({
                          ...prev,
                          [field.name]: val,
                        }))
                    : undefined
                }
              />
            ))}
          </div>
        </DialogBody>

        <DialogFooter className="flex-wrap sm:justify-between">
          <span className="text-xs text-slate-500">
            {mappedCount} / {Basic_COLUMNS.length} champs configurés
          </span>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {detailMode === "view" ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
                <Button onClick={() => setDetailMode("edit")}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden />
                  Modifier
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDetailMode("view")}
                >
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  Annuler
                </Button>
                <Button
                  onClick={onOpenSaveAsNew}
                  disabled={!isEditValid || !isMappingChanged}
                >
                  <Save className="mr-2 h-4 w-4" aria-hidden />
                  Enregistrer comme nouveau
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
