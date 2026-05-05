'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { emitSnackbar } from '@/ui/snackbarBus';
import { EntityType, LoanInputMethod } from '@/types/loans';
import { EditableInstallment, LoanTotals } from '../utils';

interface UseManualLoanEntryProps {
    entityType?: EntityType;
    entityId?: string;
}

export function useManualLoanEntry({ entityType, entityId }: UseManualLoanEntryProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(
        entityType || EntityType.GROUP,
    );
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
    const [nameValidationError, setNameValidationError] = useState<string | null>(null);
    const [installments, setInstallments] = useState<EditableInstallment[]>([]);
    const isInitialized = useRef(false);

    const addNewInstallment = useCallback(() => {
        const newNumber = installments.length + 1;

        let defaultDueDate = new Date().toISOString().split('T')[0];

        if (installments.length === 1 && installments[0].dueDate) {
            const firstDate = new Date(installments[0].dueDate);
            const secondDate = new Date(firstDate);
            secondDate.setMonth(secondDate.getMonth() + 1);
            defaultDueDate = secondDate.toISOString().split('T')[0];
        }

        const newInstallment: EditableInstallment = {
            installmentNumber: newNumber,
            dueDate: defaultDueDate,
            principalPayment: 0,
            interestPayment: 0,
            insurancePayment: 0,
            totalPayment: 0,
            remainingBalance: 0,
            comments: '',
            isNew: true,
        };

        setInstallments((prev) => [...prev, newInstallment]);
    }, [installments]);

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

    const validateLoanName = async (name: string, entityType: EntityType, entityId: string) => {
        if (!name.trim() || !entityType || !entityId) {
            setNameValidationError(null);
            return;
        }

        try {
            const response = await loansApi.validateManualLoanName(name, entityType, entityId);
            if (!response.isUnique) {
                setNameValidationError(`Un prêt avec le nom "${name}" existe déjà pour cette entité`);
            } else {
                setNameValidationError(null);
            }
        } catch (error) {
            console.error('Error validating loan name:', error);
            setNameValidationError(null);
        }
    };

    const removeInstallment = (index: number) => {
        setInstallments((prev) => {
            let updated = prev.filter((_, i) => i !== index);

            updated = updated.map((installment, i) => ({
                ...installment,
                installmentNumber: i + 1,
            }));

            if (updated.length > 0) {
                const totalCapital = updated.reduce((sum, i) => sum + i.principalPayment, 0);
                let cumulativePaid = 0;
                for (let i = 0; i < updated.length; i++) {
                    cumulativePaid += updated[i].principalPayment;
                    updated[i].remainingBalance = totalCapital - cumulativePaid;
                }
            }

            return updated;
        });
    };

    const handleEntityTypeChange = (value: string) => {
        const entityType = value as EntityType;
        setSelectedEntityType(entityType);
        setSelectedEntityId('');
        loadEntities(entityType);
    };

    const updateInstallment = (
        index: number,
        field: keyof EditableInstallment,
        value: string | number,
    ) => {
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
                installment.totalPayment =
                    installment.principalPayment +
                    installment.interestPayment +
                    installment.insurancePayment;

                updated[index] = installment;

                if (field === 'principalPayment') {
                    const totalCapital = updated.reduce(
                        (sum, i) => sum + i.principalPayment,
                        0,
                    );

                    let cumulativePaid = 0;
                    for (let i = 0; i < updated.length; i++) {
                        cumulativePaid += updated[i].principalPayment;
                        updated[i].remainingBalance = totalCapital - cumulativePaid;
                    }
                }
            } else if (field === 'comments') {
                installment[field] = value as string;
            }

            updated[index] = installment;
            return updated;
        });
    };

    const calculateTotals = (): LoanTotals => {
        const totalPrincipal = installments.reduce((sum, i) => sum + i.principalPayment, 0);
        const totalInterest = installments.reduce((sum, i) => sum + i.interestPayment, 0);
        const totalInsurance = installments.reduce((sum, i) => sum + i.insurancePayment, 0);
        const totalPayment = installments.reduce((sum, i) => sum + i.totalPayment, 0);

        return {
            totalPrincipal,
            totalInterest,
            totalInsurance,
            totalPayment,
            averageMonthlyPayment:
                installments.length > 0 ? totalPayment / installments.length : 0,
        };
    };

    const validateInstallments = () => {
        if (!loanName.trim()) {
            emitSnackbar({ message: "Le nom de l'emprunt est requis", variant: 'error' });
            return false;
        }

        if (nameValidationError) {
            emitSnackbar({ message: nameValidationError, variant: 'error' });
            return false;
        }

        if (!selectedEntityType || !selectedEntityId) {
            emitSnackbar({
                message: "Le type d'entité et l'ID sont requis",
                variant: 'error',
            });
            return false;
        }

        if (installments.length === 0) {
            emitSnackbar({ message: 'Au moins une échéance est requise', variant: 'error' });
            return false;
        }

        for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];
            if (!installment.dueDate) {
                emitSnackbar({
                    message: `La date est requise pour l'échéance ${i + 1}`,
                    variant: 'error',
                });
                return false;
            }

            if (installment.principalPayment <= 0) {
                emitSnackbar({
                    message: `Le montant principal doit être supérieur à 0 pour l'échéance ${i + 1}`,
                    variant: 'error',
                });
                return false;
            }

            if (
                installment.interestPayment < 0 ||
                installment.insurancePayment < 0
            ) {
                emitSnackbar({
                    message: `Les montants d'intérêts et d'assurance doivent être positifs ou nuls pour l'échéance ${i + 1}`,
                    variant: 'error',
                });
                return false;
            }
        }

        for (let i = 1; i < installments.length; i++) {
            const currentDate = new Date(installments[i].dueDate);
            const previousDate = new Date(installments[i - 1].dueDate);

            if (currentDate <= previousDate) {
                emitSnackbar({
                    message: `Les dates doivent être séquentielles. La date de l'échéance ${i + 1} est antérieure à la précédente`,
                    variant: 'error',
                });
                return false;
            }
        }

        return true;
    };

    const normalizeInstallmentNumbers = (installmentsList: EditableInstallment[]) => {
        return installmentsList.map((installment, index) => ({
            ...installment,
            installmentNumber: index + 1,
        }));
    };

    const saveLoan = async () => {
        if (!validateInstallments()) {
            return;
        }

        setIsLoading(true);

        try {
            const normalizedInstallments = normalizeInstallmentNumbers(installments);

            const manualLoanData = {
                name: loanName,
                entityType: selectedEntityType,
                entityId: selectedEntityId,
                installments: normalizedInstallments.map((installment) => ({
                    installmentNumber: installment.installmentNumber,
                    dueDate: installment.dueDate,
                    principalPayment: installment.principalPayment,
                    interestPayment: installment.interestPayment,
                    insurancePayment: installment.insurancePayment,
                    totalPayment: installment.totalPayment,
                    remainingBalance: installment.remainingBalance,
                    comments: installment.comments || undefined,
                })),
                inputMethod: LoanInputMethod.MANUAL,
            };

            const loan = await loansApi.createManualLoan(manualLoanData, {
                snackbar: {
                    showSuccess: true,
                    successMessage: 'Emprunt créé avec succès',
                },
            });

            emitSnackbar({ message: 'Emprunt créé avec succès', variant: 'success' });
            return loan.id;
        } catch (err) {
            emitSnackbar({
                message: err instanceof Error ? err.message : 'Failed to save loan',
                variant: 'error',
            });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const clearInstallments = () => {
        setInstallments([]);
    };

    useEffect(() => {
        if (selectedEntityType === EntityType.GROUP) {
            setTimeout(() => loadEntities(EntityType.GROUP), 0);
        }
    }, [selectedEntityType]);

    useEffect(() => {
        const validateName = async () => {
            if (loanName.trim() && selectedEntityType && selectedEntityId) {
                await validateLoanName(loanName, selectedEntityType, selectedEntityId);
            } else {
                setNameValidationError(null);
            }
        };

        validateName();
    }, [loanName, selectedEntityType, selectedEntityId]);

    useEffect(() => {
        if (!isInitialized.current && installments.length === 0) {
            isInitialized.current = true;
            setTimeout(() => addNewInstallment(), 0);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
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
    };
}
