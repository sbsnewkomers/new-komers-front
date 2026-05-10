import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { fetchStructureTree } from "@/lib/structureApi";

type Workspace = {
  id: string;
  name: string;
};

type workspaceContextValue = {
  workspaces: Workspace[];
  isLoading: boolean;
};

const workspaceContext = createContext<workspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePermissionsContext();
  const [workspaces, setworkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pour les admins, pas besoin de charger les workspaces spécifiques
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      setworkspaces([]);
      return;
    }

    // Pour les autres rôles, charger les workspaces depuis l'API
    const loadworkspaces = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const tree = await fetchStructureTree();
        const orgs = tree?.workspaces?.map((o) => ({ id: o.id, name: o.name })) || [];
        setworkspaces(orgs);
      } catch (error) {
        console.error("Erreur lors du chargement des workspaces:", error);
        setworkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadworkspaces();
  }, [user]);

  const value = useMemo(
    () => ({
      workspaces,
      isLoading,
    }),
    [workspaces, isLoading]
  );

  return <workspaceContext.Provider value={value}>{children}</workspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(workspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceContext must be used within <WorkspaceProvider />");
  }
  return ctx;
}
