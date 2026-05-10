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
  // apiFetch détecte application/vnd.openxmlformats et retourne un ArrayBuffer propre
  const buffer = await apiFetch<ArrayBuffer>(`/structure/import/template`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_import.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

  // Ne pas passer de headers du tout — apiFetch gère le token via accessTokenGetter
  // et détecte FormData pour ne pas ajouter Content-Type
  return apiFetch<ImportReport>(`/structure/import/validate`, {
    method: "POST",
    body: formData,
    snackbar: { showError: true },
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

  // Plus de headers manuels
  return apiFetch<ImportExecuteResult>(`/structure/import/execute`, {
    method: "POST",
    body: formData,
    snackbar: { showError: true },
  });
}



