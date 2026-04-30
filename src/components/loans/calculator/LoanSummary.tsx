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
            color: 'text-slate-900',
            bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
        },
        {
            label: 'Intérêts',
            value: formatCurrency(generation.summary?.totalInterest),
            color: 'text-amber-700',
            bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
        },
        {
            label: 'Assurance',
            value: formatCurrency(generation.summary?.totalInsurance),
            color: 'text-blue-700',
            bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
        },
        {
            label: 'Total dû',
            value: formatCurrency(generation.summary?.totalPayment),
            color: 'text-emerald-700',
            bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
        },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {summaryStats.map((s) => (
                    <div
                        key={s.label}
                        className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}
                    >
                        <p
                            className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                        >
                            {s.label}
                        </p>
                        <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Amortization table */}
            <AmortizationTable amortizationTable={generation.amortizationTable || []} />

            {/* Actions */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                    className="bg-primary text-white hover:bg-slate-800"
                >
                    {isLoading ? 'Sauvegarde…' : "Sauvegarder l'échéancier"}
                    <Save className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
