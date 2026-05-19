import { usePermissionsContext } from "@/permissions/PermissionsProvider";

/** True when authenticated queries may run. */
export function useAuthEnabled(): boolean {
  const { isAuthReady, accessToken } = usePermissionsContext();
  return isAuthReady && !!accessToken;
}
