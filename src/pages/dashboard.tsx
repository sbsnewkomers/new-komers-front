"use client";

import * as React from "react";
import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/Card";
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
import { Building2, TrendingUp, Euro, Activity, Calendar } from "lucide-react";

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
  trend?: string;
  trendUp?: boolean;
  icon?: React.ElementType;
  data?: { name: string; value: number }[];
};

const AVAILABLE_WIDGETS: { id: string; title: string; type: WidgetType }[] = [
  { id: "ca", title: "Chiffre d'affaires", type: "kpi" },
  { id: "marge", title: "Marge brute", type: "kpi" },
  { id: "tréso", title: "Trésorerie", type: "kpi" },
  { id: "evol", title: "Évolution CA", type: "chart" },
  { id: "repartition", title: "Répartition par entité", type: "chart" },
];

const DEMO_CHART_DATA = [
  { name: "Jan", value: 400 },
  { name: "Fév", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Avr", value: 800 },
  { name: "Mai", value: 500 },
  { name: "Juin", value: 700 },
];

const MONTH_DAY_REGEX = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])$/;
const LEGACY_MONTH_DAY_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const parseMonthDay = (value: string): { month: number; day: number } | null => {
  const normalized = LEGACY_MONTH_DAY_REGEX.test(value)
    ? `${value.split("-")[1]}-${value.split("-")[0]}`
    : value;

  if (!MONTH_DAY_REGEX.test(normalized)) return null;
  const [dayPart, monthPart] = normalized.split("-");
  const day = Number(dayPart);
  const month = Number(monthPart);
  const probe = new Date(Date.UTC(2000, month - 1, day));
  if (probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day) return null;
  return { month, day };
};

const getFiscalBoundsForYear = (
  fiscalYearStart: string,
  year: number,
): { start: Date; end: Date } | null => {
  const parsed = parseMonthDay(fiscalYearStart);
  if (!parsed) return null;

  const start = new Date(year, parsed.month - 1, parsed.day);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return { start, end };
};

const isFiscalYearActiveToday = (fiscalYearStart: string, today: Date): boolean => {
  const currentYearBounds = getFiscalBoundsForYear(fiscalYearStart, today.getFullYear());
  if (!currentYearBounds) return false;

  const activeBounds =
    today < currentYearBounds.start
      ? getFiscalBoundsForYear(fiscalYearStart, today.getFullYear() - 1)
      : currentYearBounds;

  if (!activeBounds) return false;
  return today >= activeBounds.start && today <= activeBounds.end;
};

