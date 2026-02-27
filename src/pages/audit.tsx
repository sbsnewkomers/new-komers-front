"use client";

import { useState, useMemo } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Users,
  FileText,
  Upload,
  Trash2,
  Pencil,
  Plus,
  LogIn,
  LogOut,
  Eye,
} from "lucide-react";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "IMPORT" | "EXPORT" | "VIEW" | "INVITE" | "PERMISSION_CHANGE";
type AuditCategory = "AUTH" | "ENTITY" | "USER" | "IMPORT" | "PERMISSION" | "REPORTING";

type AuditEntry = {
  id: string;
  timestamp: string;
  user: { name: string; email: string; role: string };
  action: AuditAction;
  category: AuditCategory;
  resource: string;
  detail: string;
  ip: string;
  status: "success" | "failure";
};

const actionConfig: Record<AuditAction, { label: string; icon: typeof Plus; color: string }> = {
  CREATE: { label: "Cr\u00e9ation", icon: Plus, color: "text-emerald-600 bg-emerald-50" },
  UPDATE: { label: "Modification", icon: Pencil, color: "text-blue-600 bg-blue-50" },
  DELETE: { label: "Suppression", icon: Trash2, color: "text-red-600 bg-red-50" },
  LOGIN: { label: "Connexion", icon: LogIn, color: "text-slate-600 bg-slate-50" },
  LOGOUT: { label: "D\u00e9connexion", icon: LogOut, color: "text-slate-600 bg-slate-50" },
  IMPORT: { label: "Import", icon: Upload, color: "text-violet-600 bg-violet-50" },
  EXPORT: { label: "Export", icon: Download, color: "text-cyan-600 bg-cyan-50" },
  VIEW: { label: "Consultation", icon: Eye, color: "text-slate-500 bg-slate-50" },
  INVITE: { label: "Invitation", icon: Users, color: "text-amber-600 bg-amber-50" },
  PERMISSION_CHANGE: { label: "Permission", icon: Shield, color: "text-purple-600 bg-purple-50" },
};

const categoryLabels: Record<AuditCategory, string> = {
  AUTH: "Authentification",
  ENTITY: "Entit\u00e9s",
  USER: "Utilisateurs",
  IMPORT: "Import",
  PERMISSION: "Permissions",
  REPORTING: "Reporting",
};

