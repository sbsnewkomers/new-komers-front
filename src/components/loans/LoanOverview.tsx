import React from 'react';
import { TrendingUp, Wallet, Percent, CheckCircle2 } from 'lucide-react';
import { Loan } from '@/types/loans';

interface LoanOverviewProps {
    loans: Loan[];
    overviewStats?: {
        totalLoans: number;
        activeLoans: number;
        completedLoans?: number;
        totalPrincipal: number;
        averageRate: number;
    };
    onLoanSelect: (loanId: string) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount);

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR');

const statusBadgeColor: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    SUSPENDED: 'bg-red-50 text-red-600 border-red-200',
};

const statusLabel: Record<string, string> = {
    ACTIVE: 'Actif',
    COMPLETED: 'Terminé',
    PENDING: 'En attente',
    SUSPENDED: 'Suspendu',
};

const methodBadgeColor: Record<string, string> = {
    CALCULATOR: 'bg-purple-50 text-purple-700 border-purple-200',
    IMPORT: 'bg-orange-50 text-orange-700 border-orange-200',
    MANUAL: 'bg-slate-50 text-slate-600 border-slate-200',
};

const methodLabel: Record<string, string> = {
    CALCULATOR: 'Calculatrice',
    IMPORT: 'Import',
    MANUAL: 'Manuel',
};

export function LoanOverview({ loans, overviewStats, onLoanSelect }: LoanOverviewProps) {
    const stats = {
        total: overviewStats?.totalLoans ?? 0,
        active: overviewStats?.activeLoans ?? 0,
        completed: overviewStats?.completedLoans ?? 0,
        principal: overviewStats?.totalPrincipal ?? 0,
        rate: overviewStats?.averageRate ?? 0,
    };

    const recentLoans = loans.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Stats */}
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

            {/* Recent loans */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-900">
                            Emprunts récents
                        </h3>
                        <span className="text-xs text-slate-400">
                            ({loans.length} emprunt{loans.length > 1 ? 's' : ''})
                        </span>
                    </div>
                </div>

                {recentLoans.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                            <TrendingUp className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">
                            Aucun emprunt trouvé
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Commencez par créer votre premier emprunt.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Emprunt
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Méthode
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Capital
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Taux
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Durée
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Début
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => onLoanSelect(loan.id)}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-primary">
                                                {loan.name}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {loan.entityType}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                                    statusBadgeColor[loan.status] ??
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {statusLabel[loan.status] ?? loan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                                    methodBadgeColor[loan.inputMethod] ??
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {methodLabel[loan.inputMethod] ?? loan.inputMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                                            {formatCurrency(loan.principalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-700">
                                            {loan.annualInterestRate}%
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-700">
                                            {loan.durationMonths} mois
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDate(loan.firstInstallmentDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
