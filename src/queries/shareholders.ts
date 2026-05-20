import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchShareholders,
  createShareholder,
  updateShareholder,
  deleteShareholder,
  type ShareholderDto,
} from "@/lib/shareholdersApi";
import type { ShareholderFormValues } from "@/components/shareholders/ShareholderFormDialog";
import {
  toCreateShareholderInput,
  toUpdateShareholderInput,
} from "@/lib/shareholdersApi";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

export function useShareholdersList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.shareholders.list(),
    queryFn: () => fetchShareholders(),
    enabled,
  });
}

export function useShareholderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.shareholders.all });
  };

  const createMut = useMutation({
    mutationFn: (values: ShareholderFormValues) => {
      const { id: _id, ...rest } = values;
      return createShareholder(toCreateShareholderInput(rest));
    },
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: (values: ShareholderFormValues) => {
      if (!values.id) throw new Error("Shareholder id required");
      return updateShareholder(values.id, toUpdateShareholderInput(values));
    },
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteShareholder(id),
    onSuccess: invalidate,
  });

  return { createMut, updateMut, deleteMut };
}

export type { ShareholderDto };
