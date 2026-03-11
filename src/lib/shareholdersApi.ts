import { apiFetch } from "@/lib/apiClient";

export type ShareholderOwnerType = "USER" | "COMPANY";

export type ShareholderCompanyLite = {
  id: string;
  name?: string;
};

export type ShareholderDto = {
  id: string;
  ownerType: ShareholderOwnerType;
  ownerId: string;
  percentage: number;
  companies?: ShareholderCompanyLite[];
};

export type CreateShareholderInput = {
  ownerType: ShareholderOwnerType;
  ownerId: string;
  percentage: number;
  companyIds?: string[];
};

export type UpdateShareholderInput = Partial<CreateShareholderInput>;

const defaultSnackbar = { showSuccess: true, showError: true };

export async function fetchShareholders(): Promise<ShareholderDto[]> {
  return apiFetch<ShareholderDto[]>("/shareholders", {
    snackbar: { ...defaultSnackbar, showSuccess: false },
  });
}

export async function fetchShareholdersByCompany(companyId: string): Promise<ShareholderDto[]> {
  return apiFetch<ShareholderDto[]>(`/shareholders/company/${companyId}`, {
    snackbar: { ...defaultSnackbar, showSuccess: false },
  });
}

export async function createShareholder(input: CreateShareholderInput): Promise<ShareholderDto> {
  return apiFetch<ShareholderDto>("/shareholders", {
    method: "POST",
    body: JSON.stringify(input),
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire créé." },
  });
}

export async function updateShareholder(
  id: string,
  input: UpdateShareholderInput,
): Promise<ShareholderDto> {
  return apiFetch<ShareholderDto>(`/shareholders/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire mis à jour." },
  });
}

export async function deleteShareholder(id: string): Promise<void> {
  await apiFetch(`/shareholders/${id}`, {
    method: "DELETE",
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire supprimé." },
  });
}

export function ownerTypeLabel(t: ShareholderOwnerType): string {
  if (t === "USER") return "Personne (utilisateur)";
  if (t === "COMPANY") return "Entreprise";
  return t;
}

