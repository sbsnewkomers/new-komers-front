import { getApiBaseUrl } from "@/lib/apiClient";
import { PermissionAction } from "@/permissions/actions"; // not strictly needed but keeps enums aligned if reused later

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  entitiesToCreate: {
    groups: number;
    companies: number;
    businessUnits: number;
  };
};

export type ImportError = {
  sheet: string;
  row: number;
  column: string;
  value?: unknown;
  message: string;
};

export type ImportReport = {
  summary: ImportSummary;
  errors: ImportError[];
};

export type ImportExecuteResult = {
  created: {
    groups: number;
    companies: number;
    businessUnits: number;
  };
};

type AuthHeaders = { accessToken: string | null };

function authHeaders({ accessToken }: AuthHeaders): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function downloadStructureTemplate(accessToken: string | null): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/structure/import/template`, {
    method: "GET",
    headers: {
      ...authHeaders({ accessToken }),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Échec du téléchargement du modèle (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_import.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export async function validateStructureFile(
  file: File,
  accessToken: string | null,
): Promise<ImportReport> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBaseUrl()}/structure/import/validate`, {
    method: "POST",
    headers: {
      ...authHeaders({ accessToken }),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Validation échouée (${res.status})`);
  }

  return (await res.json()) as ImportReport;
}

export async function executeStructureImport(
  file: File,
  accessToken: string | null,
): Promise<ImportExecuteResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBaseUrl()}/structure/import/execute`, {
    method: "POST",
    headers: {
      ...authHeaders({ accessToken }),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Import échoué (${res.status})`);
  }

  return (await res.json()) as ImportExecuteResult;
}

