import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight, Sparkles, FileUp, Loader2, Search, AlertCircle, Filter, ChevronDown, Database, Clock, Upload, PenTool, FolderOpen, Eye, Save } from "lucide-react";
import { Basic_COLUMNS } from "./constants";
import { useState, useMemo, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";
import { SavedMapping } from "./types";
import { cleanMapping } from './MappingUtils';
import { Card, CardContent } from "@/components/ui/Card";

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
}

type ConfigMode = 'file' | 'manual' | 'saved';
type DetailMode = "view" | "edit";

// Composant MappingDetailModal
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
}: MappingDetailModalProps) {
  return (
    <Dialog open={showMappingDetail} onOpenChange={setShowMappingDetail}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col bg-white rounded-xl overflow-hidden">
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

        {/* Champ nom du nouveau mapping en mode édition */}
        {detailMode === "edit" && (
          <div className="flex-shrink-0 p-4 border-b bg-white">
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
              <p className="text-[10px] text-amber-600 mt-1">
                Un nom est requis pour enregistrer ce mapping
              </p>
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
                            <option key={c.name} value={c.name}>
                              {c.name}{c.required ? " *" : ""}
                            </option>
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
                disabled={!isEditValid || !newMappingName.trim() || isSaving}
                className={(!isEditValid || !newMappingName.trim() || isSaving) ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
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
  onFileUpload
}: MappingModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
  const [showMappedOnly, setShowMappedOnly] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>('file');

  const [manualMapping, setManualMapping] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [userMappings, setUserMappings] = useState<SavedMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [selectedSavedMapping, setSelectedSavedMapping] = useState<SavedMapping | null>(null);
  const [showMappingDetail, setShowMappingDetail] = useState(false);
  const [editSavedMapping, setEditSavedMapping] = useState<Record<string, string>>({});
  const [detailMode, setDetailMode] = useState<DetailMode>("view");
  const [originalEditMapping, setOriginalEditMapping] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mappingName, setMappingName] = useState("");
  const [newMappingName, setNewMappingName] = useState("");
  const [isSaving, setIsSaving] = useState(false); // État de chargement pour la sauvegarde

  useEffect(() => {
    if (open) {
      fetchUserMappings();
      resetManualMapping();
      setSelectedSavedMapping(null);
      setErrorMessage(null);
      setMappingName("");
      setNewMappingName("");
    }
  }, [open]);
    const closeModal = useCallback(() => {
    onOpenChange(false);
    setShowMappingDetail(false);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [onOpenChange]);

  const fetchUserMappings = async () => {
    setIsLoadingMappings(true);
    setErrorMessage(null);
    try {
      const userMaps = await apiFetch<SavedMapping[]>(`/mapping-templates/user/me`, {
        snackbar: { showSuccess: false, showError: false }
      });
      setUserMappings(userMaps || []);
    } catch (error) {
      console.error("Erreur lors du chargement des mappings:", error);
      setErrorMessage("Impossible de charger vos mappings sauvegardés");
      setUserMappings([]);
    } finally {
      setIsLoadingMappings(false);
    }
  };

  const resetManualMapping = () => {
    setManualMapping({});
  };

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  }, []);

  const viewMappingDetail = useCallback((mapping: SavedMapping) => {
    setSelectedSavedMapping(mapping);
    
    const rules = mapping.rules || {};
    const fullRules: Record<string, string> = {};
    
    Basic_COLUMNS.forEach((col) => {
      const foundCsvColumn = Object.keys(rules).find(
        (csvCol) => rules[csvCol] === col.name
      );
      fullRules[col.name] = foundCsvColumn || "";
    });
    
    setEditSavedMapping(fullRules);
    setOriginalEditMapping(fullRules);
    setDetailMode("view");
    setNewMappingName("");
    setShowMappingDetail(true);
  }, []);

  const isMappingChanged = useMemo(() => {
    return JSON.stringify(editSavedMapping) !== JSON.stringify(originalEditMapping);
  }, [editSavedMapping, originalEditMapping]);

  const isEditValid = useMemo(() => {
    const requiredFields = Basic_COLUMNS.filter(col => col.required);
    return requiredFields.every(col => {
      const sourceValue = editSavedMapping[col.name];
      return sourceValue && sourceValue.trim() !== "";
    });
  }, [editSavedMapping]);

  const useSelectedMapping = useCallback(() => {
    if (selectedSavedMapping && selectedSavedMapping.rules) {
      const rules = selectedSavedMapping.rules;
      
      if (csvHeaders.length > 0) {
        const newMapping: Record<string, string> = {};
        csvHeaders.forEach(header => {
          if (rules[header]) {
            newMapping[header] = rules[header];
          } else {
            const match = Basic_COLUMNS.find(col => 
              col.name.toLowerCase() === header.toLowerCase()
            );
            newMapping[header] = match ? match.name : "";
          }
        });
        onMappingChange(newMapping);
        setConfigMode('file');
      } else {
        setManualMapping(rules);
        setConfigMode('manual');
      }
      setShowMappingDetail(false);
    }
  }, [selectedSavedMapping, csvHeaders, onMappingChange]);

  const handleManualMappingChange = useCallback((dbField: string, userValue: string) => {
    setManualMapping(prev => {
      const next = { ...prev };
      const cleanValue = userValue.trim().replace(/[<>"']/g, '');
      
      Object.keys(next).forEach(k => {
        if (next[k] === dbField) {
          delete next[k];
        }
      });
      
      if (cleanValue !== "") {
        next[cleanValue] = dbField;
      }
      return next;
    });
  }, []);

  const handleMappingChange = useCallback((fieldName: string, value: string) => {
    const newMapping = { ...mapping };
    Object.keys(newMapping).forEach((k) => {
      if (newMapping[k] === fieldName) newMapping[k] = "";
    });
    if (value && value !== "none") newMapping[value] = fieldName;
    onMappingChange(newMapping);
  }, [mapping, onMappingChange]);

  const mappingValuesHash = useMemo(() => {
    return Object.values(mapping).sort().join('|');
  }, [mapping]);

  const filteredHeaders = useMemo(() => {
    let headers = csvHeaders.filter(h =>
      h.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (showMappedOnly) {
      headers = headers.filter(h => Object.values(mapping).includes(h));
    }
    return headers;
  }, [csvHeaders, searchTerm, showMappedOnly, mappingValuesHash]);

  const displayedColumns = showOnlyRequired
    ? Basic_COLUMNS.filter(col => col.required)
    : Basic_COLUMNS;

  const requiredColumns = Basic_COLUMNS.filter(col => col.required);

  const mappedRequired = requiredColumns.filter(col =>
    Object.values(mapping).includes(col.name)
  ).length;
  const totalMapped = Object.values(mapping).filter(v => v && v !== "").length;
  const isComplete = mappedRequired === requiredColumns.length;
  const hasFile = csvHeaders.length > 0;

  const manualMappedRequired = requiredColumns.filter(col =>
    Object.values(manualMapping).includes(col.name)
  ).length;
  const isManualComplete = manualMappedRequired === requiredColumns.length;

  const clearMapping = useCallback(() => {
    if (configMode === 'file') {
      const initial: Record<string, string> = {};
      csvHeaders.forEach((h) => {
        const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
        initial[h] = match ? match.name : "";
      });
      onMappingChange(initial);
    } else if (configMode === 'manual') {
      setManualMapping({});
    }
    setSelectedSavedMapping(null);
  }, [configMode, csvHeaders, onMappingChange]);

  const handleValidate = useCallback(() => {
    if (configMode === 'file') {
      onValidateMapping(cleanMapping(mapping));
    } else {
      onValidateMapping(cleanMapping(manualMapping));
    }
  }, [configMode, mapping, manualMapping, onValidateMapping]);

  const handleImportClick = useCallback(() => {
    if (configMode === 'saved' && selectedSavedMapping) {
      onValidateMapping(cleanMapping(selectedSavedMapping.rules));
    } else if (onImport) {
      onImport();
    }
  }, [configMode, selectedSavedMapping, onValidateMapping, onImport]);

  const handleSaveAsNewMapping = useCallback(async () => {
    if (!selectedSavedMapping) return;
    if (!newMappingName.trim()) return;
    
    setIsSaving(true);
    
    const invertedMapping: Record<string, string> = {};
    Object.entries(editSavedMapping).forEach(([dbField, csvColumn]) => {
      if (csvColumn && csvColumn.trim() !== "") {
        invertedMapping[csvColumn] = dbField;
      }
    });

    const cleaned = cleanMapping(invertedMapping);
    const payload = {
      name: newMappingName.trim(),
      rules: cleaned,
      entityId: selectedSavedMapping.entityId,
      entityType: selectedSavedMapping.entityType,
    };
    
    try {
      await apiFetch("/mapping-templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await fetchUserMappings();

      setErrorMessage(null);
      setSuccessMessage("Nouveau mapping enregistré avec succès !");
      setNewMappingName("");

      setTimeout(() => {
        setShowMappingDetail(false);
        onOpenChange(false); // important: ferme aussi la modal principale
        setSuccessMessage(null);
      }, 800);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setErrorMessage("Impossible d'enregistrer le nouveau mapping");
    } finally {
      setIsSaving(false);
    }
  }, [selectedSavedMapping, editSavedMapping, newMappingName]);

  const handleSaveCurrentMapping = useCallback(async () => {
    if (!mappingName.trim()) return;
    
    setIsSaving(true);
    
    let currentRules: Record<string, string> = {};
    
    if (configMode === 'file') {
      currentRules = cleanMapping(mapping);
    } else if (configMode === 'manual') {
      currentRules = cleanMapping(manualMapping);
    } else {
      setIsSaving(false);
      return;
    }
    
    const payload = {
      name: mappingName.trim(),
      rules: currentRules,
      entityId: entityId || null,
      entityType: entityType || null,
    };
    
    try {
      await apiFetch("/mapping-templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await fetchUserMappings();

      setErrorMessage(null);
      setSuccessMessage("Mapping enregistré avec succès !");

      // reset
      setMappingName("");

      // fermer après un petit délai (UX propre)
      setTimeout(() => {
        closeModal();
        setSuccessMessage(null);
      }, 800);
      // Optionnel: afficher un message de succès
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setErrorMessage("Impossible d'enregistrer le mapping");
    } finally {
      setIsSaving(false);
    }
  }, [configMode, mapping, manualMapping, mappingName, entityId, entityType]);

  const handleFileInputClick = useCallback(() => {
    document.getElementById('mapping-file-input')?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  // CORRECTION : La validation pour le bouton Enregistrer
  const canSaveMapping = useMemo(() => {
    if (configMode === 'file') {
      return mappingName.trim() !== "" && isComplete && hasFile;
    }
    if (configMode === 'manual') {
      return mappingName.trim() !== "" && isManualComplete;
    }
    return false;
  }, [configMode, mappingName, isComplete, hasFile, isManualComplete]);

  const getImportButtonDisabled = useCallback(() => {
    if (configMode === 'file') return !isComplete || !hasFile;
    if (configMode === 'manual') return !isManualComplete;
    if (configMode === 'saved') return !selectedSavedMapping;
    return false;
  }, [configMode, isComplete, hasFile, isManualComplete, selectedSavedMapping]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1600px] h-[90vh] flex flex-col p-0 bg-white rounded-xl overflow-hidden">
          {errorMessage && (
            <div className="flex-shrink-0 mx-4 mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                {errorMessage}
              </p>
            </div>
          )}
          {successMessage && (
            <div className="flex-shrink-0 mx-4 mt-4 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
              <p className="text-xs text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                {successMessage}
              </p>
            </div>
          )}
          
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
                    <p className="text-xs text-slate-500">
                      {configMode === 'file'
                        ? "Associez les colonnes de votre fichier aux champs attendus par le système"
                        : configMode === 'manual'
                        ? "Saisissez manuellement le nom de chaque colonne de votre fichier"
                        : "Choisissez un mapping déjà configuré"}
                    </p>
                  </div>
                </div>

                {/* Champ nom du mapping - visible en mode fichier et manuel */}
                {(configMode === 'file' || configMode === 'manual') && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600">
                      Nom du mapping <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mappingName}
                      onChange={(e) => setMappingName(e.target.value)}
                      placeholder="Ex: Mapping fournisseur A"
                      className="w-64 px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="Nom du mapping"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setConfigMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      configMode === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    aria-label="Configuration par fichier"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Par fichier
                  </button>
                  <button
                    onClick={() => setConfigMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      configMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    aria-label="Configuration manuelle"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    Manuel
                  </button>
                  <button
                    onClick={() => setConfigMode('saved')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      configMode === 'saved' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    aria-label="Mappings sauvegardés"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Mappings sauvegardés
                    {userMappings.length > 0 && (
                      <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1 rounded-full">
                        {userMappings.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden flex flex-row min-h-0">
            {configMode === 'file' ? (
              <>
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-slate-100 bg-slate-50/30">
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
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md transition-all ${
                            showMappedOnly ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          aria-label={showMappedOnly ? "Afficher toutes les colonnes" : "Afficher uniquement les colonnes mappées"}
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
                          aria-label="Rechercher une colonne"
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
                          <p className="text-[10px] text-slate-400 mt-1">
                            Importez d'abord un fichier Excel/CSV/TXT
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={handleFileInputClick}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Importer fichier
                        </Button>

                        <input
                          id="mapping-file-input"
                          type="file"
                          accept=".csv, .xlsx"
                          className="hidden"
                          onChange={handleFileChange}
                          aria-label="Fichier d'import"
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
                              className={`group p-1.5 rounded-md transition-all ${
                                isMapped
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : "bg-white border border-slate-200 hover:border-primary/40"
                              }`}
                              role="button"
                              tabIndex={0}
                              aria-label={`Colonne ${h} ${isMapped ? `mappée vers ${mappedTo}` : "non mappée"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {isMapped
                                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                    : <div className="h-3 w-3 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                  }
                                  <span className={`text-[11px] truncate ${isMapped ? "font-medium text-emerald-700" : "text-slate-700"}`} title={h}>
                                    {h}
                                  </span>
                                </div>
                                {isMapped && mappedTo && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-200 text-emerald-700 rounded-full ml-1 flex-shrink-0">
                                    → {mappedTo}
                                  </span>
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

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
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
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md transition-all ${
                          showOnlyRequired
                            ? "bg-primary/10 text-primary font-medium"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        aria-label={showOnlyRequired ? "Afficher tous les champs" : "Afficher uniquement les champs requis"}
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
                            className={`rounded-md border p-2 transition-all ${
                              field.required ? "bg-white border-slate-200" : "bg-slate-50/50 border-slate-100"
                            } ${isMapped ? "border-emerald-200 bg-emerald-50/5" : ""}`}
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
                                className={`flex-1 min-w-0 px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                                  !hasFile ? "bg-slate-50 text-slate-400 cursor-not-allowed" :
                                  isMapped
                                    ? "border-emerald-200 bg-emerald-50/30 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                                aria-label={`Sélectionner une colonne pour le champ ${field.name}`}
                              >
                                <option value="none">— Sélectionner —</option>
                                {csvHeaders.map((h) => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : configMode === 'manual' ? (
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                <div className="flex-shrink-0 p-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <PenTool className="h-3.5 w-3.5 text-primary" />
                        Saisie manuelle
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Saisissez le nom exact des colonnes de votre fichier
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOnlyRequired(!showOnlyRequired)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md transition-all ${
                        showOnlyRequired
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      aria-label={showOnlyRequired ? "Afficher tous les champs" : "Afficher uniquement les champs requis"}
                    >
                      <Filter className="h-2.5 w-2.5" />
                      {showOnlyRequired ? "Requis" : "Tous"}
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-600 font-medium">Progression du mapping</span>
                      <span className={manualMappedRequired === requiredColumns.length ? "text-emerald-600 font-semibold" : "text-slate-600"}>
                        {manualMappedRequired} / {requiredColumns.length} requis
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(manualMappedRequired / requiredColumns.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {displayedColumns.map((field) => {
                      const sourceValue = Object.entries(manualMapping).find(([, v]) => v === field.name)?.[0] || "";
                      const isMapped = sourceValue.trim() !== "";
                      
                      return (
                        <div
                          key={field.name}
                          className={`rounded-lg border p-3 transition-all ${
                            field.required ? "bg-white border-slate-200" : "bg-slate-50/50 border-slate-100"
                          } ${isMapped ? "border-emerald-200 bg-emerald-50/10" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <label htmlFor={`manual-${field.name}`} className={`text-sm font-semibold ${field.required ? "text-slate-800" : "text-slate-600"}`}>
                                {field.name}
                              </label>
                              {field.required && (
                                <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Requis</span>
                              )}
                            </div>
                            {isMapped && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full truncate max-w-[200px]" title={sourceValue}>
                                ← {sourceValue}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 w-full">
                            <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isMapped ? "text-emerald-500" : "text-slate-400"}`} />
                            <input
                              id={`manual-${field.name}`}
                              type="text"
                              value={sourceValue}
                              onChange={(e) => handleManualMappingChange(field.name, e.target.value)}
                              placeholder="Nom exact de la colonne dans votre fichier..."
                              className={`flex-1 min-w-0 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                                isMapped
                                  ? "border-emerald-200 bg-emerald-50/30 text-emerald-700 placeholder:text-emerald-300"
                                  : "border-slate-200 bg-white text-slate-600 placeholder:text-slate-400"
                              }`}
                              aria-label={`Nom de la colonne pour le champ ${field.name}`}
                            />
                          </div>
                          
                          {!isMapped && field.required && (
                            <p className="text-[10px] text-amber-600 mt-1 ml-5">
                              Ce champ est requis pour l'import
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                <div className="flex-shrink-0 p-3 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold text-slate-700">
                      Mes mappings sauvegardés
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cliquez sur un mapping pour voir ses détails et l'utiliser
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3">
                  {isLoadingMappings ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : userMappings.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
                        <Database className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">Aucun mapping sauvegardé</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Configurez un mapping et enregistrez-le pour le réutiliser
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userMappings.map((mappingItem) => (
                        <Card
                          key={mappingItem.id}
                          className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-primary/30"
                          onClick={() => viewMappingDetail(mappingItem)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              viewMappingDetail(mappingItem);
                            }
                          }}
                          aria-label={`Voir les détails du mapping ${mappingItem.name}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Database className="h-3.5 w-3.5 text-primary/60" />
                                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                                    {mappingItem.name}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(mappingItem.createdAt)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {Object.keys(mappingItem.rules).length} champs mappés
                                  </span>
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <DialogFooter className="p-3 border-t bg-slate-50/50">
              <div className="flex flex-wrap gap-2 w-full justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={clearMapping}
                    className="text-[10px] text-slate-500 hover:text-amber-600 transition-colors px-2 py-1"
                    aria-label="Effacer le mapping actuel"
                  >
                    ✕ Effacer le mapping actuel
                  </button>
                </div>
                <div className="flex gap-2">
                  {(configMode === 'file' || configMode === 'manual') && (
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentMapping}
                      className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700"
                      disabled={!canSaveMapping || isSaving}
                      aria-label="Enregistrer le mapping"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  )}
                  {showImportButton && (
                    <Button
                      size="sm"
                      onClick={handleImportClick}
                      className="h-7 text-xs px-3 bg-primary hover:bg-primary/90"
                      disabled={getImportButtonDisabled() || isSaving}
                      aria-label="Importer les données"
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
      />
    </>
  );
}