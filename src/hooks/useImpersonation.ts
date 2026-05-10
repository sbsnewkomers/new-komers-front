import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import type { UserRole } from "@/lib/usersApi";

// Miroir exact de la logique backend
const IMPERSONATABLE_ROLES: Record<string, UserRole[]> = {
  SUPER_ADMIN: ["HEAD_MANAGER", "MANAGER", "END_USER"],
  ADMIN:       ["HEAD_MANAGER", "MANAGER", "END_USER"],
};

export function useImpersonation() {
  const { user, impersonate, exitImpersonation } = usePermissionsContext();

  // On est en mode impersonation si le JWT contient impersonatorId
  const isImpersonating = !!user?.impersonatorId;

  // L'utilisateur courant peut-il impersonifier ?
  const canImpersonate = !isImpersonating && (
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
  );

  // Quels rôles peut-il impersonifier ?
  const impersonatableRoles: UserRole[] =
    (user?.role ? IMPERSONATABLE_ROLES[user.role] : undefined) ?? [];

  // Peut-il impersonifier un user spécifique ?
  const canImpersonateUser = (targetRole: UserRole, targetStatus: string) => {
    return (
      canImpersonate &&
      impersonatableRoles.includes(targetRole) &&
      targetStatus === "ACTIVE"
    );
  };

  return {
    isImpersonating,
    canImpersonate,
    impersonatableRoles,
    canImpersonateUser,
    impersonate,
    exitImpersonation,
  };
}