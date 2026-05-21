import type { CRUD_ACTION, NodeType, PermissionAction } from "@/permissions/actions";

/**
 * A single permission grant (from GET /auth/me permissions).
 * - With nodeId: permission on that specific node (item-level).
 * - Without nodeId (omitted): permission on the whole entity (all groups, all companies, or all business units).
 *   This is the "entity-level" permission from UserEntityPermission on the backend.
 */
export type PermissionGrant = {
  nodeType: NodeType;
  action: PermissionAction;
  nodeId?: string;
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
  impersonatorId?: string;
};

export enum Entity {
  USERS = "USERS",
  GROUPS = "GROUPS",
  COMPANIES = "COMPANIES",
  BUSINESS_UNITS = "BUSINESS_UNITS",
  WORKSPACES = "WORKSPACES",
  LOANS = "LOANS",
  SHAREHOLDERS = "SHAREHOLDERS",
  INVITATIONS = "INVITATIONS",
  PERMISSIONS = "PERMISSIONS",
  STRUCTURE = "STRUCTURE",
  SETTINGS = "SETTINGS",
  REPORTS = "REPORTS",
  NOTIFICATIONS = "NOTIFICATIONS",
}
