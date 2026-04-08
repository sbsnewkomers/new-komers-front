'use client';

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { loansApi } from '@/lib/loansApi';
import { LoanCalculator } from '@/components/loans/LoanCalculator';
import { LoanImport } from '@/components/loans/LoanImport';
import { ManualLoanEntry } from '@/components/loans/ManualLoanEntry';
import { LoanOverview } from '@/components/loans/LoanOverview';
import { LoanList } from '@/components/loans/LoanList';
import { LoanDetails } from '@/components/loans/LoanDetails';
import { LoanCreate } from '@/components/loans/LoanCreate';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useLoans, useLoanDetails } from '@/hooks/useLoans';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import {
    Loan,
    EntityType,
    LoanStatus,
    LoanStatistics
} from '@/types/loans';

export default function LoansPageOptimized() {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<EntityType | 'all'>('all');

    // Custom hooks
    const { loans, isLoading, error, setError } = useLoans();
    const { selectedLoan, loanStats, loadLoanDetails, clearLoanDetails } = useLoanDetails();
    const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();

    // Overview stats
    const overviewStats = useMemo(() => ({
        totalLoans: loans.length,
        activeLoans: loans.filter(loan => loan.status === 'ACTIVE').length,
        totalPrincipal: loans.reduce((sum, loan) => sum + loan.principalAmount, 0),
        averageRate: loans.length > 0 ? loans.reduce((sum, loan) => sum + loan.annualInterestRate, 0) / loans.length : 0,
    }), [loans]);

    // Filtered loans
    const filteredLoans = useMemo(() => loans.filter(loan => {
        const matchesSearch = loan.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
        const matchesEntityType = filterEntityType === 'all' || loan.entityType === filterEntityType;
        return matchesSearch && matchesStatus && matchesEntityType;
    }), [loans, searchTerm, filterStatus, filterEntityType]);

    // Event handlers
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
            if (selectedLoan?.id === loanToDelete) {
                clearLoanDetails();
                setActiveTab('overview');
            }
            // Reload loans to refresh the list
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete loan');
        } finally {
            closeDialog();
        }
    };

    const handleLoanCreated = (loanId: string) => {
        loadLoanDetails(loanId);
    };

    const handleMethodSelect = (method: 'calculator' | 'import' | 'manual') => {
        setActiveTab(method);
    };

    const handleBack = () => {
        setActiveTab('overview');
    };

    return (
        <>
            <Head>
                <title>Gestion des emprunts</title>
            </Head>

            <AppLayout title="Gestion des emprunts">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des emprunts</h1>
                        <p className="text-muted-foreground">
                            Suivez et gérez tous vos emprunts et échéanciers
                        </p>
                    </div>

                    {/* Error Dialog */}
                    <ErrorDialog error={error} />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Aperçu</TabsTrigger>
                            <TabsTrigger value="list">Liste complète</TabsTrigger>
                            <TabsTrigger value="create">Créer</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview">
                            <LoanOverview
                                loans={filteredLoans}
                                overviewStats={overviewStats}
                                onLoanSelect={handleLoanSelect}
                            />
                        </TabsContent>

                        {/* List Tab */}
                        <TabsContent value="list">
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
                                onLoanEdit={() => { }}
                                onLoanDelete={handleLoanDelete}
                            />
                        </TabsContent>

                        {/* Create Tab */}
                        <TabsContent value="create">
                            <LoanCreate
                                onMethodSelect={handleMethodSelect}
                            />
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details">
                            {selectedLoan && (
                                <LoanDetails
                                    loan={selectedLoan}
                                    loanStats={loanStats}
                                    onBack={handleBack}
                                    onEdit={() => { }}
                                    onDelete={handleLoanDelete}
                                />
                            )}
                        </TabsContent>

                        {/* Hidden tabs for specific creation methods */}
                        <TabsContent value="calculator" style={{ display: 'none' }}>
                            <LoanCalculator onLoanCreated={handleLoanCreated} />
                        </TabsContent>

                        <TabsContent value="import" style={{ display: 'none' }}>
                            <LoanImport onLoanImported={handleLoanCreated} />
                        </TabsContent>

                        <TabsContent value="manual" style={{ display: 'none' }}>
                            <ManualLoanEntry onLoanCreated={handleLoanCreated} />
                        </TabsContent>
                    </Tabs>

                    {/* Delete Confirmation Dialog */}
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