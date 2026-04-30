'use client';

import React from 'react';
import { EntityType } from '@/types/loans';
import { ManualEntryHeader } from './manual/ManualEntryHeader';
import { LoanInformationForm } from './manual/LoanInformationForm';
import { SummaryStats } from './manual/SummaryStats';
import { InstallmentsTable } from './manual/InstallmentsTable';
import { ActionsPanel } from './manual/ActionsPanel';
import { useManualLoanEntry } from './manual/hooks/useManualLoanEntry';

interface ManualLoanEntryProps {
    onLoanCreated?: (loanId: string) => void;
    onBack?: () => void;
    entityType?: EntityType;
    entityId?: string;
}

export function ManualLoanEntry({
    onLoanCreated,
    onBack,
    entityType,
    entityId,
}: ManualLoanEntryProps) {
    const {
        isLoading,
        loanName,
        setLoanName,
        selectedEntityType,
        selectedEntityId,
        setSelectedEntityId,
        entities,
        nameValidationError,
        installments,
        handleEntityTypeChange,
        updateInstallment,
        removeInstallment,
        addNewInstallment,
        calculateTotals,
        saveLoan,
        clearInstallments,
    } = useManualLoanEntry({ entityType, entityId });

    const totals = calculateTotals();

    const handleSaveLoan = async () => {
        try {
            const loanId = await saveLoan();
            if (loanId) {
                onLoanCreated?.(loanId);
            }
        } catch {
            // Error is already handled in the hook
        }
    };

    return (
        <div className="space-y-6">
            <ManualEntryHeader onBack={onBack} />

            <LoanInformationForm
                loanName={loanName}
                onLoanNameChange={setLoanName}
                selectedEntityType={selectedEntityType}
                onEntityTypeChange={handleEntityTypeChange}
                selectedEntityId={selectedEntityId}
                onEntityIdChange={setSelectedEntityId}
                entities={entities}
                nameValidationError={nameValidationError}
            />

            <SummaryStats totals={totals} />

            <InstallmentsTable
                installments={installments}
                onUpdate={updateInstallment}
                onRemove={removeInstallment}
                onAdd={addNewInstallment}
            />

            <ActionsPanel
                isLoading={isLoading}
                installmentsCount={installments.length}
                onClear={clearInstallments}
                onSave={handleSaveLoan}
            />
        </div>
    );
}
