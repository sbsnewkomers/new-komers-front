import type { CRUD_ACTION, NodeType, PermissionAction } from "@/permissions/actions";

export type PermissionGrant = {
  nodeType: NodeType;
  action: PermissionAction;
  nodeId?: string; // if omitted, treated as "any node of this type"
};

// Accept both "entity" (doc wording) and "nodeType" (backend wording)
export type PermissionAtom =
  | { entity: string; action: CRUD_ACTION | PermissionAction; nodeId?: string }
  | { nodeType: NodeType; action: CRUD_ACTION | PermissionAction; nodeId?: string };

export type PermissionRequirement =
  | PermissionAtom
  | { and: PermissionRequirement[] }
  | { or: PermissionRequirement[] }
  | { not: PermissionRequirement };

export type PermissionsUser = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "END_USER" | string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string;
  permissions?: PermissionGrant[];
};

