export enum CRUD_ACTION {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

// Mirrors backend enum: `new-komers/src/enums/permission-action.enum.ts`
export enum PermissionAction {
  READ_ONE = "READONE",
  READ_ALL = "READALL",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export type NodeType = "GROUP" | "COMPANY" | "BUSINESS_UNIT";

export function toNodeType(entity: string): NodeType | null {
  const e = entity.trim().toLowerCase();
  if (e === "group" || e === "groups") return "GROUP";
  if (e === "company" || e === "companies") return "COMPANY";
  if (
    e === "business_unit" ||
    e === "businessunit" ||
    e === "business-units" ||
    e === "business_units" ||
    e === "businessunits"
  ) {
    return "BUSINESS_UNIT";
  }
  return null;
}

export function crudToPermissionActions(action: CRUD_ACTION): PermissionAction[] {
  switch (action) {
    case CRUD_ACTION.CREATE:
      return [PermissionAction.CREATE];
    case CRUD_ACTION.UPDATE:
      return [PermissionAction.UPDATE];
    case CRUD_ACTION.DELETE:
      return [PermissionAction.DELETE];
    case CRUD_ACTION.READ:
      // Backend distinguishes READ_ALL vs READ_ONE; in UI checks we typically accept either.
      return [PermissionAction.READ_ALL, PermissionAction.READ_ONE];
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

