import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loansApi } from "@/lib/loansApi";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";
import type { Loan, LoanStatistics } from "@/types/loans";

export function useLoansList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.loans.list(),
    queryFn: () => loansApi.getAllLoans(),
    enabled,
    select: (data) => data.loans,
  });
}

export function useLoan(
  loanId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!loanId;

  return useQuery({
    queryKey: queryKeys.loans.detail(loanId ?? ""),
    queryFn: () => loansApi.getLoan(loanId!),
    enabled,
  });
}

export function useLoanStatistics(
  loanId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const authEnabled = useAuthEnabled();
  const enabled =
    (options?.enabled ?? true) && authEnabled && !!loanId;

  return useQuery({
    queryKey: queryKeys.loans.statistics(loanId ?? ""),
    queryFn: () => loansApi.getLoanStatistics(loanId!),
    enabled,
  });
}

export function useLoanDetailsBundle(
  loanId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const loanQuery = useLoan(loanId, options);
  const statsQuery = useLoanStatistics(loanId, options);

  return {
    selectedLoan: loanQuery.data ?? null,
    loanStats: statsQuery.data ?? null,
    isLoading: loanQuery.isLoading || statsQuery.isLoading,
    isFetching: loanQuery.isFetching || statsQuery.isFetching,
    error:
      loanQuery.error instanceof Error
        ? loanQuery.error.message
        : statsQuery.error instanceof Error
          ? statsQuery.error.message
          : null,
    refetch: async () => {
      await Promise.all([loanQuery.refetch(), statsQuery.refetch()]);
    },
  };
}

export function useInvalidateLoans() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
  };
}

export function useDeleteLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.deleteLoan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
    },
  });
}

export type { Loan, LoanStatistics };
