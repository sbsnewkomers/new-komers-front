import React from 'react';
import { TrendingUp, Wallet, Percent, CheckCircle2 } from 'lucide-react';

interface LoanStatsProps {
    overviewStats?: {
        totalLoans: number;
        activeLoans: number;
        completedLoans?: number;
        totalPrincipal: number;
        averageRate: number;
    };
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount);

export function LoanStats({ overviewStats }: LoanStatsProps) {
    const stats = {
        total: overviewStats?.totalLoans ?? 0,
        active: overviewStats?.activeLoans ?? 0,
        completed: overviewStats?.completedLoans ?? 0,
        principal: overviewStats?.totalPrincipal ?? 0,
        rate: overviewStats?.averageRate ?? 0,
    };

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
                [
                    {
                        label: 'Total',
                        value: stats.total,
                        color: 'text-slate-900',
                        bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
                        icon: TrendingUp,
                    },
                    {
                        label: 'Actifs',
                        value: stats.active,
                        color: 'text-emerald-700',
                        bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
                        icon: CheckCircle2,
                    },
                    {
                        label: 'Capital total',
                        value: formatCurrency(stats.principal),
                        color: 'text-blue-700',
                        bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
                        icon: Wallet,
                    },
                    {
                        label: 'Taux moyen',
                        value: `${stats.rate.toFixed(2)}%`,
                        color: 'text-amber-700',
                        bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
                        icon: Percent,
                    },
                ] as const
            ).map((s) => {
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
                                <p className={`mt-1 text-2xl font-bold ${s.color}`}>
                                    {s.value}
                                </p>
                            </div>
                            <Icon className={`h-5 w-5 ${s.color} opacity-60`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
