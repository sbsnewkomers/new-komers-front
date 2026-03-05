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
  businessUnits: TreeBU[];
};

export type TreeGroup = {
  id: string;
  name: string;
  companies: TreeCompany[];
};

export type StructureTree = {
  groups?: TreeGroup[];
  standaloneCompanies?: TreeCompany[];
};

export async function fetchStructureTree(): Promise<StructureTree> {
  return apiFetch<StructureTree>("/structure/tree", {
    snackbar: { showSuccess: false, showError: true },
  });
}
