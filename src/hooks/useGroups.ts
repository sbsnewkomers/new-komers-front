import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import {
  useGroupsList,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from "@/queries/groups";
import { queryKeys } from "@/queries/queryKeys";
import { readSnackbar } from "@/queries/snackbarDefaults";
import type { CreateGroupDto, Group, UpdateGroupDto } from "@/types/group";

export type { Group, CreateGroupDto, UpdateGroupDto };

export function useGroups() {
  const [one, setOne] = useState<Group | null>(null);
  const listQuery = useGroupsList();
  const createMut = useCreateGroup();
  const updateMut = useUpdateGroup();
  const removeMut = useDeleteGroup();

  const loading =
    listQuery.isLoading ||
    listQuery.isFetching ||
    createMut.isPending ||
    updateMut.isPending ||
    removeMut.isPending;

  const error =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : listQuery.error
        ? "Erreur"
        : null;

  const fetchList = useCallback(async () => {
    const result = await listQuery.refetch();
    return result.data ?? [];
  }, [listQuery]);

  const fetchOne = useCallback(async (id: string) => {
    const data = await queryClient.fetchQuery({
      queryKey: queryKeys.groups.detail(id),
      queryFn: () =>
        apiFetch<Group>(`/groups/${id}`, { snackbar: readSnackbar }),
    });
    setOne(data);
    return data;
  }, []);

  return {
    list: listQuery.data ?? null,
    one,
    loading,
    error,
    fetchList,
    fetchOne,
    create: (dto: CreateGroupDto) => createMut.mutateAsync(dto),
    update: (id: string, dto: UpdateGroupDto) =>
      updateMut.mutateAsync({ id, dto }),
    remove: (id: string) => removeMut.mutateAsync(id),
  };
}
