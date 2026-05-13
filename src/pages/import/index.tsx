"use client";
import * as XLSX from 'xlsx';
import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Sheet, Plug, ArrowRight, FileUp, Settings } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { EntitySelector } from "@/features/import/EntitySelector";
import { cleanMapping } from "@/features/import/MappingUtils";
import { SavedMappingModal } from "@/features/import/SavedMappingModal";
import { UploadZone } from "@/features/import/UploadZone";
import { ImportInProgress } from "@/features/import/ImportInProgress";
import { ImportHistory } from "@/features/import/ImportHistory";
import { MappingModal } from "@/features/import/MappingModal";
import { ValidationErrorsModal } from "@/features/import/ValidationErrorsModal";
import { ConfirmReplaceDialog } from "@/features/import/ConfirmReplaceDialog";
import { RollbackConfirmDialog } from "@/features/import/RollbackConfirmDialog";
import { ApiTabContent } from "@/features/import/ApiTabContent";
import { Basic_COLUMNS } from "@/features/import/constants";
import { ImportHistoryRow, ImportProgress, ValidationError, SavedMapping, MappingPayload } from "@/features/import/types";
import { useRouter } from 'next/navigation';
import { ImportGuide } from '@/features/import/ImportGuide';
import { ImportSuccessModal } from '@/features/import/ImportSuccessModal';

