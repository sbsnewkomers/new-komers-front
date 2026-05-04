'use client';

import { useState, useEffect } from 'react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { Loan, EntityType, UpdateManualLoanDto } from '@/types/loans';
import { EditableInstallment, LoanTotals } from '../utils';

interface UseManualLoanEditProps {
    loanId: string;
}

export function useManualLoanEdit({ loanId }: UseManualLoanEditProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loan, setLoan] = useState<Loan | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(EntityType.COMPANY);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [installments, setInstallments] = useState<EditableInstallment[]>([]);
    const [nameValidationError, setNameValidationError] = useState<string | null>(null);
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);

    // Confirmation state
    const [confirmRegeneration, setConfirmRegeneration] = useState(false);
    const [hasExistingInstallments, setHasExistingInstallments] = useState(false);
    const [hasPaidInstallments, setHasPaidInstallments] = useState(false);

    // Load entities based on entity type
    const loadEntities = async (entityType: EntityType) => {
        try {
            let entitiesList: Array<{ id: string; name: string }> = [];

            switch (entityType) {
                case EntityType.GROUP:
                    entitiesList = await entitiesApi.getGroups();
                    break;
                case EntityType.COMPANY:
                    entitiesList = await entitiesApi.getCompanies();
                    break;
                case EntityType.BUSINESSUNIT:
                    entitiesList = await entitiesApi.getBusinessUnitsForUser();
                    break;
                default:
                    entitiesList = [];
            }

            setEntities(entitiesList);
        } catch (error) {
            console.error('Error loading entities:', error);
            setEntities([]);
        }
    };

    // Load loan data
    useEffect(() => {
        const loadLoan = async () => {
            try {
                setIsLoading(true);
                const loanData = await loansApi.getLoan(loanId);

                // Verify it's a manual loan
                if (loanData.inputMethod !== 'MANUAL') {
                    setError('Ce composant ne peut être utilisé qu\'avec les prêts créés manuellement');
                    return;
                }

                setLoan(loanData);
                setLoanName(loanData.name);
                setSelectedEntityType(loanData.entityType);
                setSelectedEntityId(loanData.entityId);

                // Load entities for the current entity type
                await loadEntities(loanData.entityType);

                // Convert existing installments to update format
                if (loanData.installments && loanData.installments.length > 0) {
                    const convertedInstallments: EditableInstallment[] = loanData.installments.map(inst => ({
                        id: inst.id,
                        installmentNumber: inst.installmentNumber,
                        dueDate: inst.dueDate,
                        principalPayment: Number(inst.principalPayment) || 0,
                        interestPayment: Number(inst.interestPayment) || 0,
                        insurancePayment: Number(inst.insurancePayment) || 0,
                        totalPayment: Number(inst.totalPayment) || 0,
                        remainingBalance: Number(inst.remainingBalance) || 0,
                        comments: undefined, // Existing installments might not have comments
                        isNew: false,
                    }));
                    setInstallments(convertedInstallments);
                    setHasExistingInstallments(true);

                    // Check if any installments are paid
                    const paidCount = loanData.installments.filter(inst => inst.isPaid).length;
                    setHasPaidInstallments(paidCount > 0);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement du prêt');
            } finally {
                setIsLoading(false);
            }
        };

        loadLoan();
    }, [loanId]);

    // Validate loan name uniqueness
    const validateLoanName = async (name: string): Promise<boolean> => {
        if (!name || name === loan?.name) return true;

        try {
            const result = await loansApi.checkLoanNameUniqueness(
                name,
                selectedEntityType,
                selectedEntityId,
                loanId // Exclude current loan from validation
            );
            return result.isUnique;
        } catch {
            return false;
        }
    };

    // Handle entity type change
    const handleEntityTypeChange = (value: string) => {
        const entityType = value as EntityType;
        setSelectedEntityType(entityType);
        setSelectedEntityId('');
        loadEntities(entityType);
    };

    // Handle loan name change with validation
    const handleLoanNameChange = async (name: string) => {
        setLoanName(name);

        if (name && name !== loan?.name) {
            const isUnique = await validateLoanName(name);
            setNameValidationError(isUnique ? null : 'Ce nom de prêt existe déjà pour cette entité');
        } else {
            setNameValidationError(null);
        }
    };

    // Update installment
    const updateInstallment = (index: number, field: keyof EditableInstallment, value: string | number) => {
        setInstallments((prev) => {
            const updated = [...prev];
            const installment = { ...updated[index] };

            if (field === 'dueDate') {
                installment[field] = value as string;
            } else if (
                field === 'principalPayment' ||
                field === 'interestPayment' ||
                field === 'insurancePayment'
            ) {
                const numValue = Number(value) || 0;
                installment[field] = numValue;

                // Calculate total payment safely
                const totalPayment =
                    (Number(installment.principalPayment) || 0) +
                    (Number(installment.interestPayment) || 0) +
                    (Number(installment.insurancePayment) || 0);
                installment.totalPayment = isNaN(totalPayment) ? 0 : totalPayment;

                updated[index] = installment;

                if (field === 'principalPayment') {
                    const totalCapital = updated.reduce(
                        (sum, i) => sum + (Number(i.principalPayment) || 0),
                        0,
                    );

                    let cumulativePaid = 0;
                    for (let i = 0; i < updated.length; i++) {
                        cumulativePaid += Number(updated[i].principalPayment) || 0;
                        const remainingBalance = totalCapital - cumulativePaid;
                        updated[i].remainingBalance = isNaN(remainingBalance) ? 0 : remainingBalance;
                    }
                }
            } else if (field === 'comments') {
                installment[field] = value as string;
            }

            updated[index] = installment;
            return updated;
        });
    };

    // Remove installment
    const removeInstallment = (index: number) => {
        setInstallments((prev) => {
            let updated = prev.filter((_, i) => i !== index);

            updated = updated.map((installment, i) => ({
                ...installment,
                installmentNumber: i + 1,
            }));

            if (updated.length > 0) {
                const totalCapital = updated.reduce((sum, i) => sum + (Number(i.principalPayment) || 0), 0);
                let cumulativePaid = 0;
                for (let i = 0; i < updated.length; i++) {
                    cumulativePaid += Number(updated[i].principalPayment) || 0;
                    const remainingBalance = totalCapital - cumulativePaid;
                    updated[i].remainingBalance = isNaN(remainingBalance) ? 0 : remainingBalance;
                }
            }

            return updated;
        });
    };

    // Add new installment
    const addNewInstallment = () => {
        const newInstallment: EditableInstallment = {
            installmentNumber: installments.length + 1,
            dueDate: new Date().toISOString().split('T')[0],
            principalPayment: 0,
            interestPayment: 0,
            insurancePayment: 0,
            totalPayment: 0,
            remainingBalance: 0,
            comments: '',
            isNew: true,
        };
        setInstallments([...installments, newInstallment]);
    };

    // Calculate totals from installments
    const calculateTotals = (): LoanTotals => {
        const totalPrincipal = installments.reduce((sum, inst) => sum + (Number(inst.principalPayment) || 0), 0);
        const totalInterest = installments.reduce((sum, inst) => sum + (Number(inst.interestPayment) || 0), 0);
        const totalInsurance = installments.reduce((sum, inst) => sum + (Number(inst.insurancePayment) || 0), 0);
        const totalPayment = installments.reduce((sum, inst) => sum + (Number(inst.totalPayment) || 0), 0);
        const averageMonthlyPayment = installments.length > 0 ? totalPayment / installments.length : 0;

        return {
            totalPrincipal: isNaN(totalPrincipal) ? 0 : totalPrincipal,
            totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
            totalInsurance: isNaN(totalInsurance) ? 0 : totalInsurance,
            totalPayment: isNaN(totalPayment) ? 0 : totalPayment,
            averageMonthlyPayment: isNaN(averageMonthlyPayment) ? 0 : averageMonthlyPayment,
        };
    };

    // Clear all installments
    const clearInstallments = () => {
        setInstallments([]);
        setConfirmRegeneration(false);
    };

    // Save loan
    const saveLoan = async (): Promise<Loan> => {
        if (!loan) throw new Error('Prêt non chargé');

        // Validate
        if (!loanName.trim()) {
            throw new Error('Le nom du prêt est requis');
        }

        if (nameValidationError) {
            throw new Error('Veuillez corriger les erreurs de validation');
        }

        if (installments.length === 0 && !hasPaidInstallments) {
            throw new Error('Au moins une échéance est requise');
        }

        if (hasPaidInstallments && installments.some(inst => inst.isNew)) {
            throw new Error('Impossible d\'ajouter de nouvelles échéances à un prêt qui contient déjà des échéances payées');
        }

        // Check if we need confirmation for regeneration (only if installments are being modified)
        const isModifyingInstallments = installments.length > 0 &&
            (installments.some(inst => inst.isNew) ||
                installments.some(inst => !inst.id) || // New installments don't have IDs
                JSON.stringify(installments) !== JSON.stringify(loan.installments || [])); // Compare with original installments


        setIsSaving(true);

        try {
            const updateData: UpdateManualLoanDto = {
                name: loanName !== loan.name ? loanName : undefined,
                entityType: selectedEntityType !== loan.entityType ? selectedEntityType : undefined,
                entityId: selectedEntityId !== loan.entityId ? selectedEntityId : undefined,
                // Only include installments if we're actually modifying them and there are no paid installments
                installments: (!hasPaidInstallments && isModifyingInstallments) ? installments : undefined,
                confirmInstallmentsRegeneration: (!hasPaidInstallments && hasExistingInstallments && isModifyingInstallments) ? confirmRegeneration : undefined,
            };

            const updatedLoan = await loansApi.updateManualLoan(loanId, updateData, {
                snackbar: {
                    showSuccess: true,
                    successMessage: 'Prêt manuel modifié avec succès',
                    showError: true,
                },
            });

            return updatedLoan;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        // State
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
        confirmRegeneration,
        hasExistingInstallments,
        hasPaidInstallments,

        // Actions
        setLoanName: handleLoanNameChange,
        setSelectedEntityType: handleEntityTypeChange,
        setSelectedEntityId,
        setConfirmRegeneration,
        updateInstallment,
        removeInstallment,
        addNewInstallment,
        clearInstallments,
        calculateTotals,
        saveLoan,
    };
}
