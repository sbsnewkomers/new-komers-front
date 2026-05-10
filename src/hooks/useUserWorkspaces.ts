import { useMemo } from "react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export function useUserworkspaces() {
  const { user } = usePermissionsContext();

  const workspaces = useMemo(() => {
    // Pour les admins, on ne retourne pas d'workspaces spécifiques
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      return [];
    }

    // Pour les autres rôles, on pourrait récupérer les workspaces depuis l'API
    // Pour l'instant, on retourne un tableau vide qui sera rempli par les données de l'arborescence
    return [];
  }, [user?.role]);

  return workspaces;
}
