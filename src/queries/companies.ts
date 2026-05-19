import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/queries/queryKeys";
import { mutateSnackbar, readSnackbar } from "@/queries/snackbarDefaults";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
} from "@/types/company";

export function useCompaniesList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: () =>
      apiFetch<Company[]>("/companies", { snackbar: readSnackbar }),
    enabled,
  });
}

export function useCompany(
  id: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!id;

  return useQuery({
    queryKey: queryKeys.companies.detail(id ?? ""),
    queryFn: () =>
      apiFetch<Company>(`/companies/${id}`, { snackbar: readSnackbar }),
    enabled,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCompanyDto) =>
      apiFetch<Company>("/companies", {
        method: "POST",
        body: JSON.stringify(dto),
        snackbar: { ...mutateSnackbar, successMessage: "Entreprise créée" },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCompanyDto }) =>
      apiFetch<Company>(`/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto),
        snackbar: {
          ...mutateSnackbar,
          successMessage: "Entreprise mise à jour",
        },
      }),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/companies/${id}`, {
        method: "DELETE",
        snackbar: { ...mutateSnackbar, successMessage: "Entreprise supprimée" },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}
