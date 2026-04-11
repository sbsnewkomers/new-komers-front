"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Upload,
  Trash2,
  Pencil,
  Plus,
  LogIn,
  LogOut,
  Eye,
} from "lucide-react";
import { fetchAuditLogs, exportAuditLogsCsv, type AuditLogDto } from "@/lib/auditApi";

type AuditActionUi =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "IMPORT"
  | "EXPORT"
  | "VIEW"
  | "INVITE"
  | "PERMISSION_CHANGE";

type AuditCategory = "AUTH" | "ENTITY" | "USER" | "IMPORT" | "PERMISSION" | "REPORTING";

type AuditEntry = {
  id: string;
  timestamp: string;
  user: { name: string; email: string; role: string };
  action: AuditActionUi;
  category: AuditCategory;
  resource: string;
  detail: string;
  ip: string;
  status: "success" | "failure";
};

const actionConfig: Record<AuditActionUi, { label: string; icon: typeof Plus; color: string }> = {
  CREATE: { label: "Création", icon: Plus, color: "text-emerald-600 bg-emerald-50" },
  UPDATE: { label: "Modification", icon: Pencil, color: "text-blue-600 bg-blue-50" },
  DELETE: { label: "Suppression", icon: Trash2, color: "text-red-600 bg-red-50" },
  LOGIN: { label: "Connexion", icon: LogIn, color: "text-slate-600 bg-slate-50" },
  LOGOUT: { label: "Déconnexion", icon: LogOut, color: "text-slate-600 bg-slate-50" },
  IMPORT: { label: "Import", icon: Upload, color: "text-violet-600 bg-violet-50" },
  EXPORT: { label: "Export", icon: Download, color: "text-cyan-600 bg-cyan-50" },
  VIEW: { label: "Consultation", icon: Eye, color: "text-slate-500 bg-slate-50" },
  INVITE: { label: "Invitation", icon: Users, color: "text-amber-600 bg-amber-50" },
  PERMISSION_CHANGE: { label: "Permission", icon: Shield, color: "text-purple-600 bg-purple-50" },
};

const categoryLabels: Record<AuditCategory, string> = {
  AUTH: "Authentification",
  ENTITY: "Entités",
  USER: "Utilisateurs",
  IMPORT: "Import",
  PERMISSION: "Permissions",
  REPORTING: "Reporting",
};

const PAGE_SIZE = 20;

function severityIsFailure(severity?: string | null): boolean {
  if (!severity) return false;
  const s = severity.toUpperCase();
  return s === "WARNING" || s === "ERROR" || s === "CRITICAL";
}

function summarizeDetails(details: unknown): string {
  if (!details) return "";
  if (typeof details === "string") return details;
  if (typeof details === "number" || typeof details === "boolean") return String(details);
  if (typeof details === "object") {
    const d = details as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
    if (typeof d.reason === "string") return d.reason;
    // Common audit payload shapes we want to render nicely (avoid raw JSON in UI)
    if (Array.isArray(d.updatedFields)) {
      const fields = d.updatedFields.filter((x) => typeof x === "string") as string[];
      if (fields.length > 0) return `Champs modifiés : ${fields.join(", ")}`;
    }
    if (d.changes && typeof d.changes === "object") {
      const changes = d.changes as Record<string, unknown>;
      const keys = Object.keys(changes).filter((k) => changes[k] !== undefined);
      if (keys.length > 0) {
        const pairs = keys.slice(0, 6).map((k) => {
          const v = changes[k];
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            return `${k}: ${String(v)}`;
          }
          if (Array.isArray(v)) return `${k}: [${v.length}]`;
          if (v && typeof v === "object") return `${k}: {…}`;
          return `${k}: —`;
        });
        return `Modifications : ${pairs.join(" · ")}${keys.length > 6 ? " · …" : ""}`;
      }
      return "Modifications enregistrées";
    }
    if (typeof d.email === "string" && typeof d.role === "string") {
      return `Email : ${d.email} · Rôle : ${d.role}`;
    }
    if (typeof d.email === "string" && typeof d.invitationCleaned === "boolean") {
      return `Email : ${d.email} · Invitation nettoyée : ${d.invitationCleaned ? "oui" : "non"}`;
    }
    if (typeof d.name === "string" && typeof d.code === "string") {
      const companyId =
        typeof d.companyId === "string" ? ` · Société : ${String(d.companyId).slice(0, 8)}` : "";
      return `Nom : ${d.name} · Code : ${d.code}${companyId}`;
    }
    if (typeof d.ownerType === "string" && typeof d.ownerId === "string") {
      const pct = typeof d.percentage === "number" ? ` · ${d.percentage}%` : "";
      const companies = Array.isArray(d.companyIds)
        ? ` · Sociétés : ${(d.companyIds as unknown[]).length}`
        : "";
      return `Actionnaire : ${d.ownerType} ${String(d.ownerId).slice(0, 8)}${pct}${companies}`;
    }
    if (typeof d.ownerId === "string" && typeof d.percentage === "number") {
      return `Actionnaire : ${String(d.ownerId).slice(0, 8)} · ${d.percentage}%`;
    }
    try {
      return JSON.stringify(details);
    } catch {
      return "[détails non disponibles]";
    }
  }
  return "";
}

function formatDetailsValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length}]`;
  if (typeof v === "object") return "{…}";
  return String(v);
}

function toKeyValueDetails(details: unknown): Array<{ key: string; value: string }> {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  const d = details as Record<string, unknown>;
  const preferredOrder = [
    "message",
    "reason",
    "email",
    "role",
    "name",
    "code",
    "ownerType",
    "ownerId",
    "percentage",
    "companyId",
    "companyIds",
    "updatedFields",
    "changes",
  ];

  const keys = Array.from(new Set([...preferredOrder, ...Object.keys(d)]))
    .filter((k) => d[k] !== undefined)
    .slice(0, 14);

  return keys.map((key) => ({ key, value: formatDetailsValue(d[key]) }));
}

function mapBackendActionToUi(action: string): AuditActionUi {
  const a = action.toUpperCase();
  if (a === "LOGIN" || a === "LOGIN_FAILED") return "LOGIN";
  if (a === "LOGOUT") return "LOGOUT";
  if (a.startsWith("INVITATION_") || a.includes("INVITATION")) return "INVITE";
  if (a.includes("PERMISSION") || a === "UNAUTHORIZED_ACTION") return "PERMISSION_CHANGE";
  if (a.includes("IMPORT")) return "IMPORT";
  if (a.endsWith("_CREATED")) return "CREATE";
  if (
    a.endsWith("_UPDATED") ||
    a.endsWith("_SCOPE_CHANGED") ||
    a.endsWith("_ROLE_CHANGED") ||
    a.endsWith("_STATUS_CHANGE") ||
    a.endsWith("_PASSWORD_CHANGE") ||
    a === "PASSWORD_RESET_REQUESTED" ||
    a === "PASSWORD_CHANGED"
  ) {
    return "UPDATE";
  }
  if (a.endsWith("_DELETED") || a.endsWith("_ARCHIVED")) return "DELETE";
  if (a === "STRUCTURE_IMPORTED" || a === "DATA_IMPORTED") return "IMPORT";
  return "VIEW";
}

function mapCategoryFromLog(log: AuditLogDto): AuditCategory {
  const a = log.action.toUpperCase();
  if (
    a.includes("LOGIN") ||
    a.includes("LOGOUT") ||
    a.includes("PASSWORD") ||
    a === "UNAUTHORIZED_ACTION"
  ) {
    return "AUTH";
  }
  if (a.startsWith("USER_")) return "USER";
  if (a.includes("GROUP") || a.includes("COMPANY") || a.includes("BU") || a.includes("FISCAL_YEAR") || a.includes("SHAREHOLDER")) {
    return "ENTITY";
  }
  if (a.includes("IMPORT")) return "IMPORT";
  if (a.includes("PERMISSION") || a.includes("PERIMETER")) return "PERMISSION";
  return "REPORTING";
}

function mapLogToEntry(log: AuditLogDto): AuditEntry {
  const status: "success" | "failure" = severityIsFailure(log.severity) ? "failure" : "success";
  const uiAction = mapBackendActionToUi(log.action);
  const category = mapCategoryFromLog(log);

  const email = log.userEmail ?? "inconnu";
  const resourceParts: string[] = [];
  if (log.entityType) resourceParts.push(log.entityType);
  if (log.entityId) resourceParts.push(`#${String(log.entityId).slice(0, 8)}`);

  return {
    id: log.id,
    timestamp: log.createdAt,
    user: { name: email, email, role: "N/A" },
    action: uiAction,
    category,
    resource: resourceParts.join(" ") || "—",
    detail: summarizeDetails(log.details),
    ip: log.ipAddress ?? "",
    status,
  };
}

