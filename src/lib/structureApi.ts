import { apiFetch } from "@/lib/apiClient";

export type TreeBU = {
  id: string;
  name: string;
  code: string;
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
  companies: TreeCompany[];
};

export type Treeworkspace = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  manager_id?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
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
