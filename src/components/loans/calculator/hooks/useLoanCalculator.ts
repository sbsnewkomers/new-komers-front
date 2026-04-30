'use client';

import { useState, useEffect } from 'react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi, Group, Company, BusinessUnit } from '@/lib/entitiesApi';
import { emitSnackbar } from '@/ui/snackbarBus';
import {
    LoanCalculatorDto,
    CalculatorValidationResponse,
    CalculatorGenerationResponse,
    EntityType,
    LoanInputMethod,
} from '@/types/loans';

interface UseLoanCalculatorProps {
    entityType?: EntityType;
    entityId?: string;
}

export function useLoanCalculator({ entityType, entityId }: UseLoanCalculatorProps) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [entities, setEntities] = useState<Group[] | Company[] | BusinessUnit[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<string | null>('');
    const [validation, setValidation] = useState<CalculatorValidationResponse | null>(null);
    const [generation, setGeneration] = useState<CalculatorGenerationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

    const [formData, setFormData] = useState<LoanCalculatorDto>({
        name: '',
        principalAmount: 0,
        annualInterestRate: 0,
        durationYears: 0,
        durationMonths: 0,
        firstInstallmentDate: '',
        monthlyInsuranceCost: 0,
        deferralPeriodMonths: 0,
        inputMethod: LoanInputMethod.CALCULATOR,
    });

    const handleInputChange = (field: keyof LoanCalculatorDto, value: string | number) => {
        const numericValue = Number(value);

        // Validate that durationMonths is not null or empty
        if (field === 'durationMonths' && (numericValue === 0)) {
            emitSnackbar({
                message: 'La durée totale ne peut pas être null',
                variant: 'error'
            });
            return;
        }

        // Validate that principalAmount is not null or empty
        if (field === 'principalAmount' && (numericValue === 0)) {
            emitSnackbar({
                message: 'Le capital emprunté ne peut pas être null',
                variant: 'error'
            });
            return;
        }

        // Validate that annualInterestRate does not exceed 100%
        if (field === 'annualInterestRate' && numericValue > 100) {
            emitSnackbar({
                message: 'Le taux d\'intérêt annuel ne peut pas dépasser 100%',
                variant: 'error'
            });
            return;
        }

        // Validate positive values for required fields
        const positiveFields = ['principalAmount', 'annualInterestRate', 'durationMonths', 'monthlyInsuranceCost', 'deferralPeriodMonths'];
        if (positiveFields.includes(field) && numericValue < 0) {
            emitSnackbar({
                message: 'La valeur doit être positive',
                variant: 'error'
            });
            return;
        }

        if (field === 'deferralPeriodMonths') {
            const deferralValue = Number(value);
            const totalDuration =
                Number(formData.durationMonths) || Number(formData.durationYears) * 12;

            if (deferralValue > totalDuration && totalDuration > 0) {
                emitSnackbar({
                    message: 'La période de différé doit être inférieure à la durée totale du prêt',
                    variant: 'error'
                });
                return;
            }
        }

        if (field === 'durationMonths' || field === 'durationYears') {
            const newDurationMonths =
                field === 'durationMonths' ? Number(value) : Number(value) * 12;
            const deferralValue = Number(formData.deferralPeriodMonths);

            if (deferralValue > newDurationMonths && newDurationMonths > 0) {
                emitSnackbar({
                    message: 'La période de différé doit être inférieure à la durée totale du prêt',
                    variant: 'error'
                });
                return;
            }
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setError(null);
    };

    const validateStep1 = async () => {
        setIsLoading(true);
        setError(null);

        const requiredFields = [
            { field: 'name', label: "Nom de l'emprunt" },
            { field: 'principalAmount', label: 'Montant du capital emprunté' },
            { field: 'annualInterestRate', label: "Taux d'intérêt annuel" },
            { field: 'durationMonths', label: 'Durée totale' },
            { field: 'firstInstallmentDate', label: 'Date de la première échéance' },
        ];

        const missingFields = requiredFields.filter(({ field }) => {
            const value = formData[field as keyof LoanCalculatorDto];
            return (
                !value ||
                (typeof value === 'string' && value.trim() === '') ||
                (typeof value === 'number' && (value <= 0 || isNaN(value)))
            );
        });

        if (missingFields.length > 0) {
            const missingLabels = missingFields.map(({ label }) => label).join(', ');
            emitSnackbar({
                message: `Veuillez remplir tous les champs obligatoires: ${missingLabels}`,
                variant: 'error'
            });
            setIsLoading(false);
            return;
        }

        // Validate optional fields must be positive when provided
        const positiveFields = [
            { field: 'monthlyInsuranceCost', label: 'Coût de l\'assurance mensuelle' },
            { field: 'deferralPeriodMonths', label: 'Période de différé' },
        ];

        const invalidPositiveFields = positiveFields.filter(({ field }) => {
            const value = formData[field as keyof LoanCalculatorDto];
            return typeof value === 'number' && value < 0;
        });

        if (invalidPositiveFields.length > 0) {
            const invalidLabels = invalidPositiveFields.map(({ label }) => label).join(', ');
            emitSnackbar({
                message: `Les champs suivants doivent être positifs: ${invalidLabels}`,
                variant: 'error'
            });
            setIsLoading(false);
            return;
        }

        try {
            const validationData = {
                ...formData,
                principalAmount: Number(formData.principalAmount),
                annualInterestRate: Number(formData.annualInterestRate),
                durationMonths:
                    Number(formData.durationMonths) || Number(formData.durationYears) * 12,
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
            };

            const response = await loansApi.validateCalculatorParameters(validationData);
            setValidation(response);

            if (response.valid) {
                setCurrentStep(2);
            } else {
                emitSnackbar({
                    message: response.error || 'Validation failed',
                    variant: 'error'
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Validation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const generateSchedule = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const calculatorData = {
                ...formData,
                principalAmount: Number(formData.principalAmount),
                annualInterestRate: Number(formData.annualInterestRate),
                durationMonths:
                    Number(formData.durationMonths) || Number(formData.durationYears) * 12,
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
            };

            const response = await loansApi.generateLoanSchedule(calculatorData);
            setGeneration(response);
            setCurrentStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const saveLoan = async () => {
        setShowConfirmDialog(true);
        return;
    };

    const confirmSaveLoan = async () => {
        setShowConfirmDialog(false);
        setIsLoading(true);
        setError(null);

        try {
            const loanData = {
                ...formData,
                principalAmount: Number(formData.principalAmount),
                annualInterestRate: Number(formData.annualInterestRate),
                durationMonths:
                    Number(formData.durationMonths) || Number(formData.durationYears) * 12,
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
                entityType: formData.entityType,
                entityId: formData.entityId,
            };

            const loan = await loansApi.createLoanFromCalculator(loanData, {
                snackbar: { showError: false, showSuccess: true, successMessage: 'Emprunt créé avec succès !' },
            });
            return loan.id;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save loan';
            emitSnackbar({
                message: errorMessage,
                variant: 'error'
            });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resetCalculator = () => {
        setCurrentStep(1);
        setFormData({
            name: '',
            principalAmount: 0,
            annualInterestRate: 0,
            durationYears: 0,
            durationMonths: 0,
            firstInstallmentDate: '',
            monthlyInsuranceCost: 0,
            deferralPeriodMonths: 0,
            inputMethod: LoanInputMethod.CALCULATOR,
        });
        setValidation(null);
        setGeneration(null);
        setError(null);
    };

    const loadEntities = async (entityType: EntityType) => {
        try {
            let entitiesList: Group[] | Company[] | BusinessUnit[] = [];

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

    useEffect(() => {
        const initializeData = async () => {
            if (entityType) {
                setFormData((prev) => ({
                    ...prev,
                    entityType,
                    entityId: entityId || '',
                }));
                setSelectedEntity(entityId || '');
                await loadEntities(entityType);
            } else {
                setFormData((prev) => ({
                    ...prev,
                    entityType: EntityType.GROUP,
                }));
                await loadEntities(EntityType.GROUP);
            }
        };

        initializeData();
    }, [entityType, entityId]);

    return {
        currentStep,
        setCurrentStep,
        isLoading,
        formData,
        error,
        validation,
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
    };
}
