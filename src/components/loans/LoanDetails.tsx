import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Wallet,
    Percent,
    Clock,
    Calendar,
    Shield,
    TrendingUp,
    CheckCircle2,
    User,
    Building2,
    FileText,
    Check,
    X,
} from 'lucide-react';
import { Loan, LoanStatistics, InstallmentStatus } from '@/types/loans';
import { entitiesApi } from '@/lib/entitiesApi';
import { loansApi } from '@/lib/loansApi';
import { apiFetch } from '@/lib/apiClient';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';

interface LoanDetailsProps {
    loan: Loan;
    loanStats?: LoanStatistics | null;
    onBack: () => void;
    onEdit: (loanId: string) => void;
    onDelete: (loanId: string) => void;
    onLoanUpdate?: () => void;
}

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0\xa0\u20AC';
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatCurrencyPrecise = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0,00\xa0\u20AC';
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    return `${Math.round(value)}%`;
};

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

const methodLabel: Record<string, string> = {
    CALCULATOR: 'Calculatrice',
    IMPORT: 'Importation',
    MANUAL: 'Manuel',
};

const getInstallmentStatusDisplay = (status: InstallmentStatus) => {
    switch (status) {
        case InstallmentStatus.PAID:
            return {
                text: 'Payé',
                className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };
        case InstallmentStatus.PENDING:
            return {
                text: 'En attente',
                className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            };
        case InstallmentStatus.OVERDUE:
            return {
                text: 'En retard',
                className: 'bg-red-50 text-red-600 border-red-200',
            };
        case InstallmentStatus.UNPAID:
            return {
                text: 'Non payé',
                className: 'bg-slate-50 text-slate-600 border-slate-200',
            };
        default:
            return {
                text: 'Inconnu',
                className: 'bg-slate-50 text-slate-600 border-slate-200',
            };
    }
};

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: typeof Wallet;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
            {Icon && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                    <Icon className="h-4 w-4 text-slate-500" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900 wrap-break-word">{value}</p>
            </div>
        </div>
    );
}

