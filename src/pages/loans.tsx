'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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

export default function LoansPageOptimized() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<EntityType | 'all'>('all');
    const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

    // Custom hooks
    const { loans, isLoading, error, setError, setLoans } = useLoans();
    const { selectedLoan, loanStats, loadLoanDetails, clearLoanDetails, setSelectedLoan } = useLoanDetails();
    const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();
    const { user } = usePermissionsContext();

    // Gérer les paramètres query au chargement
    useEffect(() => {
        if (router.isReady) {
            const { tab, loanId } = router.query;

            if (tab === 'details' && loanId && typeof loanId === 'string') {
                // Charger l'emprunt et afficher l'onglet details
                loadLoanDetails(loanId);
                setActiveTab('details');
            } else if (tab && typeof tab === 'string') {
                setActiveTab(tab);
            }
        }
    }, [router.isReady, router.query]); // eslint-disable-line react-hooks/exhaustive-deps

    // Overview stats
    const overviewStats = useMemo(() => {
        console.log('Loans data:', loans);
        console.log('Loans length:', loans.length);

        const validLoans = loans.filter(loan => loan != null);
        const stats = {
            totalLoans: validLoans.length,
            activeLoans: validLoans.filter(loan => loan.status === 'ACTIVE').length,
            totalPrincipal: validLoans.reduce((sum, loan) => sum + (Number(loan.principalAmount) || 0), 0),
            averageRate: validLoans.length > 0
                ? validLoans.reduce((sum, loan) => sum + (Number(loan.annualInterestRate) || 0), 0) / validLoans.length
                : 0,
        };
        console.log('Valid loans:', validLoans);
        console.log('Calculated stats:', stats);
        return stats;
    }, [loans]);

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

            // Remove loan from the list
            setLoans((prevLoans: Loan[]) =>
                prevLoans.filter((loan: Loan) => loan.id !== loanToDelete)
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

    const handleLoanCreated = (loanId: string) => {
        loadLoanDetails(loanId);
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
        console.log('Loan updated:', updatedLoan);

        // Guard against undefined/null
        if (!updatedLoan || !updatedLoan.id) {
            console.error('Invalid loan data received:', updatedLoan);
            return;
        }

        // Update loan in loans list
        setLoans((prevLoans: Loan[]) =>
            prevLoans.map((loan: Loan) =>
                loan.id === updatedLoan.id ? updatedLoan : loan
            )
        );

        // Update selected loan if it's one being edited
        if (selectedLoan?.id === updatedLoan.id) {
            setSelectedLoan(updatedLoan);
        }

        // Go back to details view
        setActiveTab('details');
        setEditingLoanId(null);
    };

    const handleLoanInstallmentUpdate = async () => {
        // Recharger les détails du prêt pour mettre à jour les échéances et les statistiques
        if (selectedLoan) {
            // Petit délai pour s'assurer que le backend a le temps de mettre à jour les données
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadLoanDetails(selectedLoan.id);
        }
    };

    const handleEditBack = () => {
        setEditingLoanId(null);
        setActiveTab('list');
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
                        <div className="flex items-center gap-3 mb-1">
                            <div className="rounded-xl bg-primary/10 p-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign h-5 w-5 text-primary" aria-hidden="true">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary">Gestion des emprunts</h2>
                                <p className="text-sm text-slate-500">Suivez et gérez tous vos emprunts et échéanciers</p>
                            </div>
                        </div>
                    </div>

                    {/* Error Dialog */}
                    <ErrorDialog error={error} />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="h-12 p-1.5 bg-slate-100 rounded-xl gap-1">
                            <TabsTrigger
                                value="overview"
                                className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Aperçu
                            </TabsTrigger>
                            <TabsTrigger
                                value="list"
                                className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Liste complète
                            </TabsTrigger>
                            {user?.role !== 'END_USER' && (
                                <TabsTrigger
                                    value="create"
                                    className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Créer
                                </TabsTrigger>
                            )}
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
                                onLoanEdit={handleLoanEdit}
                                onLoanDelete={handleLoanDelete}
                            />
                        </TabsContent>

                        {/* Create Tab */}
                        {user?.role !== 'END_USER' && (
                            <TabsContent value="create">
                                <LoanCreate
                                    onMethodSelect={handleMethodSelect}
                                />
                            </TabsContent>
                        )}

                        {/* Details Tab */}
                        <TabsContent value="details">
                            {selectedLoan && (
                                <LoanDetails
                                    loan={selectedLoan}
                                    loanStats={loanStats}
                                    onBack={handleBack}
                                    onEdit={handleLoanEdit}
                                    onDelete={handleLoanDelete}
                                    onLoanUpdate={handleLoanInstallmentUpdate}
                                />
                            )}
                        </TabsContent>

                        {/* Edit Tab */}
                        <TabsContent value="edit">
                            {editingLoanId && (
                                <LoanEdit
                                    loanId={editingLoanId}
                                    onBack={handleEditBack}
                                    onLoanUpdated={handleLoanUpdated}
                                    onError={setError}
                                />
                            )}
                        </TabsContent>

                        {/* Creation method tabs */}
                        <TabsContent value="calculator">
                            <LoanCalculator onLoanCreated={handleLoanCreated} />
                        </TabsContent>

                        <TabsContent value="import">
                            <LoanImport onLoanImported={handleLoanCreated} />
                        </TabsContent>

                        <TabsContent value="manual">
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