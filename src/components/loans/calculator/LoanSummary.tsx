'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ArrowLeft, Save } from 'lucide-react';
import { CalculatorGenerationResponse } from '@/types/loans';
import { formatCurrency } from './utils';
import { AmortizationTable } from './AmortizationTable';

interface LoanSummaryProps {
    generation: CalculatorGenerationResponse;
    onReset: () => void;
    onBack: () => void;
    onSave: () => void;
    isLoading: boolean;
}

export function LoanSummary({
    generation,
    onReset,
    onBack,
    onSave,
    isLoading
}: LoanSummaryProps) {
    const summaryStats = [
        {
            label: 'Mensualité',
            value: formatCurrency(generation.summary?.monthlyPayment),
            border: 'border-white/10',
        },
        {
            label: 'Intérêts',
            value: formatCurrency(generation.summary?.totalInterest),
            border: 'border-amber-400/25',
        },
        {
            label: 'Assurance',
            value: formatCurrency(generation.summary?.totalInsurance),
            border: 'border-sky-400/25',
        },
        {
            label: 'Total dû',
            value: formatCurrency(generation.summary?.totalPayment),
            border: 'border-emerald-400/25',
        },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {summaryStats.map((s) => (
                    <div
                        key={s.label}
                        className={`rounded-xl border ${s.border} bg-white/5 p-4 backdrop-blur-sm`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-(--nebula-muted)">
                            {s.label}
                        </p>
                        <p className="mt-1 text-xl font-bold text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Amortization table */}
            <AmortizationTable amortizationTable={generation.amortizationTable || []} />

            {/* Actions */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={onReset}>
                        <RefreshCw className="h-4 w-4" />
                        Nouveau calcul
                    </Button>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                        Précédent
                    </Button>
                </div>
                <Button
                    onClick={onSave}
                    disabled={isLoading}
                >
                    {isLoading ? 'Sauvegarde…' : "Sauvegarder l'échéancier"}
                    <Save className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
