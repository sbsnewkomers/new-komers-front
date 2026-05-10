import type { SavedMapping } from "./types";
import type { PermissionsUser } from "@/permissions/types";

export const cleanMapping = (
  mapping: Record<string, string>,
): Record<string, string> => {
  const cleaned: Record<string, string> = {};
  Object.entries(mapping).forEach(([sourceColumn, targetField]) => {
    if (targetField && targetField !== "") {
      cleaned[sourceColumn] = targetField;
    }
  });
  return cleaned;
};

export const isGlobalMapping = (m: SavedMapping): boolean =>
  !m.workspaceId || m.scope === "GLOBAL";

export const canDeleteMapping = (
  m: SavedMapping,
  user?: PermissionsUser | null,
): boolean => {
  if (!user) return false;
  const role = user.role;
  const isGlobal = isGlobalMapping(m);
  if (isGlobal) {
    return role === "SUPER_ADMIN" || role === "ADMIN";
  }
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "HEAD_MANAGER" ||
    (role === "MANAGER" && m.createdBy === user.id)
  );
};

export const formatMappingDate = (value?: string): string => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Date invalide";
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Date invalide";
  }
};
