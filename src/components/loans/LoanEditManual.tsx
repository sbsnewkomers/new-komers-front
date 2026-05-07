'use client';

import React from 'react';
import { LoanInformationForm } from './manual/LoanInformationForm';
import { SummaryStats } from './manual/SummaryStats';
import { InstallmentsTable } from './manual/InstallmentsTable';
import { ActionsPanel } from './manual/ActionsPanel';
import { useManualLoanEdit } from './manual/hooks/useManualLoanEdit';
import { Loan } from '@/types/loans';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { AlertTriangle, ArrowLeft, Loader2, Pencil } from 'lucide-react';

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
                <Loader2 className="h-8 w-8 animate-spin text-(--nebula-gold-light)" />
                <span className="ml-2 text-(--nebula-muted)">Chargement du prêt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="nebula-glass rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                        <p className="text-sm text-red-100">{error}</p>
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
                <div className="nebula-glass rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                        <p className="text-sm text-red-100">Prêt non trouvé</p>
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
            {/* Header */}
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
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <Pencil className="h-5 w-5 text-(--nebula-gold-light)" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                Modification manuelle
                            </h3>
                            <p className="text-xs text-(--nebula-muted)">{loan?.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning for paid installments */}
            {hasPaidInstallments && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                        <p className="text-sm text-red-100">
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
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                            <div className="mt-0.5">
                                <Checkbox
                                    id="confirm-regeneration"
                                    checked={confirmRegeneration}
                                    onCheckedChange={(checked) => setConfirmRegeneration(checked as boolean)}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="confirm-regeneration" className="cursor-pointer text-sm font-semibold leading-tight text-white">
                                    Je confirme vouloir remplacer toutes les échéances existantes par les nouvelles échéances
                                </Label>
                                <p className="mt-1 text-xs font-normal text-(--nebula-muted)">
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