const formatMonthDay = (fiscalYearStart: string): string => {
  const parsed = parseMonthDay(fiscalYearStart);
  if (!parsed) return fiscalYearStart;
  return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month).padStart(2, "0")}`;
};

export default function DashboardPage() {
  const { user, isAuthReady } = usePermissionsContext();
  const companies = useCompanies();
  const [widgets, setWidgets] = React.useState<Widget[]>([]);
  const [chartWidgets, setChartWidgets] = React.useState<Widget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [configModalOpen, setConfigModalOpen] = React.useState(false);
  const [drillDownOpen, setDrillDownOpen] = React.useState(false);
  const [selectedWidgetToAdd, setSelectedWidgetToAdd] = React.useState<string | null>(null);
  const [configForm, setConfigForm] = React.useState({ indicator: "", chartType: "bar", scope: "" });

  // Load companies only after auth bootstrap is done and we have a user,
  // so that /companies does not run before /auth/me on initial load.
  React.useEffect(() => {
    if (!isAuthReady || !user) return;
    void companies.fetchList();
  }, [isAuthReady, user, companies.fetchList]);

  // Simulate initial loading then rely on real data
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Initialize default widgets with real data once companies are loaded
  React.useEffect(() => {
    if (companies.loading) return;
    const list = companies.list ?? [];
    if (!list.length) return;
    if (widgets.length > 0 || chartWidgets.length > 0) return;

    const today = new Date();
    const activeFiscalYears = list.filter((c) => {
      if (!c.fiscal_year_start) return false;
      return isFiscalYearActiveToday(c.fiscal_year_start, today);
    }).length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestCompany = [...list].sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })[0];

    const byYearMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list.forEach((c: any) => {
      if (!c.fiscal_year_start) return;
      const label = formatMonthDay(c.fiscal_year_start);
      byYearMap.set(label, (byYearMap.get(label) ?? 0) + 1);
    });
    const byYearData = Array.from(byYearMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ name: label, value: count }));

    setWidgets(
      [
        {
          id: "k-total-companies",
          type: "kpi",
          title: "ENTREPRISES",
          value: list.length.toString(),
          description: "Total périmètre",
          trend: "+1 ce mois",
          trendUp: true,
          icon: Building2,
        },
        {
          id: "k-active-fiscal",
          type: "kpi",
          title: "EXERCICES EN COURS",
          value: activeFiscalYears.toString(),
          description: "Clôture prochaine",
          trend: "Stable",
          trendUp: true,
          icon: Calendar,
        },
        latestCompany && {
          id: "k-latest-company",
          type: "kpi",
          title: "DERNIÈRE CRÉATION",
          value: latestCompany.name ?? "—",
          description: latestCompany.siret
            ? `SIRET ${latestCompany.siret}`
            : "",
          icon: Activity,
        },
        {
          id: "k-latest-company",
          type: "kpi",
          title: "DERNIÈRE CRÉATION",
          value: latestCompany.name ?? "—",
          description: latestCompany.siret
            ? `SIRET ${latestCompany.siret}`
            : "",
          icon: Activity,
        },
      ].filter(Boolean) as Widget[],
    );

    if (byYearData.length) {
      setChartWidgets([
        {
          id: "c-companies-by-year",
          type: "chart",
          title: "Entreprises par début d'exercice",
          chartType: "bar",
          data: byYearData,
        },
      ]);
    }
  }, [companies.loading, companies.list, widgets.length, chartWidgets.length]);

  const allWidgets = [...widgets, ...chartWidgets];
  const isEmpty = allWidgets.length === 0 && !loading;
  const companyList = companies.list ?? [];
  const selectedCompanyId = "";

  const handleAddWidget = (widgetId: string) => {
    const def = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
    if (!def) return;
    if (def.type === "kpi") {
      setWidgets((prev) => [...prev, { id: `k-${Date.now()}`, type: "kpi", title: def.title.toUpperCase(), value: "—", description: "", icon: Euro }]);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-600">
          <Link href="/login" className="text-primary hover:underline font-medium">
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
      onCompanyChange={() => { }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard h-5 w-5 text-primary" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Vue d&apos;ensemble</h2>
            <p className="text-sm text-slate-500">Tableau de bord avec indicateurs clés et widgets personnalisables.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white hover:bg-slate-800"
        >
          Ajouter un widget
        </Button>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-6!">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isEmpty && !loading && (
        <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 border-slate-200 bg-slate-50/50">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Activity className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            Votre dashboard est vide
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez des widgets pour suivre vos indicateurs clés.
          </p>
          <Button
            className="mt-6 bg-primary text-white hover:bg-slate-800"
            onClick={() => setAddModalOpen(true)}
          >
            Ajouter votre premier widget
          </Button>
        </Card>
      )}

      {!loading && !isEmpty && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {widgets.map((w) => (
              <Card
                key={w.id}
                className="relative overflow-hidden transition-all hover:shadow-md bg-white"
              >
                <CardContent className="p-6!">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {w.title}
                      </p>
                      <div className="text-2xl font-bold text-primary mt-2">
                        {w.value}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-50 p-2.5">
                      {w.icon ? (
                        <w.icon className="h-5 w-5 text-slate-700" />
                      ) : (
                        <Activity className="h-5 w-5 text-slate-700" />
                      )}
                    </div>
                  </div>
                  {(w.trend || w.description) && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      {w.trend && (
                        <span
                          className={`font-medium ${w.trendUp ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {w.trend}
                        </span>
                      )}
                      {w.description && (
                        <span className="text-slate-400">{w.description}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {chartWidgets.map((w) => (
              <>
                <Card key={w.id} className="flex flex-col bg-white">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-primary">{w.title}</h3>
                  </div>
                  <CardContent className="flex-1 p-6!">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {w.chartType === "line" ? (
                          <LineChart
                            data={w.data?.map((d, i) => ({ ...d, value: i !== 2 ? d.value : d.value - (25 * i) })) ?? []}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#0f172a"
                              strokeWidth={3}
                              dot={{
                                fill: "#0f172a",
                                strokeWidth: 2,
                                r: 4,
                                stroke: "#fff",
                              }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart
                            data={w.data?.map((d, i) => ({ ...d, value: i === 2 ? d.value : d.value - ((25 * (i + 1)) * d.value / 100) })) ?? []}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                              cursor={{ fill: "#f1f5f9" }}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Bar
                              dataKey="value"
                              fill="#2967bc"
                              radius={[4, 4, 0, 0]}
                              barSize={40}
                            />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-primary"
                        onClick={() => setDrillDownOpen(true)}
                      >
                        Voir le détail →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card key={w.id} className="flex flex-col bg-white">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-primary">{w.title}</h3>
                  </div>
                  <CardContent className="flex-1 p-6!">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {w.chartType === "line" ? (
                          <LineChart
                            data={w.data?.map((d, i) => ({ ...d, value: i % 2 === 0 ? d.value : d.value * 2 })) ?? []}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#0f172a"
                              strokeWidth={3}
                              dot={{
                                fill: "#0f172a",
                                strokeWidth: 2,
                                r: 4,
                                stroke: "#fff",
                              }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart
                            data={w.data?.map((d, i) => ({ ...d, value: i % 2 === 0 ? d.value : d.value * 2 })) ?? []}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                              cursor={{ fill: "#f1f5f9" }}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Bar
                              dataKey="value"
                              fill="#2967bc"
                              radius={[4, 4, 0, 0]}
                              barSize={40}
                            />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-primary"
                        onClick={() => setDrillDownOpen(true)}
                      >
                        Voir le détail →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  onClick={() => {
                    setSelectedWidgetToAdd(w.id);
                    handleOpenConfig();
                  }}
                >
                  <div className="font-medium text-primary">{w.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {w.type === "kpi"
                      ? "Indicateur clé"
                      : "Graphique d'évolution"}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Annuler
            </Button>
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Indicateur
              </label>
              <Select
                value={configForm.indicator}
                onValueChange={(v) =>
                  setConfigForm((f) => ({ ...f, indicator: v }))
                }
                placeholder="Choisir un indicateur"
              >
                <option value="ca">Chiffre d&apos;affaires</option>
                <option value="marge">Marge brute</option>
                <option value="treso">Trésorerie</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type de graphique
              </label>
              <Select
                value={configForm.chartType}
                onValueChange={(v) =>
                  setConfigForm((f) => ({ ...f, chartType: v }))
                }
              >
                <option value="bar">Barres</option>
                <option value="line">Lignes</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Périmètre
              </label>
              <Select
                value={configForm.scope}
                onValueChange={(v) =>
                  setConfigForm((f) => ({ ...f, scope: v }))
                }
                placeholder="Choisir un périmètre"
              >
                {companyList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-primary text-white hover:bg-slate-800"
              onClick={() => {
                if (selectedWidgetToAdd) handleAddWidget(selectedWidgetToAdd);
                setConfigModalOpen(false);
              }}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Drill-down */}
      <DrillDownDialog
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        data={drillDownData}
      />
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
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-slate-50">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-slate-700">
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
