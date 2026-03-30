import { apiFetch } from "./apiClient";

export interface FecUploadRequest {
  companyId: string;
  fiscalYearId: string;
  userId: string;
  file: File;
}

export interface FecValidationError {
  line: number;
  column: string;
  value: string;
  reason: string;
}

export interface FecImportResponse {
  success: boolean;
  totalLines: number;
  validLinesCount: number;
  errors: FecValidationError[];
  message: string;
  importId?: string;
}

export async function uploadFecFile(data: FecUploadRequest): Promise<FecImportResponse> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('companyId', data.companyId);
  formData.append('fiscalYearId', data.fiscalYearId);
  formData.append('userId', data.userId);

  return apiFetch<FecImportResponse>('/fec/import', {
    method: 'POST',
    body: formData,
    snackbar: {
      showSuccess: true,
      successMessage: 'Fichier FEC importé avec succès',
      showError: true,
    },
  });
}
