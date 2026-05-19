import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

export function useImportHistoryQuery<T>(
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.import.jobs(),
    queryFn,
    enabled,
  });
}

export function useInvalidateImport() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.import.all });
  };
}
