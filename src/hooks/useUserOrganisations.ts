import { useMemo } from "react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export function useUserOrganisations() {
  const { user } = usePermissionsContext();

  const organisations = useMemo(() => {
    // Pour les admins, on ne retourne pas d'organisations spécifiques
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      return [];
    }

    // Pour les autres rôles, on pourrait récupérer les organisations depuis l'API
    // Pour l'instant, on retourne un tableau vide qui sera rempli par les données de l'arborescence
    return [];
  }, [user?.role]);

  return organisations;
}
