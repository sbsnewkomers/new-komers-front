import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import {
  useCompaniesList,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/queries/companies";
import { queryKeys } from "@/queries/queryKeys";
import { readSnackbar } from "@/queries/snackbarDefaults";
import type {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
} from "@/types/company";

export type { Company, CreateCompanyDto, UpdateCompanyDto };

export function useCompanies() {
  const [one, setOne] = useState<Company | null>(null);
  const listQuery = useCompaniesList();
  const createMut = useCreateCompany();
  const updateMut = useUpdateCompany();
  const removeMut = useDeleteCompany();

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

  const fetchListByGroup = useCallback(
    async (groupId: string) => {
      const result = await listQuery.refetch();
      const data = result.data ?? [];
      return data.filter((c) => c.group_id === groupId);
    },
    [listQuery],
  );

  const fetchOne = useCallback(async (id: string) => {
    const data = await queryClient.fetchQuery({
      queryKey: queryKeys.companies.detail(id),
      queryFn: () =>
        apiFetch<Company>(`/companies/${id}`, { snackbar: readSnackbar }),
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
    fetchListByGroup,
    fetchOne,
    create: (dto: CreateCompanyDto) => createMut.mutateAsync(dto),
    update: (id: string, dto: UpdateCompanyDto) =>
      updateMut.mutateAsync({ id, dto }),
    remove: (id: string) => removeMut.mutateAsync(id),
  };
}
