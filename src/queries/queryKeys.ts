/**
 * Hierarchical query keys — invalidate with a parent prefix (e.g. queryKeys.companies.all).
 */
export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    list: () => [...queryKeys.companies.all, "list"] as const,
    detail: (id: string) => [...queryKeys.companies.all, "detail", id] as const,
  },
  groups: {
    all: ["groups"] as const,
    list: () => [...queryKeys.groups.all, "list"] as const,
    detail: (id: string) => [...queryKeys.groups.all, "detail", id] as const,
  },
  businessUnits: {
    all: ["business-units"] as const,
    list: (companyId: string) =>
      [...queryKeys.businessUnits.all, "list", companyId] as const,
    detail: (companyId: string, buId: string) =>
      [...queryKeys.businessUnits.all, "detail", companyId, buId] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
    list: () => [...queryKeys.workspaces.all, "list"] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, "detail", id] as const,
  },
  structure: {
    all: ["structure"] as const,
    tree: () => [...queryKeys.structure.all, "tree"] as const,
    nodeUsers: (nodeType: string, nodeId: string) =>
      [...queryKeys.structure.all, "node-users", nodeType, nodeId] as const,
    ficheFinancials: (scope: string, id: string) =>
      [...queryKeys.structure.all, "fiche-financials", scope, id] as const,
  },
  shareholders: {
    all: ["shareholders"] as const,
    list: () => [...queryKeys.shareholders.all, "list"] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const,
  },
  loans: {
    all: ["loans"] as const,
    list: () => [...queryKeys.loans.all, "list"] as const,
    detail: (id: string) => [...queryKeys.loans.all, "detail", id] as const,
    statistics: (id: string) => [...queryKeys.loans.all, "statistics", id] as const,
  },
  entities: {
    all: ["entities"] as const,
    list: (params?: string) => [...queryKeys.entities.all, "list", params ?? ""] as const,
  },
  import: {
    all: ["import"] as const,
    jobs: () => [...queryKeys.import.all, "jobs"] as const,
    mappings: () => [...queryKeys.import.all, "mappings"] as const,
  },
  assets: {
    all: ["assets"] as const,
    byScope: (scope: string, id: string) =>
      [...queryKeys.assets.all, scope, id] as const,
  },
  dotations: {
    all: ["dotations"] as const,
    byScope: (scope: string, id: string) =>
      [...queryKeys.dotations.all, scope, id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    import: () => [...queryKeys.notifications.all, "import"] as const,
  },
} as const;
