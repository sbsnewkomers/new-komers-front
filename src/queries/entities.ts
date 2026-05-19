import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

/** Placeholder for import entity selectors — extend when wiring EntitySelector. */
export function useEntitiesList(
  cacheKey: string,
  queryFn: () => Promise<unknown[]>,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.entities.list(cacheKey),
    queryFn,
    enabled,
  });
}
