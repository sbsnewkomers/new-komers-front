import { apiFetch, getApiBaseUrl } from "@/lib/apiClient";
import { emitSnackbar } from "@/ui/snackbarBus";

export type AuditLogDto = {
  id: string;
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  details?: unknown;
  ipAddress?: string | null;
  severity: string;
  createdAt: string;
};

export type AuditLogsResponse = {
  data: AuditLogDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
};

export type AuditLogsQuery = {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
};

function buildQueryString(query: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAuditLogs(query: AuditLogsQuery): Promise<AuditLogsResponse> {
  const qs = buildQueryString(query as Record<string, string | number | undefined | null>);
  return apiFetch<AuditLogsResponse>(`/admin/audit-logs${qs}`, {
    method: "GET",
    snackbar: { showError: true },
  });
}

export type AuditExportQuery = Pick<
  AuditLogsQuery,
  "userId" | "action" | "entityType" | "entityId" | "startDate" | "endDate"
>;

export async function exportAuditLogsCsv(query: AuditExportQuery): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const qs = buildQueryString(query as Record<string, string | number | undefined | null>);
  const url = `${baseUrl}/admin/audit-logs/export${qs}`;

  let authHeader: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("nk-auth-tokens");
      if (raw) {
        const parsed = JSON.parse(raw) as { accessToken?: string };
        if (parsed.accessToken) {
          authHeader = `Bearer ${parsed.accessToken}`;
        }
      }
    } catch {
      // ignore storage/parse errors
    }
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message =
      text || `Échec de l'export CSV (${res.status} ${res.statusText || ""})`.trim();
    emitSnackbar({ message, variant: "error" });
    throw new Error(message);
  }

  const blob = await res.blob();

  if (typeof window === "undefined") return;

  const contentDisposition =
    res.headers.get("Content-Disposition") ?? res.headers.get("content-disposition");
  let filename = "audit-logs.csv";

  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(contentDisposition);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1].replace(/"/g, ""));
    }
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);

  emitSnackbar({ message: "Export CSV démarré", variant: "success" });
}

