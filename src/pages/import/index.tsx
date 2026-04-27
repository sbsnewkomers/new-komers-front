"use client";
import * as XLSX from 'xlsx';
import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Sheet, Plug, ArrowRight, FileUp, Settings } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { Toast } from "@/components/ui/Toast";
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
  const [selectedEntityType, setSelectedEntityType] = useState<'Group' | 'Company' | null>(null);
  
  const [selectedSavedMapping, setSelectedSavedMapping] = useState<SavedMapping | null>(null);
  const [savedMappingModalOpen, setSavedMappingModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMappingId, setPendingMappingId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    linesCount?: number;
    fileName?: string;
    entityName?: string;
  } | null>(null);

  // Récupération du rôle utilisateur courant
  const { user: currentUser } = usePermissionsContext();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const isEndUser = currentUser?.role === 'END_USER'; 
  const isManager = currentUser?.role === 'MANAGER';


  // Ref pour éviter les appels multiples
  const isImportingRef = useRef(false);
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
      const workbook = XLSX.read(data, { type: "array" });
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
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || "");
        } else {
          const text = reader.result as string;
          const firstLine = text.split("\n")[0];
          headers = firstLine.split(/[,\t;]/).map((h) => h.trim().replace(/^"|"$/g, ''));
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

      if (isExcel) {
        reader.readAsArrayBuffer(f);
      } else {
        reader.readAsText(f, "UTF-8");
      }
    }
  }, [selectedSavedMapping]);

  const parseHeaders = (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          resolve((json[0] as string[]) || []);
        } else {
          const text = event.target?.result as string;
          resolve(text.split("\n")[0].split(/[,\t;]/).map((h) => h.trim().replace(/^"|"$/g, "")));
        }
      };
      isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file, "UTF-8");
    });
  };

  const checkEntityHasData = async (entityId: string, entityType: 'Group' | 'Company'): Promise<boolean> => {
    try {
      const response = await apiFetch<{ hasData: boolean }>(
        `/generic-import/entityType/${entityId}/has-data?entityType=${entityType}`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      return response.hasData;
    } catch (error) {
      console.error("Erreur:", error);
      return false;
    }
  };

  const handleEntityChange = async (entityId: string, entityType: 'Group' | 'Company') => {
    setSelectedEntityId(entityId);
    setSelectedEntityType(entityType);
    setWorkspaceId(null);
    try {
      if (entityType === 'Company') {
        const company = await apiFetch<{ workspace_id: string }>(
          `/companies/${entityId}`,
          { snackbar: { showSuccess: false, showError: false } }
        );
        setWorkspaceId(company.workspace_id ?? null);
      } else {
        const group = await apiFetch<{ workspace_id: string }>(
          `/groups/${entityId}`,
          { snackbar: { showSuccess: false, showError: false } }
        );
        setWorkspaceId(group.workspace_id ?? null);
      }
    } catch {
      setWorkspaceId(null);
    }
  };

  const performImport = async (
    existingMappingId?: string,
    fileOverride?: File,
    entityIdOverride?: string,
    entityTypeOverride?: 'Group' | 'Company'
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

    // ── Vérification workspaceId pour les non-admins ───────────────────────
    // Les HEAD_MANAGER et MANAGER ne peuvent créer que des mappings locaux.
    // Sans workspaceId résolu, on bloque l'import plutôt que d'envoyer GLOBAL.
    if (!workspaceId && !isAdmin) {
      setValidationErrors([{
        line: 0,
        column: 'N/A',
        value: '',
        reason: "Impossible de déterminer le workspace de l'entité sélectionnée. Veuillez resélectionner l'entité.",
        message: "Workspace manquant pour l'import local."
      }]);
      setValidationModalOpen(true);
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

        // ── Calcul du scope pour le mapping auto-créé ──────────────────────
        // - workspaceId présent → LOCAL pour tout le monde
        // - workspaceId absent + admin → GLOBAL (cas légal)
        // - workspaceId absent + non-admin → déjà bloqué ci-dessus
        const effectiveScope = workspaceId ? 'LOCAL' : 'GLOBAL';

        const templatePayload: any = {
          name: `Mapping_${fileToUse.name}_${new Date().toLocaleDateString()}`,
          rules: cleanedRules,
          entityId,
          entityType,
          workspaceId: workspaceId ?? null,
          scope: effectiveScope,
        };

        const templateData = await apiFetch<any>("/mapping-templates", {
          method: 'POST',
          body: JSON.stringify(templatePayload),
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

      console.log("Envoi de la requête avec:", {
        fileName: fileToUse.name,
        fileSize: fileToUse.size,
        fileType: fileToUse.type,
        mappingId,
        entityId,
        entityType
      });

      let importResult;
      try {
        importResult = await apiFetch<any>("/generic-import", {
          method: 'POST',
          body: formData,
          snackbar: { showSuccess: false, showError: false },
        });
      } catch (apiError: unknown) {
        console.error("Erreur API capturée:", apiError);
        
        let mappedErrors: ValidationError[] = [];
        
        if (apiError instanceof ApiError) {
          if (apiError.details?.code === 'MAPPING_MISMATCH') {
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
              reason: apiError.details?.message || apiError.message,
              message: apiError.details?.message || apiError.message
            }];
          }
        } else if (apiError instanceof Error) {
          mappedErrors = [{
            line: 0,
            column: 'N/A',
            value: '',
            reason: apiError.message,
            message: apiError.message
          }];
        }
        
        if (mappedErrors.length > 0) {
          setValidationErrors(mappedErrors);
          setValidationModalOpen(true);
        }
        
        return;
      }

      console.log("Résultat de l'import:", importResult);

      if (importResult && importResult.success === false) {
        if (importResult.errors && Array.isArray(importResult.errors) && importResult.errors.length > 0) {
          const mappedErrors: ValidationError[] = importResult.errors.map((err: any) => ({
            line: err.line || 0,
            column: err.column || 'N/A',
            value: err.value || '',
            reason: err.reason || err.message || 'Erreur inconnue',
            message: err.reason || err.message
          }));
          
          setValidationErrors(mappedErrors);
          setValidationModalOpen(true);
        } else if (importResult.message) {
          setValidationErrors([{
            line: 0,
            column: 'N/A',
            value: '',
            reason: importResult.message,
            message: importResult.message
          }]);
          setValidationModalOpen(true);
        }
        
        return;
      }

      if (importResult && importResult.success === true) {
  // Récupérer le nom de l'entité pour le message de succès
  let entityName = '';
  try {
    if (entityType === 'Company') {
      const company = await apiFetch<{ name: string }>(
        `/companies/${entityId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      entityName = company.name;
    } else {
      const group = await apiFetch<{ name: string }>(
        `/groups/${entityId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );
      entityName = group.name;
    }
  } catch {
    entityName = entityId;
  }

  // Afficher le message de succès
  const linesCount = importResult.linesCount || importResult.count || 0;
  setSuccessMessage(`✅ Import réussi pour ${entityName}`);
  setSuccessDetails({
    linesCount: linesCount,
    fileName: fileToUse.name,
    entityName: entityName,
  });

  // Masquer automatiquement après 6 secondes
  setTimeout(() => {
    setSuccessMessage(null);
    setSuccessDetails(null);
  }, 6000);

  setConfirmReplaceOpen(false);
  setConfirmReplaceInput("");
  setPendingMappingId(null);
  setCsvFile(null);
  setCsvHeaders([]);
  setValidationErrors([]);
  setValidationModalOpen(false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await fetchHistory();
  setHistoryOpen(true);
}

    } catch (error: any) {
      console.error("Erreur inattendue:", error);
      setValidationErrors([{
        line: 0,
        column: 'N/A',
        value: '',
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
    //  Créer le mapping automatique (mais ne pas ouvrir le modal tout de suite)
    headers.forEach((h) => {
      const match = Basic_COLUMNS.find(col => col.name.toLowerCase() === h.toLowerCase());
      initialMapping[h] = match ? match.name : "";
    });
    setMapping(initialMapping);

    // Ouvrir le modal pour choisir entre mapping existant ou nouveau
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
          showError: true,
          successMessage: "✅ Mapping validé et sauvegardé avec succès !",
        },
      });

      setMappingOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSavedMapping = async (savedMapping: SavedMapping) => {
    try {
      const fileToUse = pendingFile;
      const entityId = selectedEntityId;
      const entityType = selectedEntityType;

      if (!fileToUse || !entityId || !entityType) {
        setValidationErrors([{
          line: 0,
          column: 'N/A',
          value: '',
          reason: "Veuillez sélectionner une entité et un fichier avant d'importer.",
          message: "Veuillez sélectionner une entité et un fichier avant d'importer."
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

      const hasData = await checkEntityHasData(entityId, entityType);
      if (hasData) {
        setPendingMappingId(savedMapping.id);
        setConfirmReplaceOpen(true);
        return;
      }

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
        line: 0,
        column: 'N/A',
        value: '',
        reason: "Veuillez d'abord sélectionner un fichier.",
        message: "Veuillez d'abord sélectionner un fichier."
      }]);
      setValidationModalOpen(true);
      return;
    }

    if (!selectedEntityId || !selectedEntityType) {
      setValidationErrors([{
        line: 0,
        column: 'N/A',
        value: '',
        reason: "Veuillez sélectionner une entité (Groupe ou Entreprise) avant d'importer.",
        message: "Veuillez sélectionner une entité (Groupe ou Entreprise) avant d'importer."
      }]);
      setValidationModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const hasData = await checkEntityHasData(selectedEntityId, selectedEntityType);
      
      if (hasData) {
        setConfirmReplaceOpen(true);
        setIsSubmitting(false);
        return;
      }

      await performImport();
    } catch (error) {
      console.error("Erreur dans handleConfirmReplace:", error);
      
      let mappedErrors: ValidationError[] = [];
      
      if (error instanceof ApiError) {
        mappedErrors = [{
          line: 0,
          column: 'N/A',
          value: '',
          reason: error.details?.message || error.message,
          message: error.details?.message || error.message
        }];
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = () => {
    setMappingOpen(false);
    handleConfirmReplace();
  };

  return (
    <AppLayout
      title="Import"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
    >
      <Head>
        <title>Import</title>
      </Head>
      {successMessage && (
      <Toast
        message={successMessage}
        type="success"
        details={successDetails || undefined}
        onClose={() => {
          setSuccessMessage(null);
          setSuccessDetails(null);
        }}
      />
    )}

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Importer des données</h2>
              <p className="text-sm text-slate-500">
                Importez vos fichiers comptables en toute sécurité
              </p>
            </div>
          </div>
        </div>
        
        <EntitySelector
          selectedEntityId={selectedEntityId}
          selectedEntityType={selectedEntityType}
          onEntityChange={handleEntityChange}
          disabled={isEndUser}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full gap-1 rounded-xl bg-slate-100 p-1.5 sm:h-12 sm:w-auto">
              <TabsTrigger value="excel" className="gap-2 flex-1 rounded-lg px-4 py-2 data-[state=active]:shadow-md">
                <Sheet className="h-4 w-4" />
                Excel / CSV
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2 flex-1 rounded-lg px-4 py-2 data-[state=active]:shadow-md">
                <Plug className="h-4 w-4" />
                API
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={() => setMappingOpen(true)}
                disabled={isEndUser}        // ← ajoute
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
            void router.push(`/import/entries?file=${encodeURIComponent(row.file)}`);
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