"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";

type ValidationError = { line: number; message: string };

export default function StructureImportValidationPage() {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [mapping, setMapping] = useState<Record<string, string> | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("structure-import-csv");
    const mapRaw = sessionStorage.getItem("structure-import-mapping");
    if (!raw || !mapRaw) return;
    setCsvText(raw);
    setMapping(JSON.parse(mapRaw) as Record<string, string>);
    const lines = raw.split("\n").filter((l) => l.trim());
    const header = lines[0];
    const cols = header.split(",").map((c) => c.trim());
    const list: ValidationError[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      if (cells.length !== cols.length) {
        list.push({ line: i + 1, message: "Nombre de colonnes incorrect" });
      }
      const nameIdx = cols.indexOf(
        Object.entries(JSON.parse(mapRaw) as Record<string, string>).find(
          ([_, v]) => v === "name"
        )?.[0] ?? ""
      );
      if (nameIdx >= 0 && (!cells[nameIdx] || !cells[nameIdx].trim())) {
        list.push({ line: i + 1, message: "Le nom est obligatoire" });
      }
    }
    setErrors(list);
  }, []);

  const clearImport = () => {
    sessionStorage.removeItem("structure-import-csv");
    sessionStorage.removeItem("structure-import-filename");
    sessionStorage.removeItem("structure-import-mapping");
  };

  return (
    <AppLayout title="Structure" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Import — Validation</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/structure" className="text-sm text-muted-foreground hover:text-foreground">
            ← Structure
          </Link>
          <Link href="/structure/import/upload" className="text-sm font-medium text-foreground">
            Import
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Erreurs de validation</h1>
        <p className="text-sm text-muted-foreground">
          Corrigez les lignes en erreur dans votre fichier puis réimportez si besoin.
        </p>
        {!csvText || !mapping ? (
          <p className="py-4 text-muted-foreground">
            Aucune donnée d’import en session.{" "}
            <Link href="/structure/import/upload" className="text-primary hover:underline">
              Recommencer l’import
            </Link>
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left font-medium">Ligne</th>
                    <th className="p-3 text-left font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-muted-foreground">
                        Aucune erreur de validation.
                      </td>
                    </tr>
                  ) : (
                    errors.map((e, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-3 font-mono">{e.line}</td>
                        <td className="p-3 text-destructive">{e.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/structure/import/mapping">
                <Button type="button" variant="outline">
                  Précédent
                </Button>
              </Link>
              <Link href="/structure/import/upload">
                <Button type="button" variant="outline" onClick={clearImport}>
                  Nouvel import
                </Button>
              </Link>
              {errors.length === 0 && (
                <Link href="/structure" onClick={clearImport}>
                  <Button type="button">Terminer</Button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
