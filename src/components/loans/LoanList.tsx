import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
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
    FileText,
    Plus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Loan, LoanStatus, EntityType } from '@/types/loans';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';
import { formatCurrencyEUR, formatDateFR } from '@/lib/format';

interface LoanListProps {
    loans: Loan[];
    isLoading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filterStatus: LoanStatus | 'all';
    onFilterStatusChange: (status: LoanStatus | 'all') => void;
    filterEntityType: EntityType | 'all';
    onFilterEntityTypeChange: (type: EntityType | 'all') => void;
    filterInputMethod: string | 'all';
    onFilterInputMethodChange: (method: string | 'all') => void;
    onLoanView: (loanId: string) => void;
    onLoanEdit: (loanId: string) => void;
    onLoanDelete: (loanId: string) => void;
    onCreateNew?: () => void;
}

const formatCurrency = (amount: number) =>
  formatCurrencyEUR(amount, { maximumFractionDigits: 0, fallback: "0 €" });

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

// const entityTypeLabel: Record<string, string> = {
//     group: 'Groupe',
//     company: 'Entreprise',
//     'business unit': "Unité d'affaires",
// };

const methodVariant: Record<string, BadgeVariant> = {
    CALCULATOR: 'info',
    IMPORT: 'warning',
    MANUAL: 'neutral',
};

const methodLabel: Record<string, string> = {
    CALCULATOR: 'Calculatrice',
    IMPORT: 'Import',
    MANUAL: 'Manuel',
};

// function EntityTypeIcon({ entityType }: { entityType: string }) {
//     switch (entityType) {
//         case 'group':
//             return <Users className="h-3.5 w-3.5 text-white/50" />;
//         case 'company':
//             return <Building2 className="h-3.5 w-3.5 text-white/50" />;
//         case 'business unit':
//             return <Briefcase className="h-3.5 w-3.5 text-white/50" />;
//         default:
//             return <FileText className="h-3.5 w-3.5 text-white/50" />;
//     }
// }

