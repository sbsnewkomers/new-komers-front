"use client";

import { useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import {
  downloadStructureTemplate,
  executeStructureImport,
  ImportReport,
  ImportExecuteResult,
  validateStructureFile,
} from "@/lib/structureImportApi";
import { Download, Upload } from "lucide-react";

export default function StructureImportUploadPage() {
  const { accessToken } = usePermissionsContext();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [executeResult, setExecuteResult] =
    useState<ImportExecuteResult | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) {
      setError("Veuillez déposer un fichier Excel (.xlsx).");
      setFile(null);
      setReport(null);
      setExecuteResult(null);
      return;
    }
    setFile(f);
    setReport(null);
    setExecuteResult(null);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.name.endsWith(".xlsx")) {
        setError("Veuillez sélectionner un fichier Excel (.xlsx).");
        setFile(null);
        setReport(null);
        setExecuteResult(null);
        return;
      }
      setFile(f);
      setReport(null);
      setExecuteResult(null);
      setError(null);
    },
    [],
  );

  const handleDownloadTemplate = async () => {
    try {
      setError(null);
      await downloadStructureTemplate(accessToken);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Échec du téléchargement du modèle.";
      setError(msg);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    try {
      setIsValidating(true);
      setError(null);
      setExecuteResult(null);
      const rep = await validateStructureFile(file, accessToken);
      setReport(rep);
      if (rep.errors.length > 0) {
        // Marquer clairement qu'il y a des erreurs
        setError(
          "Le fichier contient des erreurs. Corrigez-les puis réimportez si nécessaire.",
        );
        // Réinitialiser le fichier pour forcer un nouveau choix après correction
        setFile(null);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la validation.";
      setError(msg);
      setReport(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;
    try {
      setIsExecuting(true);
      setError(null);
      const rep = await executeStructureImport(file, accessToken);
      setExecuteResult(rep);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'import.";
      setError(msg);
      setExecuteResult(null);
      setReport(null);
      setFile(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const hasNoErrors = report && report.errors.length === 0;

  return (
    <AppLayout
      title="Structure"
      companies={[]}
      selectedCompanyId=""
      onCompanyChange={() => {}}
    >
      <Head>
        <title>Import structure — Fichier Excel</title>
      </Head>
      <div className="mx-auto w-full space-y-6">
        <div className="flex items-center gap-1">
          <Link
            href="/structure"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Structure /
          </Link>
          <Link
            href="/structure/import/upload"
            className="text-sm font-medium text-foreground"
          >
            Import
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4 flex items-center justify-between">
          <div className="flex flex-col gap-2 ">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Import en masse de la structure
            </h1>
            <p className="text-sm text-muted-foreground">
              Utilisez le modèle Excel pour créer ou mettre à jour groupes,
              entreprises et business units.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              type="button"
              variant="default"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-5 w-5 text-white" />
              Télécharger le modèle Excel
            </Button>
          </div>
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={
            "rounded-xl border-2 border-dashed p-12 text-center " +
            (dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted")
          }
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {file ? (
              <p className="font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Glissez-déposez un fichier Excel (.xlsx) ici ou cliquez pour
                parcourir.
              </p>
            )}
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!file || isValidating}
          >
            {isValidating ? "Validation en cours…" : "Valider le fichier"}
          </Button>
          <Button
            type="button"
            onClick={handleExecute}
            disabled={!file || !hasNoErrors || isExecuting}
          >
            {isExecuting ? "Import en cours…" : "Lancer l'import"}
          </Button>
        </div>

        {executeResult && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold mb-1">Import terminé avec succès.</p>
            <p>
              Groupes créés : <strong>{executeResult.created.groups}</strong>,{" "}
              Entreprises créées :{" "}
              <strong>{executeResult.created.companies}</strong>, Business units
              créées : <strong>{executeResult.created.businessUnits}</strong>.
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-2">
                Résumé de la validation
              </h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium text-foreground">
                    Lignes totales :
                  </span>{" "}
                  {report.summary.totalRows}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Lignes valides :
                  </span>{" "}
                  {report.summary.validRows}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Lignes en erreur :
                  </span>{" "}
                  {report.summary.errorRows}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Groupes à créer :
                  </span>{" "}
                  {report.summary.entitiesToCreate.groups}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Entreprises à créer :
                  </span>{" "}
                  {report.summary.entitiesToCreate.companies}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Business units à créer :
                  </span>{" "}
                  {report.summary.entitiesToCreate.businessUnits}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left font-medium">Feuille</th>
                    <th className="p-3 text-left font-medium">Ligne</th>
                    <th className="p-3 text-left font-medium">Colonne</th>
                    <th className="p-3 text-left font-medium">Valeur</th>
                    <th className="p-3 text-left font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-muted-foreground"
                      >
                        Aucune erreur détectée.
                      </td>
                    </tr>
                  ) : (
                    report.errors.map((err, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="p-3">{err.sheet}</td>
                        <td className="p-3 font-mono">{err.row}</td>
                        <td className="p-3">{err.column}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {err.value !== undefined ? String(err.value) : ""}
                        </td>
                        <td className="p-3 text-destructive">{err.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
