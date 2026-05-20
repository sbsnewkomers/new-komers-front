export type Group = {
  id: string;
  name: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  siret: string;
  mainActivity?: string;
  workspace_id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateGroupDto = {
  name: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  siret: string;
  mainActivity?: string;
};

export type UpdateGroupDto = Partial<CreateGroupDto>;
