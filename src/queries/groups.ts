import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/queries/queryKeys";
import { mutateSnackbar, readSnackbar } from "@/queries/snackbarDefaults";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type { CreateGroupDto, Group, UpdateGroupDto } from "@/types/group";

export function useGroupsList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => apiFetch<Group[]>("/groups", { snackbar: readSnackbar }),
    enabled,
  });
}

export function useGroup(
  id: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!id;

  return useQuery({
    queryKey: queryKeys.groups.detail(id ?? ""),
    queryFn: () =>
      apiFetch<Group>(`/groups/${id}`, { snackbar: readSnackbar }),
    enabled,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGroupDto) =>
      apiFetch<Group>("/groups", {
        method: "POST",
        body: JSON.stringify(dto),
        snackbar: { ...mutateSnackbar, successMessage: "Groupe créé" },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGroupDto }) =>
      apiFetch<Group>(`/groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto),
        snackbar: { ...mutateSnackbar, successMessage: "Groupe mis à jour" },
      }),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/groups/${id}`, {
        method: "DELETE",
        snackbar: { ...mutateSnackbar, successMessage: "Groupe supprimé" },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}
