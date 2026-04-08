import { useState, useEffect } from 'react';
import { loansApi } from '@/lib/loansApi';
import { Loan, LoanStatistics } from '@/types/loans';

export function useLoans() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLoans = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await loansApi.getAllLoans();
            setLoans(response.loans);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load loans');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLoans();
    }, []);

    return {
        loans,
        isLoading,
        error,
        loadLoans,
        setError
    };
}

export function useLoanDetails() {
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [loanStats, setLoanStats] = useState<LoanStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLoanDetails = async (loanId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const [loan, stats] = await Promise.all([
                loansApi.getLoan(loanId),
                loansApi.getLoanStatistics(loanId)
            ]);
            setSelectedLoan(loan);
            setLoanStats(stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load loan details');
        } finally {
            setIsLoading(false);
        }
    };

    const clearLoanDetails = () => {
        setSelectedLoan(null);
        setLoanStats(null);
    };

    return {
        selectedLoan,
        loanStats,
        isLoading,
        error,
        loadLoanDetails,
        clearLoanDetails,
        setError
    };
}