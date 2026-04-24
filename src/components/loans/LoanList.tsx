import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
    Eye,
    Pencil,
    Trash2,
    Search,
    MoreHorizontal,
    Users,
    Building2,
    Briefcase,
    FileText,
} from 'lucide-react';
import { Loan, LoanStatus, EntityType } from '@/types/loans';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';

interface LoanListProps {
    loans: Loan[];
    isLoading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filterStatus: LoanStatus | 'all';
    onFilterStatusChange: (status: LoanStatus | 'all') => void;
    filterEntityType: EntityType | 'all';
    onFilterEntityTypeChange: (type: EntityType | 'all') => void;
    onLoanView: (loanId: string) => void;
    onLoanEdit: (loanId: string) => void;
    onLoanDelete: (loanId: string) => void;
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

const entityTypeLabel: Record<string, string> = {
    group: 'Groupe',
    company: 'Entreprise',
    'business unit': "Unité d'affaires",
};

function EntityTypeIcon({ entityType }: { entityType: string }) {
    switch (entityType) {
        case 'group':
            return <Users className="h-3.5 w-3.5 text-slate-400" />;
        case 'company':
            return <Building2 className="h-3.5 w-3.5 text-slate-400" />;
        case 'business unit':
            return <Briefcase className="h-3.5 w-3.5 text-slate-400" />;
        default:
            return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    }
}

export function LoanList({
    loans,
    isLoading,
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterEntityType,
    onFilterEntityTypeChange,
    onLoanView,
    onLoanEdit,
    onLoanDelete,
}: LoanListProps) {
    const { user } = usePermissionsContext();
    const canManage = user?.role !== 'END_USER';

    const calculateProgress = (loan: Loan) => {
        if (!loan.createdAt) return 0;
        const created = new Date(loan.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor(
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
        );
        const totalDays = loan.durationMonths * 30;
        if (totalDays <= 0) return 0;
        return Math.min(100, Math.round((daysSinceCreation / totalDays) * 100));
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-emerald-500';
        if (progress >= 50) return 'bg-amber-500';
        return 'bg-blue-500';
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Rechercher un emprunt..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9 border-slate-200 bg-white pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onValueChange={(v) => onFilterStatusChange(v as LoanStatus | 'all')}
                    className="h-9 w-full border-slate-200 bg-white text-sm sm:w-fit!"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="SUSPENDED">Suspendu</option>
                </Select>
                <Select
                    value={filterEntityType}
                    onValueChange={(v) => onFilterEntityTypeChange(v as EntityType | 'all')}
                    className="h-9 w-full border-slate-200 bg-white text-sm sm:w-fit!"
                >
                    <option value="all">Tous les types</option>
                    <option value="group">Groupe</option>
                    <option value="company">Entreprise</option>
                    <option value="business unit">Unité d&apos;affaires</option>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                    </div>
                ) : loans.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                            <FileText className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">
                            Aucun emprunt trouvé
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {searchTerm || filterStatus !== 'all' || filterEntityType !== 'all'
                                ? 'Essayez de modifier vos filtres.'
                                : 'Créez votre premier emprunt.'}
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
                                        Entité
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
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Progression
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan) => {
                                    const progress = calculateProgress(loan);
                                    return (
                                        <tr
                                            key={loan.id}
                                            className="group transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {loan.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Début {formatDate(loan.firstInstallmentDate)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <EntityTypeIcon entityType={loan.entityType} />
                                                    <span className="text-sm text-slate-600">
                                                        {entityTypeLabel[loan.entityType] ??
                                                            loan.entityType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                                                {formatCurrency(loan.principalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                                                    {loan.annualInterestRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-600">
                                                {loan.durationMonths} mois
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
                                                <div className="w-32">
                                                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(
                                                                progress,
                                                            )}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm sm:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() => onLoanView(loan.id)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />{' '}
                                                                Voir
                                                            </DropdownMenuItem>
                                                            {canManage && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            onLoanEdit(loan.id)
                                                                        }
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />{' '}
                                                                        Modifier
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            onLoanDelete(loan.id)
                                                                        }
                                                                        className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                                        Supprimer
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
