import { apiFetch } from "@/lib/apiClient";

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

export async function downloadStructureTemplate(accessToken: string | null): Promise<void> {
  const res = await apiFetch(`/structure/import/template`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  // Convert response to blob for download
  const blob = new Blob([res as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
  workspaceId?: string,
): Promise<ImportReport> {
  const formData = new FormData();
  formData.append("file", file);
  if (workspaceId) {
    formData.append("workspaceId", workspaceId);
  }

  return apiFetch<ImportReport>(`/structure/import/validate`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
    snackbar: { showError: true }
  });
}

export async function executeStructureImport(
  file: File,
  accessToken: string | null,
  workspaceId?: string,
): Promise<ImportExecuteResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (workspaceId) {
    formData.append("workspaceId", workspaceId);
  }

  return apiFetch<ImportExecuteResult>(`/structure/import/execute`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
    snackbar: { showError: true }
  });
}

