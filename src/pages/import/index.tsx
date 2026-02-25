"use client";

import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useCompanies } from "@/hooks";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";

const REQUIRED_FIELDS = ["Compte", "Débit", "Crédit"];

type ImportHistoryRow = {
  id: string;
  file: string;
  date: string;
  status: "En cours" | "Terminé" | "Erreur";
  user: string;
};

type ValidationError = { line: number; message: string };

export default function ImportPage() {
  const companies = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState("fec");
  const [importsInProgress, setImportsInProgress] = useState<{ id: string; name: string; progress: number }[]>([]);
  const [history, setHistory] = useState<ImportHistoryRow[]>([
    { id: "1", file: "export_fec_2024.csv", date: "2025-02-18", status: "Terminé", user: "admin@example.com" },
    { id: "2", file: "compta.xlsx", date: "2025-02-17", status: "Terminé", user: "admin@example.com" },
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

  useEffect(() => {
    companies.fetchList();
  }, []);

  const companyList = companies.list ?? [];

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
    },
    []
  );

  const runValidation = () => {
    const errors: ValidationError[] = [];
    if (!mapping["Compte"] || !mapping["Débit"] || !mapping["Crédit"]) {
      errors.push({ line: 0, message: "Mapping incomplet : Compte, Débit et Crédit sont requis." });
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
      setImportsInProgress((p) => p.map((i) => (i.progress < 100 ? { ...i, progress: 100 } : i)));
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

  const uploadZoneClass =
    "flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg " +
    (dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30");

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
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fec">FEC</TabsTrigger>
            <TabsTrigger value="excel">Excel/CSV</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="fec" className="mt-4 space-y-6">
            <div
              className={uploadZoneClass}
              onDrop={(e) => handleDrop(e, "fec")}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="fec-upload"
                onChange={(e) => handleFileInput(e, "fec")}
              />
              <label htmlFor="fec-upload" className="cursor-pointer text-center text-muted-foreground">
                Déposez un fichier FEC (CSV) ou cliquez pour parcourir.
              </label>
            </div>
          </TabsContent>

          <TabsContent value="excel" className="mt-4 space-y-6">
            <div
              className={uploadZoneClass}
              onDrop={(e) => handleDrop(e, "excel")}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="excel-upload"
                onChange={(e) => handleFileInput(e, "excel")}
              />
              <label htmlFor="excel-upload" className="cursor-pointer text-center text-muted-foreground">
                Déposez un fichier Excel ou CSV ou cliquez pour parcourir.
              </label>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <p className="text-muted-foreground">
              Configurez vos connecteurs API sur la page{" "}
              <Link href="/import/connectors" className="text-primary hover:underline">
                Connecteurs
              </Link>
              .
            </p>
          </TabsContent>
        </Tabs>

        {importsInProgress.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold">Imports en cours</h2>
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {importsInProgress.map((imp) => (
                <div key={imp.id} className="space-y-1">
                  <span className="text-sm font-medium">{imp.name}</span>
                  <Progress value={imp.progress} max={100} className="h-2" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-base font-semibold">Historique des imports</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.file}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* Modale de mapping */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setMappingOpen(false)}>
          <DialogHeader>
            <DialogTitle>Mapping des champs</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Colonnes du fichier</p>
              <ul className="space-y-1 rounded border border-border p-2 text-sm">
                {csvHeaders.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Champ requis</p>
              <div className="space-y-2">
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="w-24 text-sm">{field}</span>
                    <Select
                      value={
                        Object.entries(mapping).find(([, v]) => v === field)?.[0] ?? ""
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
                      placeholder="—"
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
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button">
              Charger un modèle
            </Button>
            <Button variant="outline" type="button">
              Sauvegarder le modèle
            </Button>
            <Button type="button" onClick={runValidation}>
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale erreurs de validation */}
      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Erreurs de validation</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ligne</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationErrors.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{e.line}</TableCell>
                    <TableCell className="text-destructive">{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setValidationModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation forte REMPLACER */}
      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ATTENTION</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les données existantes pour cette période seront
              remplacées par le contenu du fichier importé. Pour confirmer, saisissez REMPLACER
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
            >
              Confirmer l&apos;import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
