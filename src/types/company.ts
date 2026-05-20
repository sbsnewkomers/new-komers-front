export type CompanySize = "SMALL" | "MEDIUM" | "LARGE";
export type CompanyModel = "HOLDING" | "SUBSIDIARY";

export type Company = {
  id: string;
  name: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  siret: string;
  address?: string;
  ape_code?: string;
  main_activity?: string;
  size?: CompanySize;
  model?: CompanyModel;
  group_id: string;
  workspace_id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCompanyDto = {
  groupId: string;
  name: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  siret: string;
  address?: string;
  ape_code?: string;
  main_activity?: string;
  size?: CompanySize;
  model?: CompanyModel;
};

export type UpdateCompanyDto = Partial<CreateCompanyDto>;
