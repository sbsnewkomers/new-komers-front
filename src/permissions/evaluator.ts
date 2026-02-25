import {
  CRUD_ACTION,
  PermissionAction,
  crudToPermissionActions,
  toNodeType,
  type NodeType,
} from "@/permissions/actions";
import type { PermissionGrant, PermissionRequirement } from "@/permissions/types";

function isPermissionAction(v: unknown): v is PermissionAction {
  return (
    typeof v === "string" &&
    (v === PermissionAction.CREATE ||
      v === PermissionAction.UPDATE ||
      v === PermissionAction.DELETE ||
      v === PermissionAction.READ_ALL ||
      v === PermissionAction.READ_ONE)
  );
}

function isCrudAction(v: unknown): v is CRUD_ACTION {
  return (
    typeof v === "string" &&
    (v === CRUD_ACTION.CREATE ||
      v === CRUD_ACTION.READ ||
      v === CRUD_ACTION.UPDATE ||
      v === CRUD_ACTION.DELETE)
  );
}

function normalizeAction(action: CRUD_ACTION | PermissionAction): PermissionAction[] {
  if (isPermissionAction(action)) return [action];
  if (isCrudAction(action)) return crudToPermissionActions(action);
  return [];
}

function hasGrant(
  grants: PermissionGrant[],
  nodeType: NodeType,
  actions: PermissionAction[],
  nodeId?: string,
): boolean {
  for (const g of grants) {
    if (g.nodeType !== nodeType) continue;
    if (!actions.includes(g.action)) continue;
    if (!nodeId) return true;
    if (!g.nodeId) return true; // entity-level grant: allows action on any node of this type
    if (g.nodeId === nodeId) return true;
  }
  return false;
}

export function evaluateRequirement(args: {
  requirement: PermissionRequirement;
  grants: PermissionGrant[];
  role?: string | null;
  // simple bypass in UI to match typical backends; adjust if you want stricter behavior
  superRoles?: string[];
}): boolean {
  const { requirement, grants, role, superRoles = ["SUPER_ADMIN", "ADMIN"] } = args;

  if (role && superRoles.includes(role)) return true;

  if ("and" in requirement) {
    return requirement.and.every((r) => evaluateRequirement({ ...args, requirement: r }));
  }

  if ("or" in requirement) {
    return requirement.or.some((r) => evaluateRequirement({ ...args, requirement: r }));
  }

  if ("not" in requirement) {
    return !evaluateRequirement({ ...args, requirement: requirement.not });
  }

  // atom
  const nodeType: NodeType | null =
    "nodeType" in requirement ? requirement.nodeType : toNodeType(requirement.entity);
  if (!nodeType) return false;

  const actions = normalizeAction(requirement.action);
  if (actions.length === 0) return false;

  return hasGrant(grants, nodeType, actions, requirement.nodeId);
}

