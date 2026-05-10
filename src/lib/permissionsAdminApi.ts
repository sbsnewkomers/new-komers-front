import { apiFetch } from "@/lib/apiClient";

export type PermissionAction =
  | "READONE"
  | "READALL"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export type NodeType = "GROUP" | "COMPANY" | "BUSINESS_UNIT" | "WORKSPACE";

export type UserListItem = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type NodeAccessDetail = {
  id: string;
  nodeType: NodeType;
  nodeId: string;
  actions: PermissionAction[];
};

export type EntityPermissionDetail = {
  nodeType: NodeType;
  action: PermissionAction;
};

export type UserPermissionDetail = {
  nodeAccesses: NodeAccessDetail[];
  entityPermissions: EntityPermissionDetail[];
};

const snackbar = { showSuccess: true, showError: true };

export async function fetchAdminUsers(): Promise<UserListItem[]> {
  return apiFetch<UserListItem[]>("/permissions/admin/users", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function fetchUserPermissionDetail(
  userId: string
): Promise<UserPermissionDetail> {
  return apiFetch<UserPermissionDetail>(`/permissions/admin/users/${userId}`, {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function addOrUpdateNodeAccess(
  userId: string,
  nodeType: NodeType,
  nodeId: string,
  actions: PermissionAction[]
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `/permissions/admin/users/${userId}/node-access`,
    {
      method: "POST",
      body: JSON.stringify({ nodeType, nodeId, actions }),
      snackbar: { successMessage: "Accès nœud enregistré." },
    }
  );
}

export async function setNodeAccessActions(
  userId: string,
  accessId: string,
  actions: PermissionAction[]
): Promise<void> {
  await apiFetch(
    `/permissions/admin/users/${userId}/node-access/${accessId}/actions`,
    {
      method: "PUT",
      body: JSON.stringify({ actions }),
      snackbar: { successMessage: "Actions mises à jour." },
    }
  );
}

export async function removeNodeAccess(
  userId: string,
  accessId: string
): Promise<void> {
  await apiFetch(
    `/permissions/admin/users/${userId}/node-access/${accessId}`,
    {
      method: "DELETE",
      snackbar: { 
        successMessage: "Accès nœud supprimé.",
        errorMessage: "Impossible de supprimer l'accès. L'utilisateur doit avoir au moins un accès à un nœud."
      },
    }
  );
}

export async function grantEntityPermission(
  userId: string,
  nodeType: NodeType,
  action: PermissionAction
): Promise<void> {
  await apiFetch(
    `/permissions/admin/users/${userId}/entity-permission`,
    {
      method: "POST",
      body: JSON.stringify({ nodeType, action }),
      snackbar: { successMessage: "Permission entité accordée." },
    }
  );
}

export async function revokeEntityPermission(
  userId: string,
  nodeType: NodeType,
  action: PermissionAction
): Promise<void> {
  await apiFetch(
    `/permissions/admin/users/${userId}/entity-permission`,
    {
      method: "DELETE",
      body: JSON.stringify({ nodeType, action }),
      snackbar: { successMessage: "Permission entité retirée." },
    }
  );
}

export const ALL_ACTIONS: PermissionAction[] = [
  "READALL",
  "READONE",
  "CREATE",
  "UPDATE",
  "DELETE",
];

export const NODE_TYPES: NodeType[] = ["GROUP", "COMPANY", "BUSINESS_UNIT", "WORKSPACE"];

export function actionLabel(a: PermissionAction): string {
  const labels: Record<PermissionAction, string> = {
    READALL: "Lire liste",
    READONE: "Lire détail",
    CREATE: "Créer",
    UPDATE: "Modifier",
    DELETE: "Supprimer",
  };
  return labels[a] ?? a;
}

export function nodeTypeLabel(n: NodeType): string {
  const labels: Record<NodeType, string> = {
    GROUP: "Groupe",
    COMPANY: "Entreprise",
    BUSINESS_UNIT: "Unité d'affaires",
    WORKSPACE: "Workspace",
  };
  return labels[n] ?? n;
}
