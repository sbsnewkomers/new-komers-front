import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import {
  useBusinessUnitsList,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeleteBusinessUnit,
  type CreateBusinessUnitDto,
  type UpdateBusinessUnitDto,
} from "@/queries/businessUnits";
import { queryKeys } from "@/queries/queryKeys";
import { readSnackbar } from "@/queries/snackbarDefaults";
import type { BusinessUnitApi } from "@/types/business-unit";

export type { CreateBusinessUnitDto, UpdateBusinessUnitDto };

export function useBusinessUnits(
  companyId: string | null,
  options?: { enabled?: boolean },
) {
  const [one, setOne] = useState<BusinessUnitApi | null>(null);
  const listQuery = useBusinessUnitsList(companyId, options);
  const createMut = useCreateBusinessUnit(companyId);
  const updateMut = useUpdateBusinessUnit(companyId);
  const removeMut = useDeleteBusinessUnit(companyId);

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
    if (!companyId) return [];
    const result = await listQuery.refetch();
    return result.data ?? [];
  }, [companyId, listQuery]);

  const fetchOne = useCallback(
    async (buId: string) => {
      if (!companyId) throw new Error("companyId required");
      const data = await queryClient.fetchQuery({
        queryKey: queryKeys.businessUnits.detail(companyId, buId),
        queryFn: () =>
          apiFetch<BusinessUnitApi>(
            `/companies/${companyId}/business-units/${buId}`,
            { snackbar: readSnackbar },
          ),
      });
      setOne(data);
      return data;
    },
    [companyId],
  );

  return {
    list: listQuery.data ?? null,
    one,
    loading,
    error,
    fetchList,
    fetchOne,
    create: (dto: CreateBusinessUnitDto) => createMut.mutateAsync(dto),
    update: (buId: string, dto: UpdateBusinessUnitDto) =>
      updateMut.mutateAsync({ buId, dto }),
    remove: (buId: string) => removeMut.mutateAsync(buId),
  };
}
