'use client';

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { AppLayout } from '@/components/layout/AppLayout';
import { loansApi } from '@/lib/loansApi';
import { LoanCalculator } from '@/components/loans/LoanCalculator';
import LoanImport from '@/components/loans/LoanImport';
import { ManualLoanEntry } from '@/components/loans/ManualLoanEntry';
import { LoanStats } from '@/components/loans/LoanStats';
import { LoanList } from '@/components/loans/LoanList';
import { LoanDetails } from '@/components/loans/LoanDetails';
import { LoanCreate } from '@/components/loans/LoanCreate';
import { LoanEdit } from '@/components/loans/LoanEdit';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useLoans, useLoanDetails } from '@/hooks/useLoans';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';
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

export default function LoansPage() {
    const [activeTab, setActiveTab] = useState<LoanTabKey>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<EntityType | 'all'>('all');
    const [filterInputMethod, setFilterInputMethod] = useState<string | 'all'>('all');
    const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

    const { loans, isLoading, error, setError, setLoans, loadLoans } = useLoans();
    const { selectedLoan, loanStats, loadLoanDetails, setSelectedLoan } = useLoanDetails();
    const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();
    const { user } = usePermissionsContext();

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
                const matchesInputMethod =
                    filterInputMethod === 'all' || loan.inputMethod === filterInputMethod;
                return matchesSearch && matchesStatus && matchesEntityType && matchesInputMethod;
            }),
        [loans, searchTerm, filterStatus, filterEntityType, filterInputMethod],
    );

    const handleLoanSelect = async (loanId: string) => {
        await loadLoanDetails(loanId);
        setActiveTab('details');
    };

    const handleLoanDelete = async (loanId: string) => {
        confirmDelete(loanId);
    };

    const handleLoanEdit = (loanId: string) => {
        setEditingLoanId(loanId);
        setActiveTab('edit');
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
        setActiveTab('list');
    };

    const handleLoanUpdated = async (updatedLoan: Loan) => {
        if (!updatedLoan || !updatedLoan.id) {
            console.error('Invalid loan data received:', updatedLoan);
            return;
        }

        setLoans((prevLoans: Loan[]) =>
            prevLoans.map((loan: Loan) => (loan.id === updatedLoan.id ? updatedLoan : loan)),
        );

        if (selectedLoan?.id === updatedLoan.id) {
            // Reload loan details to get updated statistics and installments
            await loadLoanDetails(updatedLoan.id);
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

    const confirmDeleteLoan = async () => {
        if (!loanToDelete) return;

        try {
            await loansApi.deleteLoan(loanToDelete);
            setError(null);
            setLoans((prevLoans: Loan[]) =>
                prevLoans.filter((loan: Loan) => loan.id !== loanToDelete),
            );
            await loadLoans();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete loan');
        } finally {
            closeDialog();
        }
    };

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
                    </div>

                    <ErrorDialog error={error} />

                    {/* Content based on active tab */}
                    {(activeTab === 'overview' || activeTab === 'list') && (
                        <>
                            {/* Stats */}
                            <LoanStats overviewStats={overviewStats} />

                            <LoanList
                                loans={filteredLoans}
                                isLoading={isLoading}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                filterStatus={filterStatus}
                                onFilterStatusChange={setFilterStatus}
                                filterEntityType={filterEntityType}
                                onFilterEntityTypeChange={setFilterEntityType}
                                filterInputMethod={filterInputMethod}
                                onFilterInputMethodChange={setFilterInputMethod}
                                onLoanView={handleLoanSelect}
                                onLoanEdit={handleLoanEdit}
                                onLoanDelete={handleLoanDelete}
                                onCreateNew={() => setActiveTab('create')}
                            />
                        </>
                    )}

                    {activeTab === 'create' && canCreate && (
                        <LoanCreate onMethodSelect={handleMethodSelect} onBack={handleBack} />
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
                        />
                    )}

                    {activeTab === 'calculator' && (
                        <LoanCalculator onLoanCreated={handleLoanCreated} onBack={handleBack} />
                    )}

                    {activeTab === 'import' && (
                        <LoanImport onLoanImported={handleLoanCreated} onBack={handleBack} />
                    )}

                    {activeTab === 'manual' && (
                        <ManualLoanEntry onLoanCreated={handleLoanCreated} onBack={handleBack} />
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
