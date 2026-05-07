import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
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
import * as XLSX from 'xlsx';
import { Loan, LoanStatistics, InstallmentStatus } from '@/types/loans';
import { entitiesApi } from '@/lib/entitiesApi';
import { loansApi } from '@/lib/loansApi';
import { apiFetch } from '@/lib/apiClient';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';
import { formatCurrencyEUR, formatDateFR, formatPercent } from '@/lib/format';

interface LoanDetailsProps {
    loan: Loan;
    loanStats?: LoanStatistics | null;
    onBack: () => void;
    onEdit: (loanId: string) => void;
    onDelete: (loanId: string) => void;
    onLoanUpdate?: () => void;
}

const formatCurrency = (amount: number | null | undefined) =>
  formatCurrencyEUR(amount, { maximumFractionDigits: 0, fallback: "0 €" });

const formatCurrencyPrecise = (amount: number | null | undefined) =>
  formatCurrencyEUR(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2, fallback: "0,00 €" });

const formatPercentage = (value: number | null | undefined) =>
  value == null ? "0%" : formatPercent(Math.round(value), { decimals: 0, fallback: "0%" });

const formatDate = (dateString: string) => formatDateFR(dateString, { fallback: "-" });

const statusVariant: Record<string, BadgeVariant> = {
    ACTIVE: 'success',
    COMPLETED: 'info',
    PENDING: 'warning',
    SUSPENDED: 'danger',
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

const getInstallmentStatusDisplay = (status: InstallmentStatus): { text: string; variant: BadgeVariant } => {
    switch (status) {
        case InstallmentStatus.PAID:
            return {
                text: 'Payé',
                variant: 'success',
            };
        case InstallmentStatus.PENDING:
            return {
                text: 'En attente',
                variant: 'warning',
            };
        case InstallmentStatus.OVERDUE:
            return {
                text: 'En retard',
                variant: 'danger',
            };
        case InstallmentStatus.UNPAID:
            return {
                text: 'Non payé',
                variant: 'neutral',
            };
        default:
            return {
                text: 'Inconnu',
                variant: 'neutral',
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
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            {Icon && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-white/60" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                    {label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-white wrap-break-word">{value}</p>
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
    const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
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

    const handleToggleSelection = (installmentId: string) => {
        setSelectedInstallments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(installmentId)) {
                newSet.delete(installmentId);
            } else {
                newSet.add(installmentId);
            }
            return newSet;
        });
    };

    const handleMarkSelectedAsPaid = async () => {
        if (selectedInstallments.size === 0) return;

        setLoading('batch');
        try {
            await Promise.all(
                Array.from(selectedInstallments).map(installmentId =>
                    loansApi.markInstallmentAsPaid(loan.id, installmentId)
                )
            );
            setSelectedInstallments(new Set());
            if (onLoanUpdate) onLoanUpdate();
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: `${selectedInstallments.size} échéance(s) marquée(s) comme payée(s) avec succès`,
                variant: 'success',
            });
        } catch (error) {
            console.error('Erreur lors du marquage multiple comme payé:', error);
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Erreur lors du marquage comme payé',
                variant: 'error',
            });
        } finally {
            setLoading(null);
        }
    };

    const handleExportInstallments = async () => {
        if (!loan.installments || loan.installments.length === 0) {
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Aucune échéance à exporter',
                variant: 'error',
            });
            return;
        }

        try {
            // Trier les échéances par numéro
            const sortedInstallments = [...loan.installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

            // Préparer les données pour l'export Excel avec le même format que le template
            const headers = ['Date', 'Capital', 'Intérêts', 'Assurance'];
            const rows = sortedInstallments.map(inst => [
                // Format ISO pour les dates (YYYY-MM-DD) comme dans le template
                new Date(inst.dueDate).toISOString().split('T')[0],
                // Format décimal avec 2 décimales comme dans le template
                (Number(inst.principalPayment) || 0).toFixed(2),
                (Number(inst.interestPayment) || 0).toFixed(2),
                (Number(inst.insurancePayment) || 0).toFixed(2)
            ]);

            // Créer le workbook et la worksheet
            const wb = XLSX.utils.book_new();
            const wsData = [headers, ...rows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Ajouter la worksheet au workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Échéances');

            // Générer le fichier Excel
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
            });

            // Télécharger le fichier
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `echeances_${loan.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Message de confirmation
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Échéances exportées avec succès au format Excel',
                variant: 'success',
            });
        } catch (err) {
            console.error('Error exporting installments:', err);
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: 'Erreur lors de l\'export des échéances',
                variant: 'error',
            });
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
            <div className="nebula-glass nebula-blob flex flex-col gap-4 rounded-3xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{loan.name}</h3>
                            <Badge variant={statusVariant[loan.status] ?? "neutral"}>
                                {statusLabel[loan.status] ?? loan.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-(--nebula-muted)">
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
                            variant="destructive"
                            className="h-9"
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
                            icon: Wallet,
                        },
                        {
                            label: 'Taux annuel',
                            value: `${loan.annualInterestRate}%`,
                            icon: Percent,
                        },
                        {
                            label: 'Durée',
                            value: `${loan.durationMonths} mois`,
                            icon: Clock,
                        },
                        {
                            label: 'Mensualité',
                            value: monthly != null ? formatCurrency(monthly) : '—',
                            icon: TrendingUp,
                        },
                    ] as const
                ).map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="nebula-glass rounded-3xl border border-white/10 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                                        {s.label}
                                    </p>
                                    <p className="mt-2 text-xl font-bold font-mono nebula-grad-text tabular-nums">
                                        {s.value}
                                    </p>
                                </div>
                                <Icon className="h-5 w-5 text-white/60" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Loan information */}
            <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-white/60" />
                        <h3 className="text-sm font-semibold text-white">
                            Informations de l&apos;emprunt
                        </h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
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
                <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-white/60" />
                            <h3 className="text-sm font-semibold text-white">Statistiques</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
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
                <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-white/60" />
                            <h3 className="text-sm font-semibold text-white">Échéancier</h3>
                            <span className="text-xs text-white/40">
                                ({totalPaid}/{totalInstallments} payées)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManage && selectedInstallments.size > 0 && (
                                <span className="text-xs text-(--nebula-muted)">
                                    {selectedInstallments.size} sélectionnée(s)
                                </span>
                            )}
                            <Button
                                onClick={handleExportInstallments}
                                size="sm"
                                className="text-xs"
                            >
                                <FileText className="h-3 w-3 mr-1" />
                                Exporter
                            </Button>
                            {canManage && selectedInstallments.size > 0 && (
                                <Button
                                    onClick={handleMarkSelectedAsPaid}
                                    disabled={loading === 'batch'}
                                    size="sm"
                                    className="text-xs"
                                >
                                    {loading === 'batch' ? (
                                        <>
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1" />
                                            Traitement...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-3 w-3 mr-1" />
                                            Marquer comme payé
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-[520px] overflow-auto">
                      <div className="min-w-[1100px]">
                        <div className="sticky top-0 z-10 grid grid-cols-[52px_70px_130px_140px_1fr_1fr_1fr_1fr_1fr_140px_170px] items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted) sm:px-6">
                          <div className="flex items-center justify-center">
                            {canManage ? (
                              <Checkbox
                                checked={
                                  selectedInstallments.size > 0 &&
                                  loan.installments!.every(
                                    (inst) => inst.isPaid || selectedInstallments.has(inst.id),
                                  )
                                }
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedInstallments(
                                      new Set(
                                        loan
                                          .installments!.filter((inst) => !inst.isPaid)
                                          .map((inst) => inst.id),
                                      ),
                                    );
                                  } else {
                                    setSelectedInstallments(new Set());
                                  }
                                }}
                                aria-label="Sélectionner toutes les échéances non payées"
                              />
                            ) : null}
                          </div>
                          <div>N°</div>
                          <div>Date</div>
                          <div>Date paiement</div>
                          <div className="text-right">Capital</div>
                          <div className="text-right">Intérêts</div>
                          <div className="text-right">Assurance</div>
                          <div className="text-right">Total</div>
                          <div className="text-right">Restant dû</div>
                          <div>Statut</div>
                          <div className="text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-white/10">
                          {[...loan.installments]
                            .sort((a, b) => a.installmentNumber - b.installmentNumber)
                            .map((inst) => {
                              const st = getInstallmentStatusDisplay(inst.status);
                              const isLoadingThis = loading === inst.id;
                              return (
                                <div
                                  key={inst.id}
                                  className="grid grid-cols-[52px_70px_130px_140px_1fr_1fr_1fr_1fr_1fr_140px_170px] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 sm:px-6"
                                >
                                  <div className="flex items-center justify-center">
                                    {canManage ? (
                                      <Checkbox
                                        checked={selectedInstallments.has(inst.id)}
                                        onCheckedChange={() => handleToggleSelection(inst.id)}
                                        disabled={inst.isPaid}
                                        aria-label={`Sélectionner l'échéance ${inst.installmentNumber}`}
                                      />
                                    ) : null}
                                  </div>

                                  <div className="text-sm font-medium text-white">
                                    {inst.installmentNumber}
                                  </div>
                                  <div className="text-sm text-(--nebula-muted)">
                                    {formatDate(inst.dueDate)}
                                  </div>
                                  <div className="text-sm text-(--nebula-muted)">
                                    {inst.paymentDate ? formatDate(inst.paymentDate) : '-'}
                                  </div>
                                  <div className="text-right text-sm text-white/85">
                                    {formatCurrencyPrecise(inst.principalPayment)}
                                  </div>
                                  <div className="text-right text-sm text-white/85">
                                    {formatCurrencyPrecise(inst.interestPayment)}
                                  </div>
                                  <div className="text-right text-sm text-white/85">
                                    {formatCurrencyPrecise(inst.insurancePayment)}
                                  </div>
                                  <div className="text-right text-sm font-semibold text-white">
                                    {formatCurrencyPrecise(inst.totalPayment)}
                                  </div>
                                  <div className="text-right text-sm text-(--nebula-muted)">
                                    {formatCurrencyPrecise(inst.remainingBalance)}
                                  </div>
                                  <div>
                                    <Badge variant={st.variant}>{st.text}</Badge>
                                  </div>
                                  <div className="flex justify-end">
                                    {canManage ? (
                                      !inst.isPaid ? (
                                        <button
                                          type="button"
                                          onClick={() => handleMarkAsPaid(inst.id)}
                                          disabled={isLoadingThis}
                                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-60"
                                        >
                                          {isLoadingThis ? (
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                                          ) : (
                                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                                          )}
                                          Marquer payé
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleUnmarkAsPaid(inst.id)}
                                          disabled={isLoadingThis}
                                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-60"
                                        >
                                          {isLoadingThis ? (
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                                          ) : (
                                            <X className="h-3.5 w-3.5 text-red-300" />
                                          )}
                                          Annuler
                                        </button>
                                      )
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                </div>
            )}
        </div>
    );
}