const MOCK_ENTRIES: AuditEntry[] = [
  { id: "1", timestamp: "2026-02-20T14:32:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "CREATE", category: "ENTITY", resource: "Entreprise", detail: "Cr\u00e9ation de \"Acme Corp\" (groupe Holding Alpha)", ip: "192.168.1.42", status: "success" },
  { id: "2", timestamp: "2026-02-20T14:28:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "UPDATE", category: "ENTITY", resource: "Business Unit", detail: "Modification du nom \"BU Paris\" \u2192 \"BU \u00cele-de-France\"", ip: "10.0.0.15", status: "success" },
  { id: "3", timestamp: "2026-02-20T14:15:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "INVITE", category: "USER", resource: "Utilisateur", detail: "Invitation envoy\u00e9e \u00e0 marc.dupont@exemple.fr (r\u00f4le: Manager)", ip: "192.168.1.42", status: "success" },
  { id: "4", timestamp: "2026-02-20T13:58:00Z", user: { name: "Thomas Bernard", email: "thomas@newkomers.io", role: "MANAGER" }, action: "IMPORT", category: "IMPORT", resource: "FEC", detail: "Import FEC \"fec_2025_q4.csv\" pour Acme Corp (1 247 lignes)", ip: "172.16.0.8", status: "success" },
  { id: "5", timestamp: "2026-02-20T13:45:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "PERMISSION_CHANGE", category: "PERMISSION", resource: "Permission", detail: "Attribution acc\u00e8s READALL sur Groupe \"Holding Alpha\" \u00e0 thomas@newkomers.io", ip: "10.0.0.15", status: "success" },
  { id: "6", timestamp: "2026-02-20T13:30:00Z", user: { name: "Marc Dupont", email: "marc@newkomers.io", role: "END_USER" }, action: "LOGIN", category: "AUTH", resource: "Session", detail: "Connexion r\u00e9ussie depuis Chrome / Windows", ip: "85.14.22.103", status: "success" },
  { id: "7", timestamp: "2026-02-20T13:12:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "DELETE", category: "ENTITY", resource: "Business Unit", detail: "Suppression de \"BU Lyon\" (Acme Corp)", ip: "192.168.1.42", status: "success" },
  { id: "8", timestamp: "2026-02-20T12:55:00Z", user: { name: "Thomas Bernard", email: "thomas@newkomers.io", role: "MANAGER" }, action: "EXPORT", category: "REPORTING", resource: "Rapport", detail: "Export PDF du SIG Q4 2025 \u2014 Acme Corp", ip: "172.16.0.8", status: "success" },
  { id: "9", timestamp: "2026-02-20T12:40:00Z", user: { name: "unknown", email: "hacker@bad.com", role: "N/A" }, action: "LOGIN", category: "AUTH", resource: "Session", detail: "Tentative de connexion \u00e9chou\u00e9e (identifiants invalides)", ip: "45.33.12.77", status: "failure" },
  { id: "10", timestamp: "2026-02-20T12:20:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "UPDATE", category: "USER", resource: "Utilisateur", detail: "Changement de r\u00f4le de marc@newkomers.io : END_USER \u2192 MANAGER", ip: "10.0.0.15", status: "success" },
  { id: "11", timestamp: "2026-02-20T11:50:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "CREATE", category: "ENTITY", resource: "Groupe", detail: "Cr\u00e9ation du groupe \"Holding Alpha\"", ip: "192.168.1.42", status: "success" },
  { id: "12", timestamp: "2026-02-20T11:30:00Z", user: { name: "Thomas Bernard", email: "thomas@newkomers.io", role: "MANAGER" }, action: "VIEW", category: "REPORTING", resource: "Rapport", detail: "Consultation du SIG Q3 2025 \u2014 Acme Corp", ip: "172.16.0.8", status: "success" },
  { id: "13", timestamp: "2026-02-20T10:15:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "IMPORT", category: "IMPORT", resource: "CSV", detail: "Import CSV entreprises \"batch_feb.csv\" (12 entreprises)", ip: "10.0.0.15", status: "success" },
  { id: "14", timestamp: "2026-02-20T09:45:00Z", user: { name: "Marc Dupont", email: "marc@newkomers.io", role: "MANAGER" }, action: "UPDATE", category: "ENTITY", resource: "Entreprise", detail: "Mise \u00e0 jour SIRET de \"TechVision SAS\"", ip: "85.14.22.103", status: "success" },
  { id: "15", timestamp: "2026-02-20T09:00:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "LOGIN", category: "AUTH", resource: "Session", detail: "Connexion r\u00e9ussie depuis Firefox / macOS", ip: "192.168.1.42", status: "success" },
  { id: "16", timestamp: "2026-02-19T18:30:00Z", user: { name: "Thomas Bernard", email: "thomas@newkomers.io", role: "MANAGER" }, action: "LOGOUT", category: "AUTH", resource: "Session", detail: "D\u00e9connexion manuelle", ip: "172.16.0.8", status: "success" },
  { id: "17", timestamp: "2026-02-19T17:45:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "DELETE", category: "USER", resource: "Utilisateur", detail: "Suppression du compte ancien@example.com", ip: "10.0.0.15", status: "success" },
  { id: "18", timestamp: "2026-02-19T16:20:00Z", user: { name: "James Wilson", email: "james@newkomers.io", role: "SUPER_ADMIN" }, action: "PERMISSION_CHANGE", category: "PERMISSION", resource: "Permission", detail: "R\u00e9vocation acc\u00e8s DELETE sur Entreprise pour marc@newkomers.io", ip: "192.168.1.42", status: "success" },
  { id: "19", timestamp: "2026-02-19T15:10:00Z", user: { name: "Thomas Bernard", email: "thomas@newkomers.io", role: "MANAGER" }, action: "CREATE", category: "ENTITY", resource: "Business Unit", detail: "Cr\u00e9ation de \"BU Marseille\" dans TechVision SAS", ip: "172.16.0.8", status: "success" },
  { id: "20", timestamp: "2026-02-19T14:00:00Z", user: { name: "Sophie Martin", email: "sophie@newkomers.io", role: "ADMIN" }, action: "EXPORT", category: "REPORTING", resource: "Rapport", detail: "Export Excel du budget pr\u00e9visionnel 2026", ip: "10.0.0.15", status: "success" },
];

const PAGE_SIZE = 10;

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_ENTRIES.filter((e) => {
      const matchSearch = !q ||
        e.user.name.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q);
      const matchAction = !actionFilter || e.action === actionFilter;
      const matchCategory = !categoryFilter || e.category === categoryFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchSearch && matchAction && matchCategory && matchStatus;
    });
  }, [search, actionFilter, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: MOCK_ENTRIES.length,
    today: MOCK_ENTRIES.filter((e) => e.timestamp.startsWith("2026-02-20")).length,
    failures: MOCK_ENTRIES.filter((e) => e.status === "failure").length,
    users: new Set(MOCK_ENTRIES.map((e) => e.user.email)).size,
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
      " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AppLayout title="Audit" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head><title>Journal d&apos;audit</title></Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Journal d&apos;audit</h2>
            <p className="text-sm text-slate-500">Historique complet des actions sur la plateforme.</p>
          </div>
          <Button variant="outline" className="h-9 gap-2 border-slate-200 text-slate-700">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-white" },
            { label: "Aujourd\u2019hui", value: stats.today, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "\u00c9checs", value: stats.failures, color: "text-red-600", bg: "bg-red-50" },
            { label: "Utilisateurs", value: stats.users, color: "text-emerald-700", bg: "bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-10 border-slate-200 bg-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }} className="h-9 w-[160px] border-slate-200 bg-white text-sm">
            <option value="">Toutes cat&eacute;gories</option>
            {(Object.keys(categoryLabels) as AuditCategory[]).map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }} className="h-9 w-[160px] border-slate-200 bg-white text-sm">
            <option value="">Toutes actions</option>
            {(Object.keys(actionConfig) as AuditAction[]).map((a) => (
              <option key={a} value={a}>{actionConfig[a].label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }} className="h-9 w-[140px] border-slate-200 bg-white text-sm">
            <option value="">Tous statuts</option>
            <option value="success">Succ&egrave;s</option>
            <option value="failure">&Eacute;chec</option>
          </Select>
          {(search || actionFilter || categoryFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setActionFilter(""); setCategoryFilter(""); setStatusFilter(""); setPage(1); }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 underline"
            >
              R&eacute;initialiser
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">D&eacute;tail</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">IP</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((entry) => {
                  const cfg = actionConfig[entry.action];
                  const Icon = cfg.icon;
                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                        {formatTime(entry.timestamp)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                            {entry.user.name[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{entry.user.name}</p>
                            <p className="truncate text-[10px] text-slate-400">{entry.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-3">
                        <p className="truncate text-sm text-slate-700">{entry.detail}</p>
                        <p className="text-[10px] text-slate-400">{entry.resource}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">
                        {entry.ip}
                      </td>
                      <td className="px-5 py-3">
                        {entry.status === "success" ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            Succ&egrave;s
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            &Eacute;chec
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                        <Filter className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">Aucun r&eacute;sultat</p>
                      <p className="mt-1 text-xs text-slate-500">Modifiez vos filtres pour voir plus d&apos;entr&eacute;es.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {filtered.length} r&eacute;sultat{filtered.length > 1 ? "s" : ""} &mdash; page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                      p === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
