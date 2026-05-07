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
          <Link href="/structure" className="text-sm text-(--nebula-muted) hover:text-white">
            ← Structure
          </Link>
          <Link href="/structure/import/upload" className="text-sm font-medium text-white">
            Import
          </Link>
        </div>
        <div className="nebula-glass nebula-blob rounded-3xl p-8">
          <div className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted) mb-3">§ Import</div>
          <h1 className="text-5xl font-bold nebula-grad-text">Erreurs de validation</h1>
          <p className="mt-3 text-[13px] text-(--nebula-muted)">
          Corrigez les lignes en erreur dans votre fichier puis réimportez si besoin.
          </p>
        </div>
        {!csvText || !mapping ? (
          <p className="py-4 text-(--nebula-muted)">
            Aucune donnée d’import en session.{" "}
            <Link href="/structure/import/upload" className="text-white hover:underline">
              Recommencer l’import
            </Link>
          </p>
        ) : (
          <>
            <div className="nebula-glass rounded-3xl overflow-hidden border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-left font-medium">Ligne</th>
                    <th className="p-3 text-left font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-(--nebula-muted)">
                        Aucune erreur de validation.
                      </td>
                    </tr>
                  ) : (
                    errors.map((e, i) => (
                      <tr key={i} className="border-b border-white/10">
                        <td className="p-3 font-mono">{e.line}</td>
                        <td className="p-3 text-red-400">{e.message}</td>
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
