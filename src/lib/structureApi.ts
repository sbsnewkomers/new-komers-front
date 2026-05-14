import { apiFetch } from "@/lib/apiClient";

export type TreeBU = {
  id: string;
  name: string;
  code: string;
  country: string;
  completionPercentage?: number;
};

export type TreeCompany = {
  id: string;
  name: string;
  completionPercentage: number;
  siret?: string;
  businessUnits: TreeBU[];
};

export type TreeGroup = {
  id: string;
  name: string;
  completionPercentage?: number;
  companies: TreeCompany[];
};

export type Treeworkspace = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  contact_email?: string;
  phone_landline?: string;
  phone_mobile?: string;
  manager_id?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  completionPercentage?: number;
  groups: TreeGroup[];
  standaloneCompanies: TreeCompany[];
};

export type StructureTree = {
  workspaces?: Treeworkspace[];
  groups?: TreeGroup[];
  standaloneCompanies?: TreeCompany[];
};

export async function fetchStructureTree(): Promise<StructureTree> {
  return apiFetch<StructureTree>("/structure/tree", {
    snackbar: { showSuccess: false, showError: true },
  });
}
