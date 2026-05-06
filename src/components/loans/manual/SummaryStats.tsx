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
            color: 'text-slate-900',
            bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
            icon: Wallet,
        },
        {
            label: 'Intérêts',
            value: formatCurrency(totals.totalInterest),
            color: 'text-amber-700',
            bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
            icon: Percent,
        },
        {
            label: 'Assurance',
            value: formatCurrency(totals.totalInsurance),
            color: 'text-blue-700',
            bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
            icon: Shield,
        },
        {
            label: 'Total dû',
            value: formatCurrency(totals.totalPayment),
            color: 'text-emerald-700',
            bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
            icon: TrendingUp,
        },
        {
            label: 'Moyenne / mois',
            value: formatCurrency(totals.averageMonthlyPayment),
            color: 'text-purple-700',
            bg: 'bg-linear-to-l from-purple-200 to-white ring-1 ring-purple-100',
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
                        className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p
                                    className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                                >
                                    {s.label}
                                </p>
                                <p className={`mt-1 text-lg font-bold ${s.color}`}>
                                    {s.value}
                                </p>
                            </div>
                            <Icon className={`h-4 w-4 ${s.color} opacity-60`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
