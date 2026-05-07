'use client';

import React from 'react';
import {
    Wallet,
    Percent,
    Shield,
    TrendingUp,
    Calculator,
} from 'lucide-react';
import { formatCurrency, LoanTotals } from './utils';

interface SummaryStatsProps {
    totals: LoanTotals;
}

export function SummaryStats({ totals }: SummaryStatsProps) {
    const stats = [
        {
            label: 'Capital total',
            value: formatCurrency(totals.totalPrincipal),
            border: 'border-white/10',
            icon: Wallet,
        },
        {
            label: 'Intérêts',
            value: formatCurrency(totals.totalInterest),
            border: 'border-amber-400/25',
            icon: Percent,
        },
        {
            label: 'Assurance',
            value: formatCurrency(totals.totalInsurance),
            border: 'border-sky-400/25',
            icon: Shield,
        },
        {
            label: 'Total dû',
            value: formatCurrency(totals.totalPayment),
            border: 'border-emerald-400/25',
            icon: TrendingUp,
        },
        {
            label: 'Moyenne / mois',
            value: formatCurrency(totals.averageMonthlyPayment),
            border: 'border-violet-400/25',
            icon: Calculator,
        },
    ] as const;

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {stats.map((s) => {
                const Icon = s.icon;
                return (
                    <div
                        key={s.label}
                        className={`rounded-xl border ${s.border} bg-white/5 p-4 backdrop-blur-sm`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-(--nebula-muted)">
                                    {s.label}
                                </p>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {s.value}
                                </p>
                            </div>
                            <Icon className="h-4 w-4 text-(--nebula-gold-light) opacity-70" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
