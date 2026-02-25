"use client";

import { useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";

const CSV_TEMPLATE = "name,fiscal_year_start,fiscal_year_end,siret,address,group_id\nExemple SA,2025-01-01,2025-12-31,12345678901234,\"1 rue Example\",";

export default function StructureImportUploadPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Veuillez déposer un fichier CSV.");
      return;
    }
    setFile(f);
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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Veuillez sélectionner un fichier CSV.");
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleNext = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        sessionStorage.setItem("structure-import-csv", text);
        sessionStorage.setItem("structure-import-filename", file.name);
        router.push("/structure/import/mapping");
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-structure.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Structure" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Import — Téléversement</title>
      </Head>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/structure" className="text-sm text-muted-foreground hover:text-foreground">
            ← Structure
          </Link>
          <Link href="/structure/import/upload" className="text-sm font-medium text-foreground">
            Import
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Import en masse</h1>
        <p className="text-sm text-muted-foreground">
          Étape 1 : déposez votre fichier CSV ou téléchargez le modèle.
        </p>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={"rounded-xl border-2 border-dashed p-12 text-center " + (dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30")}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {file ? (
              <p className="font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Glissez-déposez un fichier CSV ici ou cliquez pour parcourir.
              </p>
            )}
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-4">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            Télécharger le modèle CSV
          </Button>
          <Button type="button" onClick={handleNext} disabled={!file}>
            Suivant
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
