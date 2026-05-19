import { useCallback } from "react";
import { useWorkspacesList } from "@/queries/workspaces";
import type { Workspace } from "@/types/workspace";

export type { Workspace };

export function useWorkspaces(options?: { enabled?: boolean }) {
  const listQuery = useWorkspacesList(options);

  const loading = listQuery.isLoading || listQuery.isFetching;

  const error =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : listQuery.error
        ? "Erreur lors du chargement des workspaces"
        : null;

  const fetchList = useCallback(async () => {
    const result = await listQuery.refetch();
    return result.data ?? [];
  }, [listQuery]);

  return {
    list: listQuery.data ?? [],
    loading,
    error,
    fetchList,
  };
}