function decodeBuffer(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);

  // Log les premiers octets pour voir l'encodage réel
  console.log("PREMIERS OCTETS:", Array.from(uint8Array.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' '));

  // BOM UTF-8
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    console.log("ENCODAGE DÉTECTÉ: UTF-8 avec BOM");
    return new TextDecoder("utf-8").decode(buffer);
  }

  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    const result = utf8Decoder.decode(buffer);
    console.log("ENCODAGE DÉTECTÉ: UTF-8 strict OK");
    console.log("RÉSULTAT DÉBUT:", result.substring(0, 100));
    return result;
  } catch (e) {
    console.log("ENCODAGE DÉTECTÉ: Windows-1252 (UTF-8 a échoué)");
    const result = new TextDecoder("windows-1252").decode(buffer);
    console.log("RÉSULTAT DÉBUT:", result.substring(0, 100));
    return result;
  }
}
export default function ImportPage() {
  const companies = useCompanies();
  const router = useRouter();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState("excel");
  const [importsInProgress, setImportsInProgress] = useState<ImportProgress[]>([]);
  const [history, setHistory] = useState<ImportHistoryRow[]>([]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [confirmReplaceInput, setConfirmReplaceInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<ImportHistoryRow | null>(null);
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'Group' | 'Company' | 'BusinessUnit' | null>(null);

  const [selectedSavedMapping, setSelectedSavedMapping] = useState<SavedMapping | null>(null);
  const [savedMappingModalOpen, setSavedMappingModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMappingId, setPendingMappingId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const selectedEntityIdRef = useRef(selectedEntityId);
  const selectedEntityTypeRef = useRef(selectedEntityType);
  const [successDetails, setSuccessDetails] = useState<{
    totalProcessed?: number;
    skippedLines?: number;
    newFiscalYearsCount?: number;
    fiscalYears?: {
      entityName: string | null;
      entityType: string;
      calendarYear: number;
      startDate: string;
      endDate: string;
      isNew: boolean;
      linesCount: number;
    }[];
    dataImports?: {
      entityName: string | null;
      entityType: string;
      linesCount: number;
    }[];
  } | null>(null);
  const [successSimpleMessage, setSuccessSimpleMessage] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [hasData, setHasData] = useState<boolean | null>(null);
  const { user: currentUser, accessToken } = usePermissionsContext();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const isEndUser = currentUser?.role === 'END_USER';
  const isManager = currentUser?.role === 'MANAGER';
  const [includeDescendants, setIncludeDescendants] = useState(false);
  const isImportingRef = useRef(false);
  useEffect(() => {
  selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityId]);

  useEffect(() => {
    selectedEntityTypeRef.current = selectedEntityType;
  }, [selectedEntityType]);
  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>("/generic-import/history", {
        method: "GET",
        snackbar: { showError: false, showSuccess: false },
      });

      const mapped: ImportHistoryRow[] = data.map((item) => ({
        id: item.id,
        file: item.file,
        date: item.date,
        status: item.status,
        entityType: item.entityType ?? "—",
        entityName: item.entityName ?? "—",
        entityId: item.entityId,
        user: item.user,
        linesCount: item.linesCount,
        errorMessage: item.errorMessage ?? null,
      }));

      setHistory(mapped);
    } catch (err) {
      console.error("Erreur load history:", err);
    }
  }, []);

  
     
  

  useEffect(() => {
    companies.fetchList();
    fetchHistory();
  }, []);

  // ← AJOUTE ICI
  useEffect(() => {
    const hasProcessing = history.some((row) => row.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      await fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [history, fetchHistory]);

  const companyList = companies.list ?? [];

  const applySavedMapping = (savedMapping: SavedMapping) => {
    setSelectedSavedMapping(savedMapping);

    if (csvFile && csvHeaders.length > 0) {
      const newMapping: Record<string, string> = {};
      csvHeaders.forEach(header => {
        if (savedMapping.rules[header]) {
          newMapping[header] = savedMapping.rules[header];
        } else {
          const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === header.toLowerCase());
          newMapping[header] = match ? match.name : "";
        }
      });
      setMapping(newMapping);
      setMappingOpen(true);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (json.length > 0) {
        const headers = json[0] as string[];
        setCsvHeaders(headers);
        const initialMapping: Record<string, string> = {};
        headers.forEach((h) => {
          const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
          initialMapping[h] = match ? match.name : "";
        });
        setMapping(initialMapping);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const handleDrop = useCallback((e: React.DragEvent, type: "excel") => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;

    setCsvFile(null);
    setCsvHeaders([]);
    setMapping({});

    const isCsv = f.name.endsWith(".csv");
    const isExcel = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
    const isTxt = f.name.endsWith(".txt");

    if (type === "excel" && !isCsv && !isExcel && !isTxt) return;

    if (type === "excel") {
      setCsvFile(f);
      const reader = new FileReader();

      reader.onload = (event) => {
        let headers: string[] = [];

        if (isExcel) {
          // Pour les fichiers binaire .xlsx ou .xls, SheetJS gère très bien tout seul
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || "");
        } else {
          // POUR LE CSV / TXT : On gère l'encodage NOUS-MÊMES
          const buffer = event.target?.result as ArrayBuffer;
          const text = decodeBuffer(buffer); // Utilise la fonction améliorée ci-dessus

          // On passe le texte décodé à SheetJS au lieu du buffer brut
          const workbook = XLSX.read(text, { type: "string" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || "");
        }

        setCsvHeaders(headers);

        let initialMapping: Record<string, string> = {};

        if (selectedSavedMapping) {
          headers.forEach((h) => {
            if (selectedSavedMapping.rules[h]) {
              initialMapping[h] = selectedSavedMapping.rules[h];
            } else {
              const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
              initialMapping[h] = match ? match.name : "";
            }
          });
          setSelectedSavedMapping(null);
        } else {
          headers.forEach((h) => {
            const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
            initialMapping[h] = match ? match.name : "";
          });
        }

        setMapping(initialMapping);
        setMappingOpen(true);
      };

      // FIX : toujours lire en ArrayBuffer (plus readAsText)
      reader.readAsArrayBuffer(f);
    }
  }, [selectedSavedMapping]);

  const parseHeaders = (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          resolve((json[0] as string[]) || []);
        } else {
          // FIX ENCODAGE : détecter UTF-8 vs Windows-1252
          const buffer = event.target?.result as ArrayBuffer;
          const text = decodeBuffer(buffer);
          resolve(text.split("\n")[0].split(/[,\t;|]/).map((h) => h.trim().replace(/^"|"$/g, "")));
        }
      };
      // FIX : toujours lire en ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  };

  const handleEntityChange = async (
    entityId: string,
    entityType: 'Group' | 'Company' | 'BusinessUnit'
  ) => {
    // Reset complet si entityId vide (reclique sur le même type ou changement de type)
    if (!entityId) {
      setSelectedEntityId(null);
      setSelectedEntityType(selectedEntityType === entityType ? null : entityType);
      setWorkspaceId(null);
      setPeriodStart('');
      setPeriodEnd('');
      setHasData(null);
      setIncludeDescendants(false);
      return;
    }

    // Sélection normale d'une entité
    setSelectedEntityId(entityId);
    setSelectedEntityType(entityType);
    setWorkspaceId(null);
    setPeriodStart('');
    setPeriodEnd('');
    setIncludeDescendants(false);

    try {
      if (entityType === 'Company') {
        const company = await apiFetch<{ workspace_id: string }>(
          `/companies/${entityId}`,
          { snackbar: { showSuccess: false, showError: false } }
        );
        setWorkspaceId(company.workspace_id ?? null);
      } else if (entityType === 'Group') {
        const group = await apiFetch<{ workspace_id: string }>(
          `/groups/${entityId}`,
          { snackbar: { showSuccess: false, showError: false } }
        );
        setWorkspaceId(group.workspace_id ?? null);
      }  else if (entityType === 'BusinessUnit') {
      const bu = await apiFetch<{ workspace_id: string; company_id: string }>(
        `/business-units/${entityId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      
      if (bu.workspace_id) {
        setWorkspaceId(bu.workspace_id);
      } else if (bu.company_id) {
        // Remonter à la company pour récupérer le workspace
        const company = await apiFetch<{ workspace_id: string }>(
          `/companies/${bu.company_id}`,
          { snackbar: { showSuccess: false, showError: false } }
        );
        setWorkspaceId(company.workspace_id ?? null);
      }
    }
    } catch {
      setWorkspaceId(null);
    }
  };
  const recheckEntityData = useCallback(async (entityId: string, entityType: string) => {
  try {
    const response = await apiFetch<{ hasData: boolean }>(
      `/generic-import/entityType/${entityId}/has-data?entityType=${entityType}`,
      { snackbar: { showSuccess: false, showError: false } }
    );
    setHasData(response.hasData);
  } catch {
    // silencieux
  }
}, []);

  const performImport = async (
    existingMappingId?: string,
    fileOverride?: File,
    entityIdOverride?: string,
    entityTypeOverride?: 'Group' | 'Company' | 'BusinessUnit'
  ) => {
    if (isImportingRef.current) {
      console.log("Import déjà en cours, ignore");
      return;
    }

    const fileToUse = fileOverride ?? csvFile;
    const entityId = entityIdOverride ?? selectedEntityId;
    const entityType = entityTypeOverride ?? selectedEntityType;

    if (!fileToUse || !entityId || !entityType) {
      console.error("Paramètres manquants :", { fileToUse, entityId, entityType });
      return;
    }

    if (!workspaceId && !isAdmin) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "Impossible de déterminer le workspace de l'entité sélectionnée.",
        message: "Workspace manquant pour l'import local."
      }]);
      setValidationModalOpen(true);
      return;
    }

    if (hasData && (!periodStart || !periodEnd)) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "Cette entité a des données existantes. Veuillez sélectionner une période de remplacement.",
        message: "Période de remplacement obligatoire."
      }]);
      setValidationModalOpen(true);
      setIsSubmitting(false);
      return;
    }

    if (hasData && periodEnd < periodStart) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "La date de fin de période doit être après la date de début.",
        message: "Dates de période invalides."
      }]);
      setValidationModalOpen(true);
      setIsSubmitting(false);
      return;
    }

    isImportingRef.current = true;
    setIsSubmitting(true);

    try {
      let mappingId: string;

      if (existingMappingId) {
        mappingId = existingMappingId;
      } else {
        const cleanedRules = cleanMapping(mapping);
        const effectiveScope = workspaceId ? 'LOCAL' : 'GLOBAL';

        const templateData = await apiFetch<any>("/mapping-templates", {
          method: 'POST',
          body: JSON.stringify({
            name: `Mapping_${fileToUse.name}_${new Date().toLocaleDateString()}`,
            rules: cleanedRules,
            entityId,
            entityType,
            workspaceId: workspaceId ?? null,
            scope: effectiveScope,
          }),
          snackbar: { showSuccess: false, showError: false },
        });

        if (!templateData?.id) throw new Error("L'API n'a pas retourné d'ID de mapping.");
        mappingId = templateData.id;
      }

      const formData = new FormData();
      formData.append('file', fileToUse);
      formData.append('mappingId', mappingId);
      formData.append('entityId', entityId);
      formData.append('entityType', entityType);
      formData.append(
        'includeDescendants',
        entityType === 'BusinessUnit' ? 'false' : String(includeDescendants)
      );
      if (periodStart) formData.append('periodStart', periodStart);
      if (periodEnd) formData.append('periodEnd', periodEnd);

      // ─── MODIFIÉ : appel simple, résultat vie sse ───
      try {
        const formDataLog: Record<string, any> = {};
        formData.forEach((value, key) => {
          formDataLog[key] = value instanceof File ? `[File: ${value.name}, ${value.size} bytes]` : value;
        });
        console.log("📤 DONNÉES ENVOYÉES AU BACKEND:", JSON.stringify(formDataLog, null, 2));
        await apiFetch<any>("/generic-import", {
          method: 'POST',
          body: formData,
          snackbar: { showSuccess: false, showError: false },
        });
        setSuccessTitle("Import en cours ⏳");
        setSuccessDetails(null);
        setSuccessSimpleMessage("Votre fichier est en cours de traitement. Un email vous sera envoyé dès que ce sera terminé.");
        setSuccessModalOpen(true);
        // Réinitialisation du formulaire — succès/erreurs métier arrivent via WebSocket
        // APRÈS
        setCsvFile(null);
        setCsvHeaders([]);
        setConfirmReplaceOpen(false);
        setConfirmReplaceInput("");
        setPendingMappingId(null);

        await fetchHistory();
        await recheckEntityData(entityId, entityType); // ← rafraîchit hasData immédiatement

        // Recheck différé pour rattraper la fin du job BullMQ
        setTimeout(async () => {
          await fetchHistory();
          await recheckEntityData(entityId, entityType);
        }, 8000);
      } catch (apiError: unknown) {
        // Erreurs HTTP immédiates uniquement (réseau, auth, 400 du controller...)
        if (apiError instanceof ApiError) {
          setValidationErrors([{
            line: 0, column: 'N/A', value: '',
            reason: apiError.message,
            message: apiError.message,
          }]);
        } else if (apiError instanceof Error) {
          setValidationErrors([{
            line: 0, column: 'N/A', value: '',
            reason: apiError.message,
            message: apiError.message,
          }]);
        }
        setValidationModalOpen(true);
      }
      // ─────────────────────────────────────────────────────

    } catch (error: any) {
      console.error("Erreur inattendue:", error);
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: error.message || 'Erreur inconnue',
        message: error.message || 'Erreur inconnue'
      }]);
      setValidationModalOpen(true);
    } finally {
      setIsSubmitting(false);
      isImportingRef.current = false;
    }
  };

  const handleForceReplace = async () => {
    if (confirmReplaceInput !== "REMPLACER") return;
    await performImport(
      pendingMappingId ?? undefined,
      pendingFile ?? undefined,
      selectedEntityId ?? undefined,
      selectedEntityType ?? undefined
    );
    setPendingMappingId(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: "excel" | "api") => {
    const f = e.target.files?.[0];
    if (!f) return;

    const isValid = f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv") || f.name.endsWith(".txt");
    if (type !== "excel" || !isValid) return;

    e.target.value = "";

    setCsvFile(f);
    setPendingFile(f);
    const headers = await parseHeaders(f);
    setCsvHeaders(headers);
    const initialMapping: Record<string, string> = {};
    headers.forEach((h) => {
      const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
      initialMapping[h] = match ? match.name : "";
    });
    setMapping(initialMapping);

    setSavedMappingModalOpen(true);
  }, []);

  const validateAndSaveMapping = async (incomingMapping?: Record<string, string>) => {
    const finalMapping = incomingMapping ?? mapping;

    const errors: ValidationError[] = [];

    const mappedFields = Object.values(finalMapping).filter(
      (v): v is string => typeof v === "string" && v.trim() !== ""
    );

    Basic_COLUMNS.filter(col => col.required).forEach(col => {
      if (!mappedFields.includes(col.name)) {
        errors.push({
          line: 0,
          column: col.name,
          value: '',
          reason: `Le champ "${col.name}" est obligatoire pour l'import.`,
          message: `Le champ "${col.name}" est obligatoire pour l'import.`
        });
      }
    });

    setValidationErrors(errors);

    if (errors.length > 0) {
      setMappingOpen(false);
      setValidationModalOpen(true);
      return;
    }

    setMapping(finalMapping);
    setIsSubmitting(true);

    try {
      const templatePayload: MappingPayload = {
        name: `Mapping_${new Date().toISOString()}`,
        rules: finalMapping,
      };
      if (selectedEntityId && selectedEntityType) {
        templatePayload.entityId = selectedEntityId;
        templatePayload.entityType = selectedEntityType;
      }
      await apiFetch("/mapping-templates", {
        method: "POST",
        body: JSON.stringify(templatePayload),
        snackbar: {
          showSuccess: true,
          showError: false,
          successMessage: "✅ Mapping validé et sauvegardé avec succès !",
        },
      });

      setMappingOpen(false);
    }  catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Erreur inconnue';
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: message,
        message,
      }]);
      setValidationModalOpen(true);
    } finally  {
          setIsSubmitting(false);
        }
      };

  const handleSelectSavedMapping = async (savedMapping: SavedMapping) => {
    try {
      const fileToUse = pendingFile;
      const entityId = selectedEntityId;
      const entityType = selectedEntityType;
      // --- 1. Vérification granulaire des pré-requis ---
      if (!fileToUse || !entityId || !entityType) {
        let errorMessage = "";

        if (!fileToUse && (!entityId || !entityType)) {
          errorMessage = "Veuillez sélectionner une entité et un fichier avant d'importer.";
        } else if (!fileToUse) {
          errorMessage = "Veuillez sélectionner un fichier avant d'importer.";
        } else {
          errorMessage = "Veuillez sélectionner une entité avant d'importer.";
        }
        setValidationErrors([{
          line: 0,
          column: 'N/A',
          value: '',
          reason: errorMessage,
          message: errorMessage
        }]);
        setValidationModalOpen(true);
        return;
      }
      const newMapping: Record<string, string> = {};
      csvHeaders.forEach((h) => {
        newMapping[h] = savedMapping.rules[h] ??
          (Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase())?.name ?? "");
      });
      setMapping(newMapping);

      await performImport(savedMapping.id, fileToUse, entityId, entityType);
    } catch (error) {
      console.error("Erreur dans handleSelectSavedMapping:", error);

      let mappedErrors: ValidationError[] = [];

      if (error instanceof ApiError) {
        if (error.details?.code === 'MAPPING_MISMATCH') {
          mappedErrors = [{
            line: 0,
            column: 'N/A',
            value: '',
            reason: "Le fichier ne correspond pas au mapping sélectionné. Les colonnes de votre fichier ne correspondent pas aux colonnes attendues par le mapping.",
            message: "Le fichier ne correspond pas au mapping sélectionné."
          }];
        } else {
          mappedErrors = [{
            line: 0,
            column: 'N/A',
            value: '',
            reason: error.details?.message || error.message,
            message: error.details?.message || error.message
          }];
        }
      } else if (error instanceof Error) {
        mappedErrors = [{
          line: 0,
          column: 'N/A',
          value: '',
          reason: error.message,
          message: error.message
        }];
      }

      if (mappedErrors.length > 0) {
        setValidationErrors(mappedErrors);
        setValidationModalOpen(true);
      }
    }
  };

  const handleConfirmReplace = async () => {
    if (!csvFile) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "Veuillez d'abord sélectionner un fichier.",
        message: "Veuillez d'abord sélectionner un fichier."
      }]);
      setValidationModalOpen(true);
      return;
    }

    if (!selectedEntityId || !selectedEntityType) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "Veuillez sélectionner une entité avant d'importer.",
        message: "Veuillez sélectionner une entité avant d'importer."
      }]);
      setValidationModalOpen(true);
      return;
    }

    // ← PLUS de checkEntityHasData ici, on fait confiance au state hasData
    // Si hasData est true et période non renseignée, performImport le bloquera
    await performImport();
  };

  const handleImport = () => {
    if (hasData === true && (!periodStart || !periodEnd)) {
      setValidationErrors([{
        line: 0, column: 'N/A', value: '',
        reason: "Cette entité a des données existantes. Veuillez sélectionner une période de remplacement avant d'importer.",
        message: "Période de remplacement obligatoire."
      }]);
      setValidationModalOpen(true);
      return;
    }
    setMappingOpen(false);
    handleConfirmReplace();
  };

  return (
    <AppLayout
      title="Import des données comptables"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
    >
      <Head>
        <title>Import</title>
      </Head>
      <ImportSuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        title={successTitle}
        totalProcessed={successDetails?.totalProcessed}
        skippedLines={successDetails?.skippedLines}
        newFiscalYearsCount={successDetails?.newFiscalYearsCount}
        fiscalYears={successDetails?.fiscalYears}
        dataImports={successDetails?.dataImports}
        simpleMessage={successSimpleMessage}
      />

      <div className="space-y-8">
        <PageHeader
          title="Import des données comptables"
          subtitle="Importez vos fichiers comptables en toute sécurité"
          icon={
            <div className="nebula-glass rounded-2xl border border-white/10 p-2.5">
              <FileUp className="h-5 w-5 text-(--nebula-gold-light)" />
            </div>
          }
        />
        <ImportGuide />

        <EntitySelector
          selectedEntityId={selectedEntityId}
          selectedEntityType={selectedEntityType}
          onEntityChange={handleEntityChange}
          disabled={isEndUser}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodChange={(start, end) => { setPeriodStart(start); setPeriodEnd(end); }}
          hasData={hasData}
          onHasDataChange={setHasData}
          includeDescendants={includeDescendants}
          onIncludeDescendantsChange={setIncludeDescendants}
        />


        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full gap-1 rounded-xl border border-white/10 bg-white/5 p-1.5 sm:h-12 sm:w-auto">
              <TabsTrigger value="excel" className="gap-2 flex-1 rounded-lg border border-transparent px-4 py-2 text-foreground hover:bg-muted hover:text-foreground [&[aria-selected=true]]:border-border [&[aria-selected=true]]:bg-muted [&[aria-selected=true]]:text-foreground [&[aria-selected=true]]:shadow-none">
                <Sheet className="h-4 w-4" />
                Excel / CSV
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2 flex-1 rounded-lg border border-transparent px-4 py-2 text-foreground hover:bg-muted hover:text-foreground [&[aria-selected=true]]:border-border [&[aria-selected=true]]:bg-muted [&[aria-selected=true]]:text-foreground [&[aria-selected=true]]:shadow-none">
                <Plug className="h-4 w-4" />
                API
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={() => setMappingOpen(true)}
                disabled={isEndUser}
                title={isEndUser ? "Accès restreint" : undefined}
              >
                <Settings className="h-4 w-4" />
                Mappings
              </Button>
            </div>
          </div>
          <TabsContent value="excel" className="mt-6 space-y-4">
            <UploadZone
              type="excel"
              accept=".csv,.xlsx,.xls,.txt"
              inputId="excel-upload"
              title="Import Excel / CSV / TXT"
              subtitle="Glissez-déposez votre fichier ici"
              formats=".csv, .xlsx, .xls, .txt"
              dragOver={dragOver}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onFileInput={handleFileInput}
              disabled={isEndUser}
              fileName={csvFile?.name}
            />
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <ApiTabContent />
          </TabsContent>
        </Tabs>

        <ImportInProgress imports={importsInProgress} />

        <ImportHistory
          history={history}
          historyOpen={historyOpen}
          onToggle={() => setHistoryOpen(!historyOpen)}
          onRollback={(row) => {
            setRollbackTarget(row);
            setRollbackConfirmOpen(true);
          }}
          onViewEntries={(row) => {
            void router.push(
              `/import/entries?file=${encodeURIComponent(row.file)}&dataImportId=${encodeURIComponent(row.id)}`
            );
          }}
          disabled={isEndUser}
          currentUserEmail={currentUser?.email}
          isManager={isManager}
        />
      </div>

      <MappingModal
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        csvHeaders={csvHeaders}
        mapping={mapping}
        onMappingChange={setMapping}
        onValidateMapping={validateAndSaveMapping}
        onImport={handleImport}
        isSubmitting={isSubmitting}
        entityId={selectedEntityId}
        entityType={selectedEntityType}
        showImportButton={!!csvFile}
        onFileUpload={handleFileUpload}
        workspaceId={workspaceId}
        hasData={hasData}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onSaveSuccess={(title, message) => {
          setSuccessTitle(title);
          setSuccessDetails(null);
          setSuccessSimpleMessage(message);
          setSuccessModalOpen(true);
        }}
        onSaveError={(message) => {
          setValidationErrors([{
            line: 0, column: 'N/A', value: '',
            reason: message,
            message,
          }]);
          setValidationModalOpen(true);
        }}
        onDeleteSuccess={(mappingName) => {
          setSuccessTitle("Mapping supprimé ✅");
          setSuccessDetails(null);
          setSuccessSimpleMessage(`Le mapping « ${mappingName} » a été supprimé avec succès.`);
          setSuccessModalOpen(true);
        }}
      />

      <SavedMappingModal
        open={savedMappingModalOpen}
        onOpenChange={setSavedMappingModalOpen}
        fileName={csvFile?.name ?? ""}
        onSelectMapping={handleSelectSavedMapping}
        onCreateNew={() => setMappingOpen(true)}
        workspaceId={workspaceId}
      />

      <ValidationErrorsModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        errors={validationErrors}
      />

      <ConfirmReplaceDialog
        open={confirmReplaceOpen}
        onOpenChange={setConfirmReplaceOpen}
        confirmInput={confirmReplaceInput}
        onConfirmInputChange={setConfirmReplaceInput}
        onConfirm={handleForceReplace}
      />

      <RollbackConfirmDialog
        open={rollbackConfirmOpen}
        onOpenChange={setRollbackConfirmOpen}
        target={rollbackTarget}
        onConfirm={async () => {
          if (!rollbackTarget) return;
          try {
            await apiFetch("/generic-import/restore", {
              method: "POST",
              body: JSON.stringify({
                dataImportId: rollbackTarget.id,
                entityId: rollbackTarget.entityId,
                entityType: rollbackTarget.entityType,
              }),
              snackbar: { showSuccess: true, showError: true, successMessage: "✅ Import restauré avec succès !" },
            });
            await fetchHistory();
          } catch (err) {
            console.error("Erreur restauration:", err);
          }
          setRollbackConfirmOpen(false);
          setRollbackTarget(null);
        }}
      />
    </AppLayout>
  );
}