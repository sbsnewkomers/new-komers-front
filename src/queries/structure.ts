import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/lib/structureApi";
import { queryKeys } from "@/queries/queryKeys";
import { readSnackbar } from "@/queries/snackbarDefaults";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type { BusinessUnitApi } from "@/types/business-unit";

export function useStructureTree(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.structure.tree(),
    queryFn: () => fetchStructureTree(),
    enabled,
  });
}

export function useInvalidateStructure() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
  };
}

export async function fetchBusinessUnitsForCompany(
  companyId: string,
): Promise<BusinessUnitApi[]> {
  const { queryClient } = await import("@/lib/queryClient");
  return queryClient.fetchQuery({
    queryKey: queryKeys.businessUnits.list(companyId),
    queryFn: () =>
      apiFetch<BusinessUnitApi[]>(
        `/companies/${companyId}/business-units`,
        { snackbar: readSnackbar },
      ),
  });
}

export type { StructureTree };
