"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useCompanies } from "@/hooks";
import { useGroups } from "@/hooks/useGroups";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";
import { uploadFecFile, FecImportResponse } from "@/lib/fecApi";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import {
  FileText,
  Sheet,
  Plug,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowDown,
  FileUp,
  History,
  AlertTriangle,
  User,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const REQUIRED_FIELDS = ["Compte", "Débit", "Crédit"];

type ImportHistoryRow = {
  id: string;
  file: string;
  date: string;
  status: "En cours" | "Terminé" | "Erreur";
  user: string;
};

type ValidationError = { line: number; message: string };

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: ImportHistoryRow["status"] }) {
  const map = {
    Terminé: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      ring: "ring-emerald-200",
    },
    "En cours": {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <Clock className="h-3.5 w-3.5" />,
      ring: "ring-amber-200",
    },
    Erreur: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
      ring: "ring-red-200",
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      {s.icon}
      {status}
    </span>
  );
}

/* ─── Upload drop zone ─── */
function UploadZone({
  type,
  accept,
  inputId,
  title,
  subtitle,
  formats,
  dragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileInput,
}: {
  type: "fec" | "excel";
  accept: string;
  inputId: string;
  title: string;
  subtitle: string;
  formats: string;
  dragOver: boolean;
  onDrop: (e: React.DragEvent, type: "fec" | "excel") => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>, type: "fec" | "excel") => void;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
        dragOver
          ? "ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.01] bg-primary/2"
          : "hover:shadow-md hover:border-slate-200"
      }`}
      onDrop={(e) => onDrop(e, type)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/2 to-transparent pointer-events-none" />
      <CardContent className="p-8! flex flex-col items-center justify-center min-h-[260px] relative">
        <div
          className={`mb-5 rounded-2xl p-4 transition-all duration-300 ${
            dragOver
              ? "bg-primary/10 scale-110"
              : "bg-slate-50 group-hover:bg-primary/5 group-hover:scale-105"
          }`}
        >
          <Upload
            className={`h-8 w-8 transition-colors duration-300 ${
              dragOver ? "text-primary" : "text-slate-400 group-hover:text-primary/70"
            }`}
          />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-1">{subtitle}</p>
        <p className="text-xs text-slate-400 mb-5">
          Formats supportés : <span className="font-medium">{formats}</span>
        </p>
        <input
          type="file"
          accept={accept}
          className="hidden"
          id={inputId}
          onChange={(e) => onFileInput(e, type)}
        />
        <label htmlFor={inputId}>
          <Button
            type="button"
            variant="outline"
            className="pointer-events-none gap-2"
          >
            <FileUp className="h-4 w-4" />
            Parcourir les fichiers
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}

export default function ImportPage() {
  const companies = useCompanies();
  const groups = useGroups();
  const { user } = usePermissionsContext();
  const [selectedEntityType, setSelectedEntityType] = useState<"Group" | "Company">("Company");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [activeTab, setActiveTab] = useState("fec");
  const [importsInProgress, setImportsInProgress] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
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
  
  // États pour l'import FEC
  const [isFecImporting, setIsFecImporting] = useState(false);
  const [fecImportResult, setFecImportResult] = useState<FecImportResponse | null>(null);
  const [fecResultModalOpen, setFecResultModalOpen] = useState(false);

  const companyList = useMemo(() => companies.list ?? [], [companies.list]);
  
  // Filtrer les entreprises selon les permissions de l'utilisateur
  const getFilteredCompanies = useCallback(() => {
    // Pour l'instant, traiter HEAD_MANAGER comme ADMIN pour contourner le problème de permissions
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER") {
      return companyList; // Les admins voient toutes les entreprises
    }
    if (user?.role === "MANAGER") {
      // TODO: Filtrer selon les workspaces de l'utilisateur
      // Pour l'instant, retourner toutes les entreprises (à adapter avec la logique de workspace)
      return companyList;
    }
    // Pour les autres rôles (END_USER), filtrer selon les workspaces de l'utilisateur
    // TODO: Implémenter la logique de filtrage par workspace quand les workspaces seront disponibles
    return companyList; // Pour l'instant, on retourne tout (à adapter)
  }, [companyList, user?.role]);

  const filteredCompanies = getFilteredCompanies();

  useEffect(() => {
    companies.fetchList().catch(error => {
      console.error("Companies fetch error:", error);
    });
    
    // Charger les groupes pour les admins, head managers et managers
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER" || user?.role === "MANAGER") {
      groups.fetchList().catch(error => {
        console.error("Groups fetch error:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user]);

  // useEffect de secours pour charger les données au montage
  useEffect(() => {
    // Toujours charger les companies
    companies.fetchList().catch(error => {
      console.error("Companies fetch error (secours):", error);
    });
    
    // Charger les groupes si le rôle le permet
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER" || user?.role === "MANAGER") {
      groups.fetchList().catch(error => {
        console.error("Groups fetch error (secours):", error);
      });
    }
  }, []); // Exécuté une seule fois au montage

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "fec" | "excel") => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (!f) return;
      const isCsv = f.name.endsWith(".csv");
      const isExcel = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
      if (type === "fec" && !isCsv) return;
      if (type === "excel" && !isCsv && !isExcel) return;
      if (type === "excel" && isExcel) {
        window.alert("Veuillez exporter ce fichier en CSV pour l'import.");
        return;
      }
      if (type === "excel" || type === "fec") {
        setCsvFile(f);
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          const firstLine = text.split("\n")[0];
          const headers = firstLine.split(/[,\t]/).map((h) => h.trim());
          setCsvHeaders(headers);
          const initial: Record<string, string> = {};
          headers.forEach((h) => {
            initial[h] = REQUIRED_FIELDS.includes(h) ? h : "";
          });
          setMapping(initial);
          setMappingOpen(true);
        };
        reader.readAsText(f, "UTF-8");
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "fec" | "excel") => {
      const f = e.target.files?.[0];
      if (!f) return;
      const isExcel = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
      if (type === "excel" && isExcel) {
        window.alert("Veuillez exporter ce fichier en CSV pour l'import.");
        return;
      }
      
      if (type === "fec") {
        // Pour les FEC, on stocke directement le fichier pour l'import
        setCsvFile(f);
      } else {
        // Pour Excel, on garde la logique existante de mapping
        setCsvFile(f);
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          const firstLine = text.split("\n")[0];
          const headers = firstLine.split(/[,\t]/).map((h) => h.trim());
          setCsvHeaders(headers);
          const initial: Record<string, string> = {};
          headers.forEach((h) => {
            initial[h] = REQUIRED_FIELDS.includes(h) ? h : "";
          });
          setMapping(initial);
          setMappingOpen(true);
        };
        reader.readAsText(f, "UTF-8");
      }
    },
    []
  );

  // Fonction pour télécharger le template FEC
  const downloadFecTemplate = useCallback(() => {
    // Utiliser les colonnes FEC définies dans le backend
    const fecColumns = [
      { name: 'JournalCode', type: 'string', required: true },
      { name: 'JournalLib', type: 'string', required: true },
      { name: 'EcritureNum', type: 'string', required: true },
      { name: 'EcritureDate', type: 'date', required: true },
      { name: 'CompteNum', type: 'string', required: true },
      { name: 'CompteLib', type: 'string', required: true },
      { name: 'CompteAuxNum', type: 'string', required: false },
      { name: 'CompteAuxLib', type: 'string', required: false },
      { name: 'PieceRef', type: 'string', required: true },
      { name: 'PieceDate', type: 'date', required: true },
      { name: 'EcritureLib', type: 'string', required: true },
      { name: 'Debit', type: 'number', required: true },
      { name: 'Credit', type: 'number', required: true },
      { name: 'EcritureLet', type: 'string', required: false },
      { name: 'DateLet', type: 'date', required: false },
      { name: 'ValidDate', type: 'date', required: true },
      { name: 'Montantdevise', type: 'number', required: false },
      { name: 'Idevise', type: 'string', required: false },
    ];
    
    const headers = fecColumns.map(col => col.name);
    
    // Créer un template avec une seule ligne d'exemple pour éviter les erreurs
    const sampleData = [
      [
        'AC', 'Achat', 'AC001', '20240115',
        '607000', 'Achat marchandises', '', '',
        'FA001', '20240115', 'Achat fournisseur DUPONT', '1000.00', '0.00',
        '', '', '20240120', '', ''
      ]
    ];
    
    // Créer le contenu CSV avec tabulation comme séparateur (plus standard pour FEC)
    const csvRows = [];
    
    // Ajouter l'en-tête sans guillemets
    csvRows.push(headers.join('\t'));
    
    // Ajouter les données sans guillemets
    sampleData.forEach(row => {
      csvRows.push(row.join('\t'));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Créer le blob sans BOM pour éviter les problèmes d'encodage
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_fec.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Fonction d'import FEC
  const handleFecImport = useCallback(async () => {
    if (!csvFile || !selectedEntityId) {
      alert("Veuillez sélectionner une entité et un fichier FEC.");
      return;
    }

    setIsFecImporting(true);
    try {
      // Utiliser l'ID utilisateur depuis le contexte d'authentification
      const userId = user?.id || '';
      
      if (!userId) {
        alert("Erreur: utilisateur non authentifié");
        return;
      }
      
      const result = await uploadFecFile({
        file: csvFile,
        entityId: selectedEntityId,
        entityType: selectedEntityType,
        userId,
      });

      setFecImportResult(result);
      setFecResultModalOpen(true);
      
      // Ajouter à l'historique
      const newHistoryItem: ImportHistoryRow = {
        id: Date.now().toString(),
        file: csvFile.name,
        date: new Date().toISOString().split('T')[0],
        status: result.success ? "Terminé" : "Erreur",
        user: user?.email || "utilisateur",
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
    } catch (error) {
      console.error('Erreur lors de l\'import FEC:', error);
    } finally {
      setIsFecImporting(false);
    }
  }, [csvFile, selectedEntityId, selectedEntityType, user]);

  const runValidation = () => {
    const errors: ValidationError[] = [];
    if (!mapping["Compte"] || !mapping["Débit"] || !mapping["Crédit"]) {
      errors.push({
        line: 0,
        message: "Mapping incomplet : Compte, Débit et Crédit sont requis.",
      });
    }
    setValidationErrors(errors);
    setMappingOpen(false);
    if (errors.length > 0) {
      setValidationModalOpen(true);
    } else {
      setConfirmReplaceOpen(true);
    }
  };

  const handleConfirmReplace = () => {
    if (confirmReplaceInput !== "REMPLACER") return;
    setConfirmReplaceOpen(false);
    setConfirmReplaceInput("");
    setImportsInProgress((prev) => [
      ...prev,
      { id: String(Date.now()), name: csvFile?.name ?? "fichier", progress: 0 },
    ]);
    setTimeout(() => {
      setImportsInProgress((p) =>
        p.map((i) => (i.progress < 100 ? { ...i, progress: 100 } : i))
      );
      setHistory((h) => [
        {
          id: String(Date.now()),
          file: csvFile?.name ?? "fichier",
          date: new Date().toISOString().slice(0, 10),
          status: "Terminé",
          user: "utilisateur",
        },
        ...h,
      ]);
    }, 1500);
  };

  return (
    <AppLayout
      title="Import"
    >
      <Head>
        <title>Import</title>
      </Head>

      <div className="space-y-8">
        {/* ─── Page header ─── */}
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

        {/* ─── Step indicator ─── */}
        {/* <Card className="bg-white">
          <CardContent className="py-6! px-6!">
            <StepIndicator steps={STEPS} current={currentStep} />
          </CardContent>
        </Card> */}

        {/* ─── Source tabs ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 p-1.5 bg-slate-100 rounded-xl gap-1">
            <TabsTrigger
              value="fec"
              className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
            >
              <FileText className="h-4 w-4" />
              FEC
            </TabsTrigger>
            <TabsTrigger
              value="excel"
              className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
            >
              <Sheet className="h-4 w-4" />
              Excel / CSV
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
            >
              <Plug className="h-4 w-4" />
              API
            </TabsTrigger>
          </TabsList>

          {/* FEC tab */}
          <TabsContent value="fec" className="mt-6">
            <div className="space-y-4">
              <UploadZone
                type="fec"
                accept=".csv,.txt"
                inputId="fec-upload"
                title="Import FEC"
                subtitle="Glissez-déposez votre fichier FEC ici"
                formats=".csv, .txt"
                dragOver={dragOver}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onFileInput={handleFileInput}
              />
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={downloadFecTemplate}
                >
                  <ArrowDown className="h-4 w-4" />
                  Télécharger le template FEC
                </Button>
              </div>
            </div>
            
            {csvFile && (
              <div className="mt-6 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Indicateur d'étapes */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            csvFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {csvFile ? '✓' : '1'}
                          </div>
                          <span className={`text-sm font-medium ${csvFile ? 'text-emerald-700' : 'text-slate-500'}`}>
                            Fichier FEC sélectionné
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedEntityType ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {selectedEntityType ? '✓' : '2'}
                          </div>
                          <span className={`text-sm font-medium ${selectedEntityType ? 'text-emerald-700' : 'text-slate-500'}`}>
                            Type d&apos;entité sélectionné
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedEntityId ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {selectedEntityId ? '✓' : '3'}
                          </div>
                          <span className={`text-sm font-medium ${selectedEntityId ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {selectedEntityType === 'Company' ? 'Entreprise' : 
                             selectedEntityType === 'Group' ? 'Groupe' : 
                             'Entité'} sélectionné(e)
                          </span>
                        </div>
                      </div>
                      
                      {/* Informations du fichier */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-muted-foreground">
                          Fichier sélectionné
                        </label>
                        <p className="text-sm font-medium">{csvFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(csvFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      
                      {/* Sélecteur de type d'entité */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-muted-foreground">
                          Type d&apos;entité {!csvFile && <span className="text-xs text-slate-400">(sélectionnez d&apos;abord un fichier)</span>}
                        </label>
                        <Select
                          value={selectedEntityType}
                          onValueChange={(value: string) => {
                            setSelectedEntityType(value as "Group" | "Company");
                            setSelectedEntityId(""); // Réinitialiser l'entité sélectionnée
                          }}
                          disabled={!csvFile}
                          className="w-full"
                        >
                          <option value="">Sélectionner un type d&apos;entité</option>
                          <option value="Company">Entreprise</option>
                          {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER" || user?.role === "MANAGER") && (
                            <option value="Group">Groupe</option>
                          )}
                        </Select>
                      </div>
                      
                      {/* Sélecteur d'entité spécifique */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-muted-foreground">
                          {selectedEntityType === 'Company' ? 'Entreprise' : 
                           selectedEntityType === 'Group' ? 'Groupe' : 
                           'Entité'} {!selectedEntityType && <span className="text-xs text-slate-400">(sélectionnez d&apos;abord un type)</span>}
                        </label>
                        <Select
                          value={selectedEntityId}
                          onValueChange={setSelectedEntityId}
                          disabled={!csvFile || !selectedEntityType || 
                            (selectedEntityType === 'Company' && companies.loading) ||
                            (selectedEntityType === 'Group' && groups.loading)}
                          className="w-full"
                        >
                          <option value="">
                            {!csvFile ? "Sélectionnez d'abord un fichier" : 
                             !selectedEntityType ? "Sélectionnez d'abord un type d'entité" :
                             (selectedEntityType === 'Company' && companies.loading) ||
                             (selectedEntityType === 'Group' && groups.loading) ? "Chargement..." : `Sélectionner une ${
                               selectedEntityType === 'Company' ? 'entreprise' : 
                               selectedEntityType === 'Group' ? 'groupe' : 
                               'entité'
                             }`}
                          </option>
                          {selectedEntityType === 'Company' && filteredCompanies.map((company) => {
                            return (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            );
                          })}
                          {selectedEntityType === 'Group' && groups.list?.map((group) => {
                            return (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            );
                          })}
                        </Select>
                        {(selectedEntityType === 'Company' && companies.error) && (
                          <p className="mt-1 text-xs text-red-600">
                            Erreur: {companies.error}
                          </p>
                        )}
                        {(selectedEntityType === 'Group' && groups.error) && (
                          <p className="mt-1 text-xs text-red-600">
                            Erreur: {groups.error}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={handleFecImport}
                          disabled={isFecImporting || !selectedEntityId || !csvFile}
                          className="gap-2"
                          title={!csvFile ? "Veuillez d'abord sélectionner un fichier FEC" : 
                                  !selectedEntityId ? "Veuillez sélectionner une entité" : ""}
                        >
                          {isFecImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Import en cours...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Importer le fichier FEC
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Excel/CSV tab */}
          <TabsContent value="excel" className="mt-6 space-y-4">
            <UploadZone
              type="excel"
              accept=".csv,.xlsx,.xls"
              inputId="excel-upload"
              title="Import Excel / CSV"
              subtitle="Glissez-déposez votre fichier ici"
              formats=".csv, .xlsx, .xls"
              dragOver={dragOver}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onFileInput={handleFileInput}
            />
            <div className="flex justify-end">
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

          {/* API tab */}
          <TabsContent value="api" className="mt-6">
            <Card className="bg-white">
              <CardContent className="py-16! flex flex-col items-center justify-center">
                <div className="mb-6 flex items-center justify-center gap-4">
                  <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                    <span className="font-bold text-slate-800">Sage</span>
                  </div>
                  <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                    <span className="font-bold text-emerald-600">Pennylane</span>
                  </div>
                  <div className="flex z-10 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-md ring-4 ring-white">
                    <Plug className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                    <span className="font-bold text-blue-600">Cegid</span>
                  </div>
                  <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                    <span className="font-bold text-green-600">QuickBooks</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  Connecteurs API
                </h3>
                <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                  Configurez vos connecteurs pour synchroniser automatiquement vos données comptables depuis vos logiciels.
                </p>
                <Link href="/import/connectors">
                  <Button className="gap-2 bg-primary text-white hover:bg-primary/90">
                    <Sparkles className="h-4 w-4" />
                    Configurer les connecteurs
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Imports in progress ─── */}
        {importsInProgress.length > 0 && (
          <Card className="bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
              </div>
              <h3 className="font-semibold text-primary">Imports en cours</h3>
              <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                {importsInProgress.length}
              </span>
            </div>
            <CardContent className="p-6!">
              <div className="space-y-4">
                {importsInProgress.map((imp) => (
                  <div key={imp.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {imp.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {imp.progress}%
                      </span>
                    </div>
                    <Progress value={imp.progress} max={100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Import history ─── */}
        <Card className="bg-white overflow-hidden w-full">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="w-full border-b border-slate-100 px-6 py-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
          >
            <div className="rounded-lg bg-slate-50 p-2">
              <History className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="font-semibold text-primary">Historique des imports</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {history.length} import{history.length > 1 ? "s" : ""}
            </span>
            <span className="ml-auto">
              {historyOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </span>
          </button>
          {historyOpen && (
            <>
              {history.length === 0 ? (
                <CardContent className="py-16! flex flex-col items-center justify-center">
                  <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                    <History className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500">Aucun import réalisé pour le moment</p>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold text-slate-600">Fichier</TableHead>
                        <TableHead className="font-semibold text-slate-600">Date</TableHead>
                        <TableHead className="font-semibold text-slate-600">Statut</TableHead>
                        <TableHead className="font-semibold text-slate-600">Utilisateur</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-primary/5 p-1.5">
                                <FileText className="h-4 w-4 text-primary/60" />
                              </div>
                              <span className="font-medium text-slate-700">
                                {row.file}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{row.date}</TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                                <User className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <span className="text-sm text-slate-600">{row.user}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status === "Terminé" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => {
                                  setRollbackTarget(row);
                                  setRollbackConfirmOpen(true);
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restaurer
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ════════════════ Rollback confirmation ════════════════ */}
      <AlertDialog open={rollbackConfirmOpen} onOpenChange={setRollbackConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <div className="rounded-lg bg-amber-50 p-1.5">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              Confirmer le rollback
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-slate-600">
              Vous êtes sur le point d&apos;annuler l&apos;import du fichier{" "}
              <span className="font-semibold text-slate-700">
                {rollbackTarget?.file}
              </span>{" "}
              du {rollbackTarget?.date}. Cette action restaurera les données précédentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setRollbackConfirmOpen(false);
                setRollbackTarget(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (rollbackTarget) {
                  setHistory((h) => h.filter((r) => r.id !== rollbackTarget.id));
                }
                setRollbackConfirmOpen(false);
                setRollbackTarget(null);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Confirmer le rollback
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════════════ Mapping modal ════════════════ */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setMappingOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Mapping des champs
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left – detected columns */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Colonnes détectées
              </p>
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                {csvHeaders.map((h) => {
                  const isMapped = Object.values(mapping).includes(h) || mapping[h];
                  return (
                    <div
                      key={h}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isMapped
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-slate-600"
                      }`}
                    >
                      {isMapped ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
                      )}
                      {h}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right – required field mapping */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Champs requis
              </p>
              <div className="space-y-3">
                {REQUIRED_FIELDS.map((field) => (
                  <div
                    key={field}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Requis
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {field}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                      <Select
                        value={
                          Object.entries(mapping).find(([, v]) => v === field)?.[0] ??
                          ""
                        }
                        onValueChange={(v) =>
                          setMapping((prev) => {
                            const next = { ...prev };
                            Object.keys(next).forEach((k) => {
                              if (next[k] === field) next[k] = "";
                            });
                            if (v) next[v] = field;
                            return next;
                          })
                        }
                        placeholder="Sélectionner une colonne"
                        className="flex-1"
                      >
                        <option value="">—</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" className="gap-1.5">
              <FileUp className="h-4 w-4" />
              Charger un modèle
            </Button>
            <Button variant="outline" type="button" className="gap-1.5">
              <ArrowDown className="h-4 w-4" />
              Sauvegarder le modèle
            </Button>
            <Button
              type="button"
              onClick={runValidation}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ Validation errors modal ════════════════ */}
      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <div className="rounded-lg bg-red-50 p-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              Erreurs de validation
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-64 rounded-xl border border-red-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50/50">
                  <TableHead className="font-semibold text-red-700">Ligne</TableHead>
                  <TableHead className="font-semibold text-red-700">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationErrors.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-red-600">{e.line}</TableCell>
                    <TableCell className="text-red-600">{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setValidationModalOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ Confirm replace dialog ════════════════ */}
      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <div className="rounded-lg bg-amber-50 p-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              ATTENTION
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-slate-600">
              Cette action est irréversible. Les données existantes pour cette période
              seront remplacées par le contenu du fichier importé. Pour confirmer,
              saisissez{" "}
              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono font-bold text-amber-700">
                REMPLACER
              </span>{" "}
              ci-dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Saisir REMPLACER"
            value={confirmReplaceInput}
            onChange={(e) => setConfirmReplaceInput(e.target.value)}
            className="mt-4"
          />
          <AlertDialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setConfirmReplaceOpen(false);
                setConfirmReplaceInput("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={confirmReplaceInput !== "REMPLACER"}
              onClick={handleConfirmReplace}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Confirmer l&apos;import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════════════ FEC Import Result Modal ════════════════ */}
      <Dialog open={fecResultModalOpen} onOpenChange={setFecResultModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fecImportResult?.success ? (
                <>
                  <div className="rounded-lg bg-green-50 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  Import réussi
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-red-50 p-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  Erreurs détectées
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {fecImportResult && (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{fecImportResult.totalLines}</div>
                    <p className="text-sm text-muted-foreground">Lignes totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{fecImportResult.validLinesCount}</div>
                    <p className="text-sm text-muted-foreground">Lignes valides</p>
                  </CardContent>
                </Card>
              </div>

              {/* Message */}
              <div className={`p-4 rounded-lg ${fecImportResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {fecImportResult.message}
              </div>

              {/* Erreurs détaillées */}
              {fecImportResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Erreurs de validation</h4>
                  <div className="overflow-auto max-h-64 rounded-xl border border-red-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50/50">
                          <TableHead className="font-semibold text-red-700">Ligne</TableHead>
                          <TableHead className="font-semibold text-red-700">Colonne</TableHead>
                          <TableHead className="font-semibold text-red-700">Valeur</TableHead>
                          <TableHead className="font-semibold text-red-700">Erreur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fecImportResult.errors.map((error, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-red-600">{error.line}</TableCell>
                            <TableCell className="font-mono text-red-600">{error.column}</TableCell>
                            <TableCell className="text-red-600">{error.value}</TableCell>
                            <TableCell className="text-red-600">{error.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setFecResultModalOpen(false);
                setFecImportResult(null);
                setCsvFile(null);
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
