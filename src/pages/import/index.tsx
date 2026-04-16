"use client";
import * as XLSX from 'xlsx';
import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Sheet, Plug, ArrowRight, FileUp } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/apiClient";

import { EntitySelector } from "./EntitySelector";
import { cleanMapping } from './MappingUtils';
import { SavedMappingModal } from './SavedMappingModal';
import { UploadZone } from "./UploadZone";
import { ImportInProgress } from "./ImportInProgress";
import { ImportHistory } from "./ImportHistory";
import { MappingModal } from "./MappingModal";
import { ValidationErrorsModal } from "./ValidationErrorsModal";
import { ConfirmReplaceDialog } from "./ConfirmReplaceDialog";
import { RollbackConfirmDialog } from "./RollbackConfirmDialog";
import { ApiTabContent } from "./ApiTabContent";
import { Basic_COLUMNS } from "./constants";
import { ImportHistoryRow, ImportProgress, ValidationError, SavedMapping, MappingPayload } from "./types";

export default function ImportPage() {
  const companies = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState("excel");
  const [importsInProgress, setImportsInProgress] = useState<ImportProgress[]>([]);
  const [history, setHistory] = useState<ImportHistoryRow[]>([
    {
      id: "1",
      file: "export_fec_2024.csv",
      date: "2025-02-18",
      status: "Terminé",
      user: "admin@example.com",
    },
    {
      id: "2",
      file: "compta.xlsx",
      date: "2025-02-17",
      status: "Terminé",
      user: "admin@example.com",
    },
  ]);

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
  
  // Ref pour éviter les appels multiples
  const isImportingRef = useRef(false);

  useEffect(() => {
  companies.fetchList();
  fetchHistory();
  }, []);
  const fetchHistory = async () => {
  try {
    const data = await apiFetch<any[]>("/generic-import/history", {
      method: "GET",
      snackbar: { showError: false, showSuccess: false },
    });

    const mapped: ImportHistoryRow[] = data.map((item) => ({
      id: item.id,
      file: item.file,
      date: item.date,
      status: item.status ?? "Terminé",
      user: item.user,
      linesCount: item.linesCount,
    }));

    setHistory(mapped);
  } catch (err) {
    console.error("Erreur load history:", err);
  }
};

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
          headers = firstLine.split(/[,	;]/).map((h) => h.trim().replace(/^"|"$/g, ''));
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

  const handleEntityChange = (entityId: string, entityType: 'Group' | 'Company') => {
    setSelectedEntityId(entityId);
    setSelectedEntityType(entityType);
  };

  const performImport = async (
    existingMappingId?: string,
    fileOverride?: File,
    entityIdOverride?: string,
    entityTypeOverride?: 'Group' | 'Company'
  ) => {
    // Éviter les imports multiples simultanés
    if (isImportingRef.current) {
      console.log("Import déjà en cours, ignore");
      return;
    }
    
    const fileToUse = fileOverride ?? csvFile;
    const entityId = entityIdOverride ?? selectedEntityId;
    const entityType = entityTypeOverride ?? selectedEntityType;

    if (!fileToUse || !entityId || !entityType) {
      console.error("Paramètres manquants :", { fileToUse, entityId, entityType });
      // Pas d'alert, juste un log silencieux
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
        
        const templatePayload: any = {
          name: `Mapping_${fileToUse.name}_${new Date().toLocaleDateString()}`,
          rules: cleanedRules,
          entityId,
          entityType,
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
        
        // Pas d'alert, seulement le modal
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
        setConfirmReplaceOpen(false);
        setConfirmReplaceInput("");
        setPendingMappingId(null);
        setCsvFile(null);
        setCsvHeaders([]);
        setValidationErrors([]);
        setValidationModalOpen(false);
        

        const newHistoryEntry: ImportHistoryRow = {
          id: importResult?.importId || importResult?.id || String(Date.now()),
          file: fileToUse.name,
          date: new Date().toISOString().slice(0, 10),
          status: "Terminé",
          user: "Utilisateur",
        };
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
    // ✅ Capturer l'erreur ici pour éviter l'overlay Next.js
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
    // ✅ Capturer l'erreur ici aussi
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
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 p-1.5 bg-slate-100 rounded-xl gap-1">
            <TabsTrigger value="excel" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md">
              <Sheet className="h-4 w-4" />
              Excel / CSV
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md">
              <Plug className="h-4 w-4" />
              API
            </TabsTrigger>
          </TabsList>

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
            />
            
            <div className="flex justify-end items-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setMappingOpen(true)}
              >
                <ArrowRight className="h-4 w-4" />
                Configurer le mapping
              </Button>
            </div>
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
      />
      
      <SavedMappingModal
        open={savedMappingModalOpen}
        onOpenChange={setSavedMappingModalOpen}
        fileName={csvFile?.name ?? ""}
        onSelectMapping={handleSelectSavedMapping}
        onCreateNew={() => setMappingOpen(true)}
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
        onConfirm={() => {
          if (rollbackTarget) {
            setHistory((h) => h.filter((r) => r.id !== rollbackTarget.id));
          }
          setRollbackConfirmOpen(false);
          setRollbackTarget(null);
        }}
      />
    </AppLayout>
  );
}