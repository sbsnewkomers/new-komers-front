"use client";

import * as React from "react";
import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type WidgetType = "kpi" | "chart";
type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  indicator?: string;
  chartType?: "bar" | "line";
  scope?: string;
  value?: string;
  description?: string;
  data?: { name: string; value: number }[];
};

const AVAILABLE_WIDGETS: { id: string; title: string; type: WidgetType }[] = [
  { id: "ca", title: "Chiffre d'affaires", type: "kpi" },
  { id: "marge", title: "Marge brute", type: "kpi" },
  { id: "tréso", title: "Trésorerie", type: "kpi" },
  { id: "evol", title: "Évolution CA", type: "chart" },
  { id: "repartition", title: "Répartition par entité", type: "chart" },
];

const DEMO_KPI_WIDGETS: Widget[] = [
  { id: "1", type: "kpi", title: "Chiffre d'affaires", value: "2,4 M€", description: "vs 2,1 M€ le mois dernier" },
  { id: "2", type: "kpi", title: "Marge brute", value: "34 %", description: "Objectif 32 %" },
  { id: "3", type: "kpi", title: "Trésorerie", value: "1,2 M€", description: "Seuil critique 500 k€" },
  { id: "4", type: "kpi", title: "Dettes fournisseurs", value: "380 k€", description: "Échéance 30j" },
];

const DEMO_CHART_DATA = [
  { name: "Jan", value: 400 },
  { name: "Fév", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Avr", value: 800 },
  { name: "Mai", value: 500 },
  { name: "Juin", value: 700 },
];

export default function DashboardPage() {
  const { user } = usePermissionsContext();
  const companies = useCompanies();
  const [widgets, setWidgets] = React.useState<Widget[]>([]);
  const [chartWidgets, setChartWidgets] = React.useState<Widget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [configModalOpen, setConfigModalOpen] = React.useState(false);
  const [drillDownOpen, setDrillDownOpen] = React.useState(false);
  const [selectedWidgetToAdd, setSelectedWidgetToAdd] = React.useState<string | null>(null);
  const [configForm, setConfigForm] = React.useState({ indicator: "", chartType: "bar", scope: "" });

  React.useEffect(() => {
    companies.fetchList();
  }, []);

  // Simulate initial loading
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const allWidgets = [...widgets, ...chartWidgets];
  const isEmpty = allWidgets.length === 0 && !loading;
  const companyList = companies.list ?? [];
  const selectedCompanyId = "";

  const handleAddWidget = (widgetId: string) => {
    const def = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
    if (!def) return;
    if (def.type === "kpi") {
      setWidgets((prev) => [...prev, { id: `k-${Date.now()}`, type: "kpi", title: def.title, value: "—", description: "" }]);
    } else {
      setChartWidgets((prev) => [...prev, { id: `c-${Date.now()}`, type: "chart", title: def.title, chartType: "bar", data: DEMO_CHART_DATA }]);
    }
    setSelectedWidgetToAdd(null);
    setAddModalOpen(false);
  };

  const handleOpenConfig = () => {
    setAddModalOpen(false);
    setConfigModalOpen(true);
  };

  const drillDownData = React.useMemo(
    () => [
      { entité: "Entité A", montant: 1200000, part: "50 %" },
      { entité: "Entité B", montant: 800000, part: "33 %" },
      { entité: "Entité C", montant: 400000, part: "17 %" },
    ],
    []
  );

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Connectez-vous
          </Link>{" "}
          pour accéder au dashboard.
        </p>
      </div>
    );
  }

  return (
    <AppLayout
      title="Dashboard"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={() => {}}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <Button onClick={() => setAddModalOpen(true)}>Ajouter un widget</Button>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20" /><Skeleton className="mt-2 h-3 w-32" /></CardContent>
            </Card>
          ))}
        </div>
      )}

      {isEmpty && !loading && (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-6xl">📊</div>
          <h3 className="text-lg font-semibold">Votre dashboard est vide</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez des widgets pour suivre vos indicateurs.</p>
          <Button className="mt-6" onClick={() => setAddModalOpen(true)}>Ajouter votre premier widget</Button>
        </Card>
      )}

      {!loading && !isEmpty && (
        <>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {widgets.map((w) => (
              <Card key={w.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{w.title}</CardTitle>
                  <span className="text-lg">📈</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{w.value}</div>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {chartWidgets.map((w) => (
              <Card key={w.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{w.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {w.chartType === "line" ? (
                        <LineChart data={w.data ?? []}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      ) : (
                        <BarChart data={w.data ?? []}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setDrillDownOpen(true)}>
                    Voir le détail
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modale Ajouter un widget */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent onClose={() => setAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Ajouter un widget</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {AVAILABLE_WIDGETS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setSelectedWidgetToAdd(w.id);
                    handleOpenConfig();
                  }}
                >
                  {w.title} <span className="text-zinc-400">({w.type === "kpi" ? "KPI" : "Graphique"})</span>
                </button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Configurer un widget */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent onClose={() => setConfigModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Configurer le widget</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Indicateur</label>
              <Select
                value={configForm.indicator}
                onValueChange={(v) => setConfigForm((f) => ({ ...f, indicator: v }))}
                placeholder="Choisir un indicateur"
              >
                <option value="ca">Chiffre d&apos;affaires</option>
                <option value="marge">Marge brute</option>
                <option value="treso">Trésorerie</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Type de graphique</label>
              <Select
                value={configForm.chartType}
                onValueChange={(v) => setConfigForm((f) => ({ ...f, chartType: v }))}
              >
                <option value="bar">Barres</option>
                <option value="line">Lignes</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Périmètre</label>
              <Select
                value={configForm.scope}
                onValueChange={(v) => setConfigForm((f) => ({ ...f, scope: v }))}
                placeholder="Choisir un périmètre"
              >
                {companyList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>Annuler</Button>
            <Button onClick={() => { if (selectedWidgetToAdd) handleAddWidget(selectedWidgetToAdd); setConfigModalOpen(false); }}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Drill-down */}
      <DrillDownDialog open={drillDownOpen} onOpenChange={setDrillDownOpen} data={drillDownData} />
    </AppLayout>
  );
}

function DrillDownDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: { entité: string; montant: number; part: string }[];
}) {
  const columns = React.useMemo<ColumnDef<{ entité: string; montant: number; part: string }>[]>(
    () => [
      { accessorKey: "entité", header: "Entité" },
      { accessorKey: "montant", header: "Montant", cell: (info) => `${(info.getValue() as number).toLocaleString("fr-FR")} €` },
      { accessorKey: "part", header: "Part" },
    ],
    []
  );
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Détail des données</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="border-b border-zinc-200 px-4 py-2 text-left font-medium dark:border-zinc-800">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
