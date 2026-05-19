import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loansApi } from "@/lib/loansApi";
import { queryClient } from "@/lib/queryClient";
import { useLoansList, useLoanDetailsBundle } from "@/queries/loans";
import { queryKeys } from "@/queries/queryKeys";
import type { Loan } from "@/types/loans";

export function useLoans() {
  const listQuery = useLoansList();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    const result = await listQuery.refetch();
    return result.data ?? [];
  }, [listQuery]);

  const setLoans = useCallback(
    (updater: Loan[] | ((prev: Loan[]) => Loan[])) => {
      const current = listQuery.data ?? [];
      const next =
        typeof updater === "function" ? updater(current) : updater;
      qc.setQueryData(
        queryKeys.loans.list(),
        (old: { loans: Loan[]; total: number } | Loan[] | undefined) => {
          if (old && typeof old === "object" && "loans" in old) {
            return { ...old, loans: next, total: next.length };
          }
          return { loans: next, total: next.length };
        },
      );
    },
    [listQuery.data, qc],
  );

  return {
    loans: listQuery.data ?? [],
    isLoading: listQuery.isLoading || listQuery.isFetching,
    error:
      error ??
      (listQuery.error instanceof Error
        ? listQuery.error.message
        : listQuery.error
          ? "Failed to load loans"
          : null),
    loadLoans,
    setError,
    setLoans,
  };
}

export function useLoanDetails() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bundle = useLoanDetailsBundle(selectedId, { enabled: !!selectedId });
  const [error, setError] = useState<string | null>(null);

  const loadLoanDetails = useCallback(async (loanId: string) => {
    setSelectedId(loanId);
    await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.loans.detail(loanId),
        queryFn: () => loansApi.getLoan(loanId),
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.loans.statistics(loanId),
        queryFn: () => loansApi.getLoanStatistics(loanId),
      }),
    ]);
  }, []);

  const clearLoanDetails = useCallback(() => {
    setSelectedId(null);
  }, []);

  const setSelectedLoan = useCallback((loan: Loan | null) => {
    setSelectedId(loan?.id ?? null);
  }, []);

  return {
    selectedLoan: bundle.selectedLoan,
    loanStats: bundle.loanStats,
    isLoading: bundle.isLoading,
    error: error ?? bundle.error ?? null,
    loadLoanDetails,
    clearLoanDetails,
    setError,
    setSelectedLoan,
  };
}
