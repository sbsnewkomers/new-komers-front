"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const PERIODS = [
  { value: "2025", label: "Année 2025" },
  { value: "t1-2025", label: "Trimestre 1 2025" },
  { value: "t2-2025", label: "Trimestre 2 2025" },
  { value: "2024", label: "Année 2024" },
];

const CARTO_OPTIONS = [
  { value: "standard", label: "Vue Standard" },
  { value: "synthetique", label: "Vue Synthétique" },
];

const PROJECTION_OPTIONS = [
  { value: "n1", label: "Basée sur N-1" },
  { value: "budget", label: "Basée sur le Budget" },
];

type SigRow = {
  id: string;
  label: string;
  level: "group" | "line";
  parentId?: string;
  values: (number | null)[];
};

const MOCK_SIG: SigRow[] = [
  { id: "g1", label: "Chiffre d'affaires", level: "group", values: [100, 110, 105, 120, 115, 130, 125, 140, 135, 150, 145, 160] },
  { id: "l1", label: "  Produits d'exploitation", level: "line", parentId: "g1", values: [80, 88, 84, 96, 92, 104, 100, 112, 108, 120, 116, 128] },
  { id: "l2", label: "  Autres produits", level: "line", parentId: "g1", values: [20, 22, 21, 24, 23, 26, 25, 28, 27, 30, 29, 32] },
  { id: "g2", label: "Charges", level: "group", values: [90, 95, 92, 98, 96, 100, 98, 102, 100, 104, 102, 106] },
  { id: "l3", label: "  Achats", level: "line", parentId: "g2", values: [50, 52, 51, 54, 53, 55, 54, 56, 55, 57, 56, 58] },
  { id: "l4", label: "  Charges de personnel", level: "line", parentId: "g2", values: [40, 43, 41, 44, 42, 45, 43, 46, 45, 47, 46, 48] },
];

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function ReportingPage() {
  const companies = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [period, setPeriod] = useState("2025");
  const [carto, setCarto] = useState("standard");
  const [projection, setProjection] = useState("n1");
  const [editMode, setEditMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["g1", "g2"]));
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [coefficientsOpen, setCoefficientsOpen] = useState(false);
  const [coefficients, setCoefficients] = useState<Record<string, number>>({
    "Chiffre d'affaires": 100,
    "Charges": 85,
    "Achats": 50,
    "Charges de personnel": 35,
  });

  useEffect(() => {
    companies.fetchList();
  }, []);

  const companyList = companies.list ?? [];

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleRows = MOCK_SIG.filter((row) => {
    if (row.level === "group") return true;
    return row.parentId && expandedGroups.has(row.parentId);
  });

  return (
    <AppLayout
      title="Reporting"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
    >
      <Head>
        <title>Reporting</title>
      </Head>
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={period} onValueChange={setPeriod}>
            {PERIODS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select value={carto} onValueChange={setCarto}>
            {CARTO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select value={projection} onValueChange={setProjection}>
            {PROJECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => setEditMode((e) => !e)}
            className={`w-full sm:w-auto ${editMode ? "ring-2 ring-primary" : ""}`}
          >
            {editMode ? "Désactiver" : "Mode édition cartographie"}
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {editMode && <TableHead className="w-10"></TableHead>}
                <TableHead className="min-w-[200px]">Libellé</TableHead>
                {MONTHS.slice(0, 6).map((m) => (
                  <TableHead key={m} className="text-right w-24">
                    {m}
                  </TableHead>
                ))}
                {MONTHS.slice(6, 12).map((m) => (
                  <TableHead key={m} className="text-right w-24 bg-muted">
                    {m}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.id}>
                  {editMode && (
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selectedRowIds.has(row.id)}
                        onCheckedChange={() => toggleSelectRow(row.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="min-w-[200px]">
                    <span className="flex items-center gap-2">
                      {row.level === "group" && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={expandedGroups.has(row.id) ? "Replier" : "Déplier"}
                        >
                          {expandedGroups.has(row.id) ? "▼" : "▶"}
                        </button>
                      )}
                      {row.level === "line" && <span className="w-4" />}
                      <span className={row.level === "group" ? "font-medium" : ""}>
                        {row.label}
                      </span>
                    </span>
                  </TableCell>
                  {row.values.slice(0, 6).map((v, i) => (
                    <TableCell key={i} className="text-right w-24 tabular-nums">
                      {v != null ? v.toLocaleString("fr-FR") : "—"}
                    </TableCell>
                  ))}
                  {row.values.slice(6, 12).map((v, i) => (
                    <TableCell key={i} className="text-right w-24 bg-muted tabular-nums">
                      {v != null ? v.toLocaleString("fr-FR") : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {editMode && (
          <div className="flex flex-col gap-3 border-t bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedRowIds.size} ligne(s) sélectionnée(s)
            </span>
            <Button variant="outline" onClick={() => setNewGroupOpen(true)}>
              Nouveau groupe
            </Button>
            <Button variant="outline" onClick={() => setCoefficientsOpen(true)}>
              Configurer les coefficients
            </Button>
            <Button disabled={selectedRowIds.size === 0}>Regrouper</Button>
          </div>
        )}
      </div>

      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Nouveau groupe</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
              type="text"
              placeholder="Nom du nouveau groupe"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setNewGroupOpen(false);
                setNewGroupName("");
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={coefficientsOpen} onOpenChange={setCoefficientsOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Configurer les coefficients</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {Object.entries(coefficients).map(([name, pct]) => (
              <div key={name} className="flex items-center justify-between gap-4">
                <span className="text-sm">{name}</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-24"
                  value={pct}
                  onChange={(e) =>
                    setCoefficients((prev) => ({
                      ...prev,
                      [name]: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoefficientsOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => setCoefficientsOpen(false)}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
