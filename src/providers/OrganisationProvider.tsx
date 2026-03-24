import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { fetchStructureTree } from "@/lib/structureApi";

type Organisation = {
  id: string;
  name: string;
};

type OrganisationContextValue = {
  organisations: Organisation[];
  isLoading: boolean;
};

const OrganisationContext = createContext<OrganisationContextValue | null>(null);

export function OrganisationProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePermissionsContext();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pour les admins, pas besoin de charger les organisations spécifiques
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      setOrganisations([]);
      return;
    }

    // Pour les autres rôles, charger les organisations depuis l'API
    const loadOrganisations = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const tree = await fetchStructureTree();
        const orgs = tree?.organisations?.map((o) => ({ id: o.id, name: o.name })) || [];
        setOrganisations(orgs);
      } catch (error) {
        console.error("Erreur lors du chargement des organisations:", error);
        setOrganisations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganisations();
  }, [user]);

  const value = useMemo(
    () => ({
      organisations,
      isLoading,
    }),
    [organisations, isLoading]
  );

  return <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>;
}

export function useOrganisationContext() {
  const ctx = useContext(OrganisationContext);
  if (!ctx) {
    throw new Error("useOrganisationContext must be used within <OrganisationProvider />");
  }
  return ctx;
}
