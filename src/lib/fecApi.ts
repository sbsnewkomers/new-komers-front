import { apiFetch } from "./apiClient";

export interface FecUploadRequest {
  entityId: string; // Changé de companyId à entityId
  fiscalYearId: string;
  userId: string;
  file: File;
  entityType: 'Company' | 'Group' | 'BusinessUnit';
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
  formData.append('entityId', data.entityId); // Changé de companyId à entityId
  formData.append('fiscalYearId', data.fiscalYearId);
  formData.append('userId', data.userId);
  formData.append('entityType', data.entityType);

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