export function LoanDetails({
    loan,
    loanStats,
    onBack,
    onEdit,
    onDelete,
    onLoanUpdate,
}: LoanDetailsProps) {
    const [entityName, setEntityName] = useState<string>('');
    const [creatorName, setCreatorName] = useState<string>('');
    const [loading, setLoading] = useState<string | null>(null);
    const { user } = usePermissionsContext();
    const canManage = user?.role !== 'END_USER';

    useEffect(() => {
        const fetchEntityName = async () => {
            try {
                const name = await entitiesApi.getEntityName(loan.entityType, loan.entityId);
                setEntityName(name);
            } catch (error) {
                console.error("Erreur lors de la récupération du nom de l'entité:", error);
                setEntityName(`${loan.entityType} #${loan.entityId.slice(0, 8)}...`);
            }
        };

        const fetchCreatorName = async () => {
            try {
                const name = await apiFetch<string>(`/loans/${loan.id}/creator-name`, {
                    authRedirect: false,
                });
                setCreatorName(name);
            } catch (error) {
                console.error("Erreur lors de la récupération du nom de l'utilisateur:", error);
                setCreatorName(loan.createdById);
            }
        };

        if (loan.entityType && loan.entityId) {
            fetchEntityName();
        }

        if (loan.createdById) {
            fetchCreatorName();
        }
    }, [loan.entityType, loan.entityId, loan.createdById, loan.id]);

    const handleMarkAsPaid = async (installmentId: string) => {
        setLoading(installmentId);
        try {
            await loansApi.markInstallmentAsPaid(loan.id, installmentId);
            if (onLoanUpdate) onLoanUpdate();
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Échéance marquée comme payée avec succès',
                variant: 'success',
            });
        } catch (error) {
            console.error('Erreur lors du marquage comme payé:', error);
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Erreur lors du marquage comme payé',
                variant: 'error',
            });
        } finally {
            setLoading(null);
        }
    };

    const handleUnmarkAsPaid = async (installmentId: string) => {
        setLoading(installmentId);
        try {
            await loansApi.unmarkInstallmentAsPaid(loan.id, installmentId);
            if (onLoanUpdate) onLoanUpdate();
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Paiement annulé avec succès',
                variant: 'success',
            });
        } catch (error) {
            console.error("Erreur lors de l'annulation du paiement:", error);
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: "Erreur lors de l'annulation du paiement",
                variant: 'error',
            });
        } finally {
            setLoading(null);
        }
    };

    const totalPaid =
        loan.installments?.filter((i) => i.isPaid).length ?? 0;
    const totalInstallments = loan.installments?.length ?? 0;
    const monthly =
        loan.installments && loan.installments.length > 0
            ? loan.installments[0].totalPayment
            : null;

    return (
        <div className="space-y-6">
            {/* Header with back + actions */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{loan.name}</h3>
                            <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                    statusBadgeColor[loan.status] ??
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                            >
                                {statusLabel[loan.status] ?? loan.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {entityName || 'Chargement…'} &middot;{' '}
                            {methodLabel[loan.inputMethod] ?? loan.inputMethod}
                        </p>
                    </div>
                </div>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onEdit(loan.id)}
                            className="h-9"
                        >
                            <Pencil className="h-4 w-4" />
                            Modifier
                        </Button>
                        <Button
                            onClick={() => onDelete(loan.id)}
                            className="h-9 bg-red-600 text-white hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                )}
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                    [
                        {
                            label: 'Capital',
                            value: formatCurrency(loan.principalAmount),
                            color: 'text-slate-900',
                            bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
                            icon: Wallet,
                        },
                        {
                            label: 'Taux annuel',
                            value: `${loan.annualInterestRate}%`,
                            color: 'text-amber-700',
                            bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
                            icon: Percent,
                        },
                        {
                            label: 'Durée',
                            value: `${loan.durationMonths} mois`,
                            color: 'text-blue-700',
                            bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
                            icon: Clock,
                        },
                        {
                            label: 'Mensualité',
                            value: monthly != null ? formatCurrency(monthly) : '—',
                            color: 'text-emerald-700',
                            bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
                            icon: TrendingUp,
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
                                    <p className={`mt-1 text-xl font-bold ${s.color}`}>
                                        {s.value}
                                    </p>
                                </div>
                                <Icon className={`h-5 w-5 ${s.color} opacity-60`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Loan information */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-900">
                            Informations de l&apos;emprunt
                        </h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoRow label="Nom" value={loan.name} icon={FileText} />
                    <InfoRow
                        label="Capital emprunté"
                        value={formatCurrencyPrecise(loan.principalAmount)}
                        icon={Wallet}
                    />
                    <InfoRow
                        label="Taux annuel"
                        value={`${loan.annualInterestRate}%`}
                        icon={Percent}
                    />
                    <InfoRow label="Durée" value={`${loan.durationMonths} mois`} icon={Clock} />
                    <InfoRow
                        label="1ère échéance"
                        value={formatDate(loan.firstInstallmentDate)}
                        icon={Calendar}
                    />
                    <InfoRow
                        label="Assurance / mois"
                        value={formatCurrencyPrecise(loan.monthlyInsuranceCost)}
                        icon={Shield}
                    />
                    <InfoRow
                        label="Période de différé"
                        value={`${loan.deferralPeriodMonths} mois`}
                        icon={Clock}
                    />
                    <InfoRow
                        label="Type d'entité"
                        value={<span className="capitalize">{loan.entityType}</span>}
                        icon={Building2}
                    />
                    <InfoRow
                        label="Entité"
                        value={entityName || 'Chargement…'}
                        icon={Building2}
                    />
                    <InfoRow
                        label="Méthode"
                        value={methodLabel[loan.inputMethod] ?? loan.inputMethod}
                        icon={FileText}
                    />
                    <InfoRow
                        label="Échéances"
                        value={`${totalPaid} / ${totalInstallments} payées`}
                        icon={CheckCircle2}
                    />
                    <InfoRow
                        label="Créé par"
                        value={creatorName || 'Chargement…'}
                        icon={User}
                    />
                    <InfoRow
                        label="Créé le"
                        value={loan.createdAt ? formatDate(loan.createdAt) : 'N/A'}
                        icon={Calendar}
                    />
                    <InfoRow
                        label="Mise à jour"
                        value={loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A'}
                        icon={Calendar}
                    />
                </div>
            </div>

            {/* Statistics */}
            {loanStats && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold text-slate-900">Statistiques</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoRow
                            label="Intérêts payés"
                            value={formatCurrencyPrecise(loanStats.totalInterestPaid)}
                            icon={Percent}
                        />
                        <InfoRow
                            label="Assurance payée"
                            value={formatCurrencyPrecise(loanStats.totalInsurancePaid)}
                            icon={Shield}
                        />
                        <InfoRow
                            label="Capital remboursé"
                            value={formatCurrencyPrecise(loanStats.totalPrincipalPaid)}
                            icon={Wallet}
                        />
                        <InfoRow
                            label="Solde restant"
                            value={formatCurrencyPrecise(loanStats.currentRemainingBalance)}
                            icon={Wallet}
                        />
                        <InfoRow
                            label="Échéances restantes"
                            value={loanStats.remainingInstallments}
                            icon={Clock}
                        />
                        <InfoRow
                            label="Fin prévue"
                            value={
                                loanStats.projectedEndDate
                                    ? formatDate(loanStats.projectedEndDate)
                                    : 'N/A'
                            }
                            icon={Calendar}
                        />
                        <InfoRow
                            label="Total payé"
                            value={formatCurrencyPrecise(
                                loanStats.totalInterestPaid +
                                    loanStats.totalInsurancePaid +
                                    loanStats.totalPrincipalPaid,
                            )}
                            icon={CheckCircle2}
                        />
                        <InfoRow
                            label="Progression"
                            value={
                                loan.principalAmount > 0
                                    ? formatPercentage(
                                          (loanStats.totalPrincipalPaid / loan.principalAmount) *
                                              100,
                                      )
                                    : '0%'
                            }
                            icon={TrendingUp}
                        />
                    </div>
                </div>
            )}

            {/* Installments */}
            {loan.installments && loan.installments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold text-slate-900">Échéancier</h3>
                            <span className="text-xs text-slate-400">
                                ({totalPaid}/{totalInstallments} payées)
                            </span>
                        </div>
                    </div>
                    <div className="max-h-[520px] overflow-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        N°
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Date
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Capital
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Intérêts
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Assurance
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Total
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Restant dû
                                    </th>
                                    <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                        Statut
                                    </th>
                                    {canManage && (
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loan.installments.map((inst) => {
                                    const st = getInstallmentStatusDisplay(inst.status);
                                    const isLoadingThis = loading === inst.id;
                                    return (
                                        <tr
                                            key={inst.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                {inst.installmentNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {formatDate(inst.dueDate)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                {formatCurrencyPrecise(inst.principalPayment)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                {formatCurrencyPrecise(inst.interestPayment)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                {formatCurrencyPrecise(inst.insurancePayment)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                                {formatCurrencyPrecise(inst.totalPayment)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                                                {formatCurrencyPrecise(inst.remainingBalance)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${st.className}`}
                                                >
                                                    {st.text}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end">
                                                        {!inst.isPaid ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleMarkAsPaid(inst.id)
                                                                }
                                                                disabled={isLoadingThis}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                                            >
                                                                {isLoadingThis ? (
                                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                                                                ) : (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                )}
                                                                Marquer payé
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleUnmarkAsPaid(inst.id)
                                                                }
                                                                disabled={isLoadingThis}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                                                            >
                                                                {isLoadingThis ? (
                                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                                                                ) : (
                                                                    <X className="h-3.5 w-3.5" />
                                                                )}
                                                                Annuler
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