export function LoanList({
    loans,
    isLoading,
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterEntityType,
    onFilterEntityTypeChange,
    filterInputMethod,
    onFilterInputMethodChange,
    onLoanView,
    onLoanEdit,
    onLoanDelete,
    onCreateNew,
}: LoanListProps) {
    const { user } = usePermissionsContext();
    const canManage = user?.role !== 'END_USER';

    console.log('LoanList Debug - canManage:', canManage, 'user:', user, 'onCreateNew:', !!onCreateNew);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(loans.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLoans = loans.slice(startIndex, endIndex);

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
            {/* Header with create button */}
            {canManage && onCreateNew && (
                <div className="flex justify-end">
                    <Button
                        onClick={onCreateNew}
                        className="h-10 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvel emprunt
                    </Button>
                </div>
            )}

            {/* Filters */}
            <div className="nebula-glass rounded-3xl border border-white/10 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                        placeholder="Rechercher un emprunt..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onValueChange={(v) => onFilterStatusChange(v as LoanStatus | 'all')}
                    className="h-10 w-full text-sm sm:w-fit!"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="SUSPENDED">Suspendu</option>
                </Select>
                <Select
                    value={filterEntityType}
                    onValueChange={(v) => onFilterEntityTypeChange(v as EntityType | 'all')}
                    className="h-10 w-full text-sm sm:w-fit!"
                >
                    <option value="all">Tous les types</option>
                    <option value="group">Groupe</option>
                    <option value="company">Entreprise</option>
                    <option value="business unit">Unité d&apos;affaires</option>
                </Select>
                <Select
                    value={filterInputMethod}
                    onValueChange={onFilterInputMethodChange}
                    className="h-10 w-full text-sm sm:w-fit!"
                >
                    <option value="all">Toutes les méthodes</option>
                    <option value="CALCULATOR">Calculatrice</option>
                    <option value="IMPORT">Import</option>
                    <option value="MANUAL">Manuel</option>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
                    </div>
                ) : loans.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                            <FileText className="h-6 w-6 text-white/30" />
                        </div>
                        <h3 className="text-sm font-medium text-white">
                            Aucun emprunt trouvé
                        </h3>
                        <p className="mt-1 text-sm text-(--nebula-muted)">
                            {searchTerm || filterStatus !== 'all' || filterEntityType !== 'all'
                                ? 'Essayez de modifier vos filtres.'
                                : 'Créez votre premier emprunt.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Pagination info */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sm:px-6">
                            <p className="text-sm text-(--nebula-muted)">
                                Affichage de {startIndex + 1}-{Math.min(endIndex, loans.length)} sur {loans.length} emprunt{loans.length > 1 ? 's' : ''}
                            </p>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="px-3 py-1 text-sm text-(--nebula-muted)">
                                        Page {currentPage} sur {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grid Table */}
                        <div className="overflow-x-auto">
                          <div className="min-w-[980px]">
                            <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.6fr_0.7fr_0.7fr_0.9fr_80px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted) sm:px-6">
                              <div>Emprunt</div>
                              <div>Méthode</div>
                              <div className="text-right">Capital</div>
                              <div className="text-right">Taux</div>
                              <div className="text-right">Durée</div>
                              <div>Statut</div>
                              <div>Progression</div>
                              <div className="text-right">Actions</div>
                            </div>

                            <div className="divide-y divide-white/10">
                              {currentLoans.map((loan) => {
                                const progress = calculateProgress(loan);
                                return (
                                  <div
                                    key={loan.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onLoanView(loan.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") onLoanView(loan.id);
                                    }}
                                    className="group grid cursor-pointer grid-cols-[1.4fr_0.7fr_0.8fr_0.6fr_0.7fr_0.7fr_0.9fr_80px] items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 sm:px-6"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-white">
                                        {loan.name}
                                      </p>
                                      <p className="truncate text-xs text-(--nebula-muted)">
                                        Début {formatDate(loan.firstInstallmentDate)}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Badge variant={methodVariant[loan.inputMethod] ?? "neutral"}>
                                        {methodLabel[loan.inputMethod] ?? loan.inputMethod}
                                      </Badge>
                                    </div>

                                    <div className="text-right text-sm font-medium text-white">
                                      {formatCurrency(loan.principalAmount)}
                                    </div>

                                    <div className="flex justify-end">
                                      <Badge variant="info">{loan.annualInterestRate}%</Badge>
                                    </div>

                                    <div className="text-right text-sm text-(--nebula-muted)">
                                      {loan.durationMonths} mois
                                    </div>

                                    <div>
                                      <Badge variant={statusVariant[loan.status] ?? "neutral"}>
                                        {statusLabel[loan.status] ?? loan.status}
                                      </Badge>
                                    </div>

                                    <div className="w-36">
                                      <div className="mb-1 flex items-center justify-between text-[10px] text-white/50">
                                        <span>{progress}%</span>
                                      </div>
                                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                        <div
                                          className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(
                                            progress,
                                          )}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 opacity-100 transition-colors hover:bg-white/10 hover:text-(--nebula-gold-light) md:opacity-0 md:group-hover:opacity-100"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => onLoanView(loan.id)}>
                                            <Eye className="mr-2 h-4 w-4" /> Voir
                                          </DropdownMenuItem>
                                          {canManage && (
                                            <>
                                              <DropdownMenuItem onClick={() => onLoanEdit(loan.id)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => onLoanDelete(loan.id)}
                                                className="text-red-300 focus:bg-white/10 focus:text-red-200"
                                              >
                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Pagination controls at bottom */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 sm:px-6">
                                <p className="text-sm text-(--nebula-muted)">
                                    {loans.length} emprunt{loans.length > 1 ? 's' : ''} au total
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm border border-white/10 rounded-lg bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Première
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Page numbers */}
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    type="button"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                                                        ? 'bg-white/15 text-white'
                                                        : 'border border-white/10 bg-white/5  hover:bg-white/10'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm border border-white/10 rounded-lg bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Dernière
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
