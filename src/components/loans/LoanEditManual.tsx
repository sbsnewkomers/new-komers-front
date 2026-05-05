'use client';

import React from 'react';
import { ManualEntryHeader } from './manual/ManualEntryHeader';
import { LoanInformationForm } from './manual/LoanInformationForm';
import { SummaryStats } from './manual/SummaryStats';
import { InstallmentsTable } from './manual/InstallmentsTable';
import { ActionsPanel } from './manual/ActionsPanel';
import { useManualLoanEdit } from './manual/hooks/useManualLoanEdit';
import { Loan } from '@/types/loans';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

interface LoanEditManualProps {
    loanId: string;
    onBack: () => void;
    onLoanUpdated: (loan: Loan) => void;
}

export function LoanEditManual({ loanId, onBack, onLoanUpdated }: LoanEditManualProps) {
    const {
        isLoading,
        isSaving,
        loan,
        error,
        loanName,
        selectedEntityType,
        selectedEntityId,
        entities,
        installments,
        nameValidationError,
        dateValidationErrors,
        fieldValidationErrors,
        confirmRegeneration,
        hasExistingInstallments,
        hasPaidInstallments,

        setLoanName,
        setSelectedEntityType,
        setSelectedEntityId,
        setConfirmRegeneration,
        updateInstallment,
        removeInstallment,
        addNewInstallment,
        clearInstallments,
        calculateTotals,
        saveLoan,
    } = useManualLoanEdit({ loanId });

    const totals = calculateTotals();

    const handleSaveLoan = async () => {
        try {
            const updatedLoan = await saveLoan();
            onLoanUpdated(updatedLoan);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
            // Ne pas afficher l'erreur de confirmation via l'interface, seulement via apiFetch
            if (!errorMessage.includes('Ce prêt contient déjà des échéances. Veuillez confirmer la régénération')) {
                // Utiliser emitSnackbar au lieu de onError pour éviter les alertes modales
                const { emitSnackbar } = await import('@/ui/snackbarBus');
                emitSnackbar({
                    message: errorMessage,
                    variant: 'error'
                });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement du prêt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
                <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <p className="text-red-800">Prêt non trouvé</p>
                    </div>
                </div>
                <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ManualEntryHeader onBack={onBack} />

            {/* Warning for paid installments */}
            {hasPaidInstallments && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                        <p className="text-red-800 text-sm">
                            Ce prêt contient déjà des échéances payées. Vous ne pouvez pas modifier les échéances existantes,
                            uniquement les informations générales du prêt.
                        </p>
                    </div>
                </div>
            )}


            <LoanInformationForm
                loanName={loanName}
                onLoanNameChange={setLoanName}
                selectedEntityType={selectedEntityType}
                onEntityTypeChange={setSelectedEntityType}
                selectedEntityId={selectedEntityId}
                onEntityIdChange={setSelectedEntityId}
                entities={entities}
                nameValidationError={nameValidationError}
            />

            {/* SummaryStats - only show when installments can be edited */}
            {!hasPaidInstallments && <SummaryStats totals={totals} />}

            {/* Installments section - disable if there are paid installments */}
            {!hasPaidInstallments && (
                <>
                    <InstallmentsTable
                        installments={installments}
                        onUpdate={updateInstallment}
                        onRemove={removeInstallment}
                        onAdd={addNewInstallment}
                        dateValidationErrors={dateValidationErrors}
                        fieldValidationErrors={fieldValidationErrors}
                    />

                    {/* Confirmation checkbox for existing installments */}
                    {hasExistingInstallments && (
                        <div className="flex items-start space-x-3 p-4 border border-amber-200/50 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm shadow-sm">
                            <div className="mt-0.5">
                                <Checkbox
                                    id="confirm-regeneration"
                                    checked={confirmRegeneration}
                                    onCheckedChange={(checked) => setConfirmRegeneration(checked as boolean)}
                                    disabled={isSaving}
                                    className="border-amber-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="confirm-regeneration" className="text-sm font-semibold text-amber-900 leading-tight cursor-pointer">
                                    Je confirme vouloir remplacer toutes les échéances existantes par les nouvelles échéances
                                </Label>
                                <p className="text-xs text-amber-700/80 mt-1 font-normal">
                                    Cette action est irréversible et remplacera toutes les échéances actuelles
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Actions Panel */}
            <ActionsPanel
                isLoading={isSaving}
                installmentsCount={installments.length}
                onClear={clearInstallments}
                onSave={handleSaveLoan}
                hideClear={hasPaidInstallments}
                saveButtonText="Sauvegarder la modification"
            />
        </div>
    );
}
