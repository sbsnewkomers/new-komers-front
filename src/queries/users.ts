import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/usersApi";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

export function useUsersList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => fetchUsers(),
    enabled,
  });
}
