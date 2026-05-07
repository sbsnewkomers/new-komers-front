import React from 'react';
import { TrendingUp, Wallet, Percent, CheckCircle2 } from 'lucide-react';
import { formatCurrencyEUR, formatPercent } from '@/lib/format';

interface LoanStatsProps {
    overviewStats?: {
        totalLoans: number;
        activeLoans: number;
        completedLoans?: number;
        totalPrincipal: number;
        averageRate: number;
    };
}

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
                        icon: TrendingUp,
                    },
                    {
                        label: 'Actifs',
                        value: stats.active,
                        color: 'emerald-700',
                        icon: CheckCircle2,
                    },
                    {
                        label: 'Capital total',
                        value: formatCurrencyEUR(stats.principal, { maximumFractionDigits: 0, fallback: "0 €" }),
                        color: 'blue-700',
                        icon: Wallet,
                    },
                    {
                        label: 'Taux moyen',
                        value: formatPercent(stats.rate, { decimals: 2 }),
                        color: 'amber-700',
                        icon: Percent,
                    },
                ] as const
            ).map((s: { label: string; value: number | string; color?: string; icon: React.ElementType }) => {
                const Icon = s.icon;
                return (
                    <div
                      key={s.label}
                      className={`nebula-glass nebula-blob rounded-3xl p-6 relative overflow-hidden`}
                    >
											<div className="flex items-start justify-between">
												<p className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
													§ {s.label}
												</p>
												<Icon
													className={[
														"h-5 w-5 opacity-60",
														s.color ? `text-${s.color}` : "text-white/50",
													].join(" ")}
												/>
											</div>
											<p className="mt-3 text-3xl font-bold font-mono nebula-grad-text tabular-nums">
												{s.value}
											</p>
											{s.color ? (
												<div
													aria-hidden
													className={`pointer-events-none absolute -bottom-10 -right-40 w-full h-full rounded-full bg-${s.color} blur-3xl`}
												/>
											) : null}
                    </div>
                );
            })}
        </div>
    );
}
