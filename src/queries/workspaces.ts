import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/queries/queryKeys";
import { readSnackbar } from "@/queries/snackbarDefaults";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type { Workspace } from "@/types/workspace";

export function useWorkspacesList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: () =>
      apiFetch<Workspace[]>("/workspaces", { snackbar: readSnackbar }),
    enabled,
  });
}

export type { Workspace };
