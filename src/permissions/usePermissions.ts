import { useMemo } from "react";
import { CRUD_ACTION, type PermissionAction, crudToPermissionActions, toNodeType } from "@/permissions/actions";
import { evaluateRequirement } from "@/permissions/evaluator";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import type { NodeType } from "@/permissions/actions";
import type { PermissionRequirement } from "@/permissions/types";

export function usePermissions() {
  const { user, grants, isLoading, setGrants, refreshMe } = usePermissionsContext();

  const role = user?.role ?? null;

  const api = useMemo(() => {
    /**
     * Check if the current user can perform the given action.
     * Supports both item-level grants (g.nodeId set) and entity-level grants (g.nodeId omitted = all items of that type).
     * - can("companies", "CREATE") → true if user has CREATE on any company or on the whole COMPANY entity.
     * - can("companies", "UPDATE", companyId) → true if user has UPDATE on that company or on the whole COMPANY entity.
     */
    function can(entityOrNodeType: string | NodeType, action: CRUD_ACTION | PermissionAction, nodeId?: string) {
      if (role && (role === "SUPER_ADMIN" || role === "ADMIN")) return true;

      const nodeType =
        typeof entityOrNodeType === "string"
          ? (toNodeType(entityOrNodeType) ?? (entityOrNodeType as NodeType))
          : entityOrNodeType;

      const actions =
        action === CRUD_ACTION.READ ||
        action === CRUD_ACTION.CREATE ||
        action === CRUD_ACTION.UPDATE ||
        action === CRUD_ACTION.DELETE
          ? crudToPermissionActions(action)
          : ([action] as PermissionAction[]);

      return grants.some((g) => {
        if (g.nodeType !== nodeType) return false;
        if (!actions.includes(g.action)) return false;
        if (!nodeId) return true;
        if (!g.nodeId) return true; // entity-level grant: allows action on any node of this type
        return g.nodeId === nodeId;
      });
    }

    function cannot(entityOrNodeType: string | NodeType, action: CRUD_ACTION | PermissionAction, nodeId?: string) {
      return !can(entityOrNodeType, action, nodeId);
    }

    function has(required: PermissionRequirement) {
      return evaluateRequirement({ requirement: required, grants, role });
    }

    return { can, cannot, has, setGrants, refreshMe, user, role, grants, isLoading };
  }, [grants, isLoading, refreshMe, role, setGrants, user]);

  return api;
}

