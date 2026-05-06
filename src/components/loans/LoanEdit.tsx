import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import { Loan, LoanInputMethod } from '@/types/loans';
import { loansApi } from '@/lib/loansApi';
import { LoanEditManual } from './LoanEditManual';
import { LoanEditImport } from './LoanEditImport';
import { LoanEditCalculator } from './LoanEditCalculator';
import { LoanEditMethodSelector } from './LoanEditMethodSelector';

interface LoanEditProps {
    loanId: string;
    onBack: () => void;
    onLoanUpdated: (loan: Loan) => void;
}

export function LoanEdit({ loanId, onBack, onLoanUpdated }: LoanEditProps) {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMethodSelector, setShowMethodSelector] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState<LoanInputMethod | null>(null);


    // Load loan data to determine which component to use
    useEffect(() => {
        const loadLoan = async () => {
            try {
                const loanData = await loansApi.getLoan(loanId);
                setLoan(loanData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load loan';
                const { emitSnackbar } = await import('@/ui/snackbarBus');
                emitSnackbar({
                    message: errorMessage,
                    variant: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadLoan();
    }, [loanId]);

    // Handle method selection
    const handleSelectMethod = (method: LoanInputMethod) => {
        setSelectedMethod(method);
        setShowMethodSelector(false);
    };

    // Handle back to method selector
    const handleBackToMethodSelector = () => {
        setShowMethodSelector(true);
        setSelectedMethod(null);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement du prêt...</span>
            </div>
        );
    }

    // Show method selector
    if (showMethodSelector && loan) {
        return (
            <LoanEditMethodSelector
                loanName={loan.name}
                currentMethod={loan.inputMethod}
                onBack={onBack}
                onSelectMethod={handleSelectMethod}
            />
        );
    }

    // Show selected method component
    if (selectedMethod && loan) {
        switch (selectedMethod) {
            case LoanInputMethod.MANUAL:
                return (
                    <LoanEditManual
                        loanId={loanId}
                        onBack={showMethodSelector ? handleBackToMethodSelector : onBack}
                        onLoanUpdated={onLoanUpdated}
                    />
                );
            case LoanInputMethod.IMPORT:
                return (
                    <LoanEditImport
                        loanId={loanId}
                        onBack={showMethodSelector ? handleBackToMethodSelector : onBack}
                        onLoanUpdated={onLoanUpdated}
                    />
                );
            case LoanInputMethod.CALCULATOR:
                return (
                    <LoanEditCalculator
                        loanId={loanId}
                        originalMethod={loan.inputMethod}
                        onBack={showMethodSelector ? handleBackToMethodSelector : onBack}
                        onLoanUpdated={onLoanUpdated}
                    />
                );
            default:
                return null;
        }
    }


    // Handle loan not found
    if (!loan) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Emprunt non trouvé</p>
                    <p className="mt-1 text-xs text-slate-500">
                        L&apos;emprunt demandé n&apos;existe pas ou a été supprimé.
                    </p>
                    <Button onClick={onBack} variant="outline" className="mt-4">
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
