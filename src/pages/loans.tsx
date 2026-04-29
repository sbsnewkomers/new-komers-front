'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { loansApi } from '@/lib/loansApi';
import { LoanCalculator } from '@/components/loans/LoanCalculator';
import LoanImport from '@/components/loans/LoanImport';
import { ManualLoanEntry } from '@/components/loans/ManualLoanEntry';
import { LoanOverview } from '@/components/loans/LoanOverview';
import { LoanList } from '@/components/loans/LoanList';
import { LoanDetails } from '@/components/loans/LoanDetails';
import { LoanCreate } from '@/components/loans/LoanCreate';
import { LoanEdit } from '@/components/loans/LoanEdit';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Button } from '@/components/ui/Button';
import { useLoans, useLoanDetails } from '@/hooks/useLoans';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';
import { Plus } from 'lucide-react';
import {
    Loan,
    EntityType,
    LoanStatus
} from '@/types/loans';

type LoanTabKey =
    | 'overview'
    | 'list'
    | 'create'
    | 'details'
    | 'edit'
    | 'calculator'
    | 'import'
    | 'manual';

export default function LoansPageOptimized() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<LoanTabKey>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<EntityType | 'all'>('all');
    const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

    const { loans, isLoading, error, setError, setLoans, loadLoans } = useLoans();
    const { selectedLoan, loanStats, loadLoanDetails, clearLoanDetails, setSelectedLoan } = useLoanDetails();
    const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();
    const { user } = usePermissionsContext();

    useEffect(() => {
        if (router.isReady) {
            const { tab, loanId } = router.query;

            if (tab === 'details' && loanId && typeof loanId === 'string') {
                loadLoanDetails(loanId);
                setTimeout(() => setActiveTab('details'), 0);
            } else if (tab && typeof tab === 'string') {
                setTimeout(() => setActiveTab(tab as LoanTabKey), 0);
            }
        }
    }, [router.isReady, router.query]); // eslint-disable-line react-hooks/exhaustive-deps

    const overviewStats = useMemo(() => {
        const validLoans = loans.filter((loan) => loan != null);
        return {
            totalLoans: validLoans.length,
            activeLoans: validLoans.filter((loan) => loan.status === 'ACTIVE').length,
            completedLoans: validLoans.filter((loan) => loan.status === 'COMPLETED').length,
            totalPrincipal: validLoans.reduce(
                (sum, loan) => sum + (Number(loan.principalAmount) || 0),
                0,
            ),
            averageRate:
                validLoans.length > 0
                    ? validLoans.reduce(
                        (sum, loan) => sum + (Number(loan.annualInterestRate) || 0),
                        0,
                    ) / validLoans.length
                    : 0,
        };
    }, [loans]);

    const filteredLoans = useMemo(
        () =>
            loans.filter((loan) => {
                const matchesSearch = loan.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
                const matchesEntityType =
                    filterEntityType === 'all' || loan.entityType === filterEntityType;
                return matchesSearch && matchesStatus && matchesEntityType;
            }),
        [loans, searchTerm, filterStatus, filterEntityType],
    );

    const handleLoanSelect = async (loanId: string) => {
        await loadLoanDetails(loanId);
        setActiveTab('details');
    };

    const handleLoanDelete = async (loanId: string) => {
        confirmDelete(loanId);
    };

    const confirmDeleteLoan = async () => {
        if (!loanToDelete) return;

        try {
            await loansApi.deleteLoan(loanToDelete);
            setError(null);

            setLoans((prevLoans: Loan[]) =>
                prevLoans.filter((loan: Loan) => loan.id !== loanToDelete),
            );

            if (selectedLoan?.id === loanToDelete) {
                clearLoanDetails();
                setActiveTab('overview');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete loan');
        } finally {
            closeDialog();
        }
    };

    const handleLoanCreated = async (loanId: string) => {
        await loadLoanDetails(loanId);
        await loadLoans();
        setActiveTab('details');
    };

    const handleMethodSelect = (method: 'calculator' | 'import' | 'manual') => {
        setActiveTab(method);
    };

    const handleBack = () => {
        setActiveTab('overview');
    };

    const handleLoanEdit = (loanId: string) => {
        setEditingLoanId(loanId);
        setActiveTab('edit');
    };

    const handleLoanUpdated = (updatedLoan: Loan) => {
        if (!updatedLoan || !updatedLoan.id) {
            console.error('Invalid loan data received:', updatedLoan);
            return;
        }

        setLoans((prevLoans: Loan[]) =>
            prevLoans.map((loan: Loan) => (loan.id === updatedLoan.id ? updatedLoan : loan)),
        );

        if (selectedLoan?.id === updatedLoan.id) {
            setSelectedLoan(updatedLoan);
        }

        setActiveTab('details');
        setEditingLoanId(null);
    };

    const handleLoanInstallmentUpdate = async () => {
        if (selectedLoan) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await loadLoanDetails(selectedLoan.id);
        }
    };

    const handleEditBack = () => {
        setEditingLoanId(null);
        setActiveTab('list');
    };

    const canCreate = user?.role !== 'END_USER';

    const tabs: { key: LoanTabKey; label: string; count?: number }[] = [
        { key: 'overview', label: 'Aperçu' },
        { key: 'list', label: 'Liste', count: overviewStats.totalLoans },
        ...(canCreate ? [{ key: 'create' as LoanTabKey, label: 'Créer' }] : []),
    ];

    const isSubView =
        activeTab === 'details' ||
        activeTab === 'edit' ||
        activeTab === 'calculator' ||
        activeTab === 'import' ||
        activeTab === 'manual';

    return (
        <>
            <Head>
                <title>Gestion des emprunts</title>
            </Head>

            <AppLayout title="Gestion des emprunts">
                <div className="space-y-3 md:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="mb-1 flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-dollar-sign h-5 w-5 text-primary"
                                    aria-hidden="true"
                                >
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary">
                                    Gestion des emprunts
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Suivez et gérez tous vos emprunts et échéanciers.
                                </p>
                            </div>
                        </div>

                        {canCreate && !isSubView && (
                            <div className="flex w-full items-center gap-3 sm:w-auto">
                                <Button
                                    onClick={() => setActiveTab('create')}
                                    className="w-full bg-primary text-white hover:bg-slate-800 sm:w-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvel emprunt
                                </Button>
                            </div>
                        )}
                    </div>

                    <ErrorDialog error={error} />

                    {/* Tabs */}
                    {!isSubView && (
                        <div
                            className={`grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 ${canCreate ? 'grid-cols-3' : 'grid-cols-2'
                                }`}
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${isActive
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab.label}
                                        {typeof tab.count === 'number' && (
                                            <span
                                                className={`ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive
                                                        ? 'bg-slate-900 text-white'
                                                        : 'bg-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Tab content */}
                    {activeTab === 'overview' && (
                        <LoanOverview
                            loans={filteredLoans}
                            overviewStats={overviewStats}
                            onLoanSelect={handleLoanSelect}
                        />
                    )}

                    {activeTab === 'list' && (
                        <LoanList
                            loans={filteredLoans}
                            isLoading={isLoading}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filterStatus={filterStatus}
                            onFilterStatusChange={setFilterStatus}
                            filterEntityType={filterEntityType}
                            onFilterEntityTypeChange={setFilterEntityType}
                            onLoanView={handleLoanSelect}
                            onLoanEdit={handleLoanEdit}
                            onLoanDelete={handleLoanDelete}
                        />
                    )}

                    {activeTab === 'create' && canCreate && (
                        <LoanCreate onMethodSelect={handleMethodSelect} />
                    )}

                    {activeTab === 'details' && selectedLoan && (
                        <LoanDetails
                            loan={selectedLoan}
                            loanStats={loanStats}
                            onBack={handleBack}
                            onEdit={handleLoanEdit}
                            onDelete={handleLoanDelete}
                            onLoanUpdate={handleLoanInstallmentUpdate}
                        />
                    )}

                    {activeTab === 'edit' && editingLoanId && (
                        <LoanEdit
                            loanId={editingLoanId}
                            onBack={handleEditBack}
                            onLoanUpdated={handleLoanUpdated}
                            onError={setError}
                        />
                    )}

                    {activeTab === 'calculator' && (
                        <LoanCalculator onLoanCreated={handleLoanCreated} />
                    )}

                    {activeTab === 'import' && (
                        <LoanImport onLoanImported={handleLoanCreated} />
                    )}

                    {activeTab === 'manual' && (
                        <ManualLoanEntry onLoanCreated={handleLoanCreated} />
                    )}

                    <DeleteConfirmDialog
                        open={deleteConfirmOpen}
                        onOpenChange={closeDialog}
                        onConfirm={confirmDeleteLoan}
                        onCancel={cancelDelete}
                    />
                </div>
            </AppLayout>
        </>
    );
}
