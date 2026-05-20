import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/queries/queryKeys";
import { mutateSnackbar, readSnackbar } from "@/queries/snackbarDefaults";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type { BusinessUnitApi } from "@/types/business-unit";

export type CreateBusinessUnitDto = {
  name: string;
  description?: string;
  code: string;
  activity: string;
  siret: string;
  country: string;
  street?: string;
  postal_code?: string;
  city?: string;
  phone_landline?: string;
  phone_mobile?: string;
  contact_email?: string;
};

export type UpdateBusinessUnitDto = Partial<CreateBusinessUnitDto>;

export function useBusinessUnitsList(
  companyId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!companyId;

  return useQuery({
    queryKey: queryKeys.businessUnits.list(companyId ?? ""),
    queryFn: () =>
      apiFetch<BusinessUnitApi[]>(
        `/companies/${companyId}/business-units`,
        { snackbar: readSnackbar },
      ),
    enabled,
  });
}

export function useBusinessUnit(
  companyId: string | null | undefined,
  buId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!companyId && !!buId;

  return useQuery({
    queryKey: queryKeys.businessUnits.detail(companyId ?? "", buId ?? ""),
    queryFn: () =>
      apiFetch<BusinessUnitApi>(
        `/companies/${companyId}/business-units/${buId}`,
        { snackbar: readSnackbar },
      ),
    enabled,
  });
}

export function useCreateBusinessUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBusinessUnitDto) => {
      if (!companyId) throw new Error("companyId required");
      return apiFetch<BusinessUnitApi>(
        `/companies/${companyId}/business-units`,
        {
          method: "POST",
          body: JSON.stringify(dto),
          snackbar: {
            ...mutateSnackbar,
            successMessage: "Business unit créée",
          },
        },
      );
    },
    onSuccess: () => {
      if (!companyId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.list(companyId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useUpdateBusinessUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      buId,
      dto,
    }: {
      buId: string;
      dto: UpdateBusinessUnitDto;
    }) => {
      if (!companyId) throw new Error("companyId required");
      return apiFetch<BusinessUnitApi>(
        `/companies/${companyId}/business-units/${buId}`,
        {
          method: "PUT",
          body: JSON.stringify(dto),
          snackbar: {
            ...mutateSnackbar,
            successMessage: "Business unit mise à jour",
          },
        },
      );
    },
    onSuccess: (_data, { buId }) => {
      if (!companyId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.list(companyId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.detail(companyId, buId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}

export function useDeleteBusinessUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (buId: string) => {
      if (!companyId) throw new Error("companyId required");
      return apiFetch(`/companies/${companyId}/business-units/${buId}`, {
        method: "DELETE",
        snackbar: {
          ...mutateSnackbar,
          successMessage: "Business unit supprimée",
        },
      });
    },
    onSuccess: () => {
      if (!companyId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.list(companyId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.structure.all });
    },
  });
}
