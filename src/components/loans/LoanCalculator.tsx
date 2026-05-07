'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/AlertDialog';
import { EntityType } from '@/types/loans';
import { CalculatorHeader } from './calculator/CalculatorHeader';
import { LoanCharacteristicsForm } from './calculator/LoanCharacteristicsForm';
import { LoanTermsForm } from './calculator/LoanTermsForm';
import { LoanSummary } from './calculator/LoanSummary';
import { ConfirmationDialog } from './calculator/ConfirmationDialog';
import { useLoanCalculator } from './calculator/hooks/useLoanCalculator';

interface LoanCalculatorProps {
    onLoanCreated?: (loanId: string) => void;
    onBack?: () => void;
    entityType?: EntityType;
    entityId?: string;
}


export function LoanCalculator({ onLoanCreated, onBack, entityType, entityId }: LoanCalculatorProps) {
    const {
        currentStep,
        setCurrentStep,
        isLoading,
        formData,
        error,
        generation,
        showConfirmDialog,
        setShowConfirmDialog,
        entities,
        selectedEntity,
        setSelectedEntity,
        handleInputChange,
        validateStep1,
        generateSchedule,
        saveLoan,
        confirmSaveLoan,
        resetCalculator,
        loadEntities,
    } = useLoanCalculator({ entityType, entityId });










    const handleConfirmSave = async () => {
        try {
            const loanId = await confirmSaveLoan();
            onLoanCreated?.(loanId);
        } catch {
            // Error is already handled in the hook
        }
    };

    return (
        <div className="space-y-6">
            <CalculatorHeader currentStep={currentStep} onBack={onBack} />

            {error && (
                <AlertDialog open={true}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-300">
                                Erreur
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription className="text-red-200/90">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {currentStep === 1 && (
                <LoanCharacteristicsForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onValidate={validateStep1}
                    isLoading={isLoading}
                />
            )}

            {currentStep === 2 && (
                <LoanTermsForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onGenerateSchedule={generateSchedule}
                    onBack={() => setCurrentStep(1)}
                    isLoading={isLoading}
                />
            )}

            {currentStep === 3 && generation && (
                <LoanSummary
                    generation={generation}
                    onReset={resetCalculator}
                    onBack={() => setCurrentStep(2)}
                    onSave={saveLoan}
                    isLoading={isLoading}
                />
            )}

            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                formData={formData}
                entities={entities}
                selectedEntity={selectedEntity || ''}
                onEntityTypeChange={(value) => {
                    handleInputChange('entityType', value);
                    loadEntities(value);
                }}
                onEntityChange={(value) => {
                    setSelectedEntity(value);
                    handleInputChange('entityId', value);
                }}
                onConfirm={handleConfirmSave}
                loadEntities={loadEntities}
            />
        </div>
    );
}

export default LoanCalculator;
