import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  manager_id?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
};

export function useWorkspaces() {
  const [list, setList] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Workspace[]>("/workspaces", {
        snackbar: { showSuccess: false, showError: true },
      });
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement des workspaces");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    list,
    loading,
    error,
    fetchList,
  };
}