const ALLOWED_AUDIT_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

export default function AuditPage() {
  const router = useRouter();
  const { user, isAuthReady } = usePermissionsContext();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditActionUi | "">("");
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "success" | "failure">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    const allowed = user?.role && ALLOWED_AUDIT_ROLES.includes(user.role as (typeof ALLOWED_AUDIT_ROLES)[number]);
    if (!allowed) {
      router.replace("/403");
    }
  }, [isAuthReady, user?.role, router]);

  const canAccessAudit = user?.role && ALLOWED_AUDIT_ROLES.includes(user.role as (typeof ALLOWED_AUDIT_ROLES)[number]);

  const loadLogs = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAuditLogs({
          page: pageToLoad,
          limit: PAGE_SIZE,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setLogs(res.data);
        setTotal(res.meta.total);
        setLastPage(res.meta.lastPage || 1);
      } catch (e) {
        setLogs([]);
        setTotal(0);
        setLastPage(1);
        setError(e instanceof Error ? e.message : "Impossible de charger les journaux d'audit.");
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate],
  );

  useEffect(() => {
    void loadLogs(page);
  }, [loadLogs, page]);

  const uiEntries = useMemo(() => logs.map(mapLogToEntry), [logs]);
  const logsById = useMemo(() => new Map(logs.map((l) => [l.id, l])), [logs]);
  const selectedEntry = useMemo(() => (selectedLog ? mapLogToEntry(selectedLog) : null), [selectedLog]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return uiEntries.filter((e) => {
      const matchSearch =
        !q ||
        e.user.name.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q);
      const matchAction = !actionFilter || e.action === actionFilter;
      const matchCategory = !categoryFilter || e.category === categoryFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchSearch && matchAction && matchCategory && matchStatus;
    });
  }, [uiEntries, search, actionFilter, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayCount = uiEntries.filter((e) => e.timestamp.startsWith(todayIso)).length;
    const failures = uiEntries.filter((e) => e.status === "failure").length;
    const users = new Set(uiEntries.map((e) => e.user.email)).size;
    return {
      total,
      today: todayCount,
      failures,
      users,
    };
  }, [uiEntries, total]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
      " " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleExportCsv = async () => {
    try {
      await exportAuditLogsCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch {
      // errors already surfaced via snackbar in exportAuditLogsCsv
    }
  };

  const totalPages = Math.max(1, lastPage);

  if (isAuthReady && !canAccessAudit) {
    return null;
  }

  return (
    <AppLayout title="Audit" companies={[]} selectedCompanyId="" onCompanyChange={() => { }}>
      <Head>
        <title>Journal d&apos;audit</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history h-5 w-5 text-primary" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M12 7v5l4 2"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Journal d&apos;audit</h2>
              <p className="text-sm text-slate-500">Historique complet des actions sur la plateforme.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 border-slate-200 text-slate-700"
            onClick={handleExportCsv}
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-white" },
            { label: "Aujourd’hui", value: stats.today, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Échecs", value: stats.failures, color: "text-red-600", bg: "bg-red-50" },
            { label: "Utilisateurs", value: stats.users, color: "text-emerald-700", bg: "bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
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
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="h-9 pl-10 border-slate-200 bg-white"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as AuditCategory | "");
            }}
            className="h-9 flex-1 border-slate-200 bg-white text-sm"
          >
            <option value="">Toutes catégories</option>
            {(Object.keys(categoryLabels) as AuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </Select>
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v as AuditActionUi | "");
            }}
            className="h-9 flex-1 border-slate-200 bg-white text-sm"
          >
            <option value="">Toutes actions</option>
            {(Object.keys(actionConfig) as AuditActionUi[]).map((a) => (
              <option key={a} value={a}>
                {actionConfig[a].label}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as "" | "success" | "failure");
            }}
            className="h-9 flex-1 border-slate-200 bg-white text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="success">Succès</option>
            <option value="failure">Échec</option>
          </Select>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-[150px] border-slate-200 bg-white text-sm"
            />
            <span className="text-xs text-slate-400">à</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-[150px] border-slate-200 bg-white text-sm"
            />
          </div>
          {(search || actionFilter || categoryFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActionFilter("");
                setCategoryFilter("");
                setStatusFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Utilisateur
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Détail
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        IP
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((entry) => {
                      const cfg = actionConfig[entry.action];
                      const Icon = cfg.icon;
                      return (
                        <tr
                          key={entry.id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer transition-colors hover:bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                          onClick={() => {
                            const log = logsById.get(entry.id) ?? null;
                            setSelectedLog(log);
                            setDetailOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            const log = logsById.get(entry.id) ?? null;
                            setSelectedLog(log);
                            setDetailOpen(true);
                          }}
                          aria-label="Voir le détail de l'audit"
                        >
                          <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                            {formatTime(entry.timestamp)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                                {entry.user.name[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">
                                  {entry.user.name}
                                </p>
                                <p className="truncate text-[10px] text-slate-400">
                                  {entry.user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}
                            >
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="max-w-xs px-5 py-3">
                            <p className="truncate text-sm text-slate-700">{entry.detail || "—"}</p>
                            <p className="text-[10px] text-slate-400">{entry.resource}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">
                            {entry.ip || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {entry.status === "success" ? (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                Succès
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                Échec
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                            <Filter className="h-5 w-5 text-slate-300" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">Aucun résultat</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Modifiez vos filtres pour voir plus d&apos;entrées.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (backend-level) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    {stats.total} log{stats.total > 1 ? "s" : ""} &mdash; page {page}/{totalPages}
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
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${p === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
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
            </>
          )}
        </div>

        <Dialog
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setSelectedLog(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détail audit</DialogTitle>
              {selectedEntry && (
                <p className="text-xs text-slate-500">
                  {formatTime(selectedEntry.timestamp)} · {selectedEntry.user.email}
                </p>
              )}
            </DialogHeader>

            <div className="px-4 pb-1 space-y-4">
              {!selectedLog || !selectedEntry ? (
                <div className="text-sm text-slate-600">Aucun détail disponible.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {actionConfig[selectedEntry.action]?.label ?? selectedEntry.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{categoryLabels[selectedEntry.category]}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statut</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {selectedEntry.status === "success" ? "Succès" : "Échec"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">IP: {selectedEntry.ip || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ressource</p>
                    <p className="mt-1 text-sm text-slate-900">{selectedEntry.resource || "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedEntry.detail || "—"}</p>
                  </div>

                  {toKeyValueDetails(selectedLog.details).length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Détails</p>
                      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {toKeyValueDetails(selectedLog.details).map((row) => (
                          <div key={row.key} className="rounded-md bg-slate-50 px-3 py-2">
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              {row.key}
                            </dt>
                            <dd className="mt-0.5 text-xs text-slate-800 wrap-break-word">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="p-4 pt-0">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedLog(null);
                }}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

