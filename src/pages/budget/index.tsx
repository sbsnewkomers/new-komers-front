"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

const BUDGET_LINES = [
  "Chiffre d'affaires",
  "Produits d'exploitation",
  "Autres produits",
  "Charges",
  "Achats",
  "Charges de personnel",
  "Résultat",
];

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function BudgetPage() {
  const companies = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    BUDGET_LINES.forEach((line) => {
      init[line] = {};
      MONTHS.forEach((m) => {
        init[line][m] = "";
      });
    });
    return init;
  });

  useEffect(() => {
    companies.fetchList();
  }, []);

  const companyList = companies.list ?? [];

  const setCell = (line: string, month: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [line]: {
        ...prev[line],
        [month]: value,
      },
    }));
  };

  return (
    <AppLayout
      title="Budget"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
    >
      <Head>
        <title>Budget</title>
      </Head>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/reporting" className="text-sm text-muted-foreground hover:text-foreground">
            ← Reporting
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Saisissez les montants prévisionnels par ligne et par mois.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table className="bg-white">
            <TableHeader>
              <TableRow className="bg-black!">
                <TableHead className="min-w-[180px] bg-primary/80 text-white">Ligne / Mois</TableHead>
                {MONTHS.map((m) => (
                  <TableHead key={m} className="w-28 text-right bg-slate-100">
                    {m}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {BUDGET_LINES.map((line) => (
                <TableRow key={line}>
                  <TableCell className="font-medium bg-primary/80 text-white min-w-[180px]">
                    {line}
                  </TableCell>
                  {MONTHS.map((month) => (
                    <TableCell key={month} className="p-1 w-28">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-9 text-right tabular-nums"
                        value={values[line]?.[month] ?? ""}
                        onChange={(e) => setCell(line, month, e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
