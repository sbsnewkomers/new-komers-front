"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const DB_FIELDS = [
  "name",
  "fiscal_year_start",
  "fiscal_year_end",
  "siret",
  "address",
  "group_id",
  "ape_code",
  "main_activity",
  "size",
  "model",
];

export default function StructureImportMappingPage() {
  const router = useRouter();
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = sessionStorage.getItem("structure-import-csv");
    if (!raw) {
      router.replace("/structure/import/upload");
      return;
    }
    const firstLine = raw.split("\n")[0];
    const headers = firstLine.split(",").map((h) => h.trim());
    setCsvHeaders(headers);
    const initial: Record<string, string> = {};
    headers.forEach((h) => {
      initial[h] = DB_FIELDS.includes(h) ? h : "";
    });
    setMapping(initial);
  }, [router]);

  const handleMappingChange = (csvCol: string, dbField: string) => {
    setMapping((prev) => ({ ...prev, [csvCol]: dbField }));
  };

  const handleNext = () => {
    sessionStorage.setItem("structure-import-mapping", JSON.stringify(mapping));
    router.push("/structure/import/validation");
  };

  return (
    <AppLayout title="Structure" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Import — Mapping</title>
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
        <h1 className="text-xl font-semibold">Mapping des champs</h1>
        <p className="text-sm text-muted-foreground">
          Associez chaque colonne du CSV à un champ de la base de données.
        </p>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-medium">Colonne CSV</th>
                <th className="p-3 text-left font-medium">Champ BDD</th>
              </tr>
            </thead>
            <tbody>
              {csvHeaders.map((h) => (
                <tr key={h} className="border-b border-border">
                  <td className="p-3">{h}</td>
                  <td className="p-3">
                    <Select
                      value={mapping[h] ?? ""}
                      onValueChange={(v) => handleMappingChange(h, v)}
                      placeholder="— Ne pas importer —"
                    >
                      <option value="">— Ne pas importer —</option>
                      {DB_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4">
          <Link href="/structure/import/upload">
            <Button type="button" variant="outline">
              Précédent
            </Button>
          </Link>
          <Button type="button" onClick={handleNext}>
            Valider et voir les erreurs
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
