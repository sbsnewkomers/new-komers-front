'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/AlertDialog';
import {
    Calculator,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Save,
    RefreshCw,
    Check,
} from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi, Group, Company, BusinessUnit } from '@/lib/entitiesApi';
import { apiFetch } from '@/lib/apiClient';
import {
    LoanCalculatorDto,
    CalculatorValidationResponse,
    CalculatorGenerationResponse,
    LoanInstallmentCalculation,
    EntityType,
    LoanInputMethod,
} from '@/types/loans';

interface LoanCalculatorProps {
    onLoanCreated?: (loanId: string) => void;
    entityType?: EntityType;
    entityId?: string;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { n: 1, label: 'Caractéristiques' },
        { n: 2, label: 'Modalités' },
        { n: 3, label: 'Validation' },
    ];
    return (
        <div className="flex items-center">
            {steps.map((s, i) => {
                const isActive = currentStep === s.n;
                const isDone = currentStep > s.n;
                return (
                    <React.Fragment key={s.n}>
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isActive
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {isDone ? <Check className="h-4 w-4" /> : s.n}
                            </div>
                            <span
                                className={`hidden text-xs font-medium sm:inline ${isActive
                                    ? 'text-slate-900'
                                    : isDone
                                        ? 'text-slate-700'
                                        : 'text-slate-400'
                                    }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${currentStep > s.n ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export function LoanCalculator({ onLoanCreated, entityType, entityId }: LoanCalculatorProps) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [entities, setEntities] = useState<Group[] | Company[] | BusinessUnit[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<string | null>('');
    const [, setValidation] = useState<CalculatorValidationResponse | null>(null);
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
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: 'La durée totale ne peut pas être null',
                },
            });
            return;
        }

        // Validate that principalAmount is not null or empty
        if (field === 'principalAmount' && (numericValue === 0)) {
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: 'Le capital emprunté ne peut pas être null',
                },
            });
            return;
        }

        // Validate that annualInterestRate does not exceed 100%
        if (field === 'annualInterestRate' && numericValue > 100) {
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: 'Le taux d\'intérêt annuel ne peut pas dépasser 100%',
                },
            });
            return;
        }

        // Validate positive values for required fields
        const positiveFields = ['principalAmount', 'annualInterestRate', 'durationMonths', 'monthlyInsuranceCost', 'deferralPeriodMonths'];
        if (positiveFields.includes(field) && numericValue < 0) {
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: 'La valeur doit être positive',
                },
            });
            return;
        }

        if (field === 'deferralPeriodMonths') {
            const deferralValue = Number(value);
            const totalDuration =
                Number(formData.durationMonths) || Number(formData.durationYears) * 12;

            if (deferralValue > totalDuration && totalDuration > 0) {
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage:
                            'La période de différé doit être inférieure à la durée totale du prêt',
                    },
                });
                return;
            }
        }

        if (field === 'durationMonths' || field === 'durationYears') {
            const newDurationMonths =
                field === 'durationMonths' ? Number(value) : Number(value) * 12;
            const deferralValue = Number(formData.deferralPeriodMonths);

            if (deferralValue > newDurationMonths && newDurationMonths > 0) {
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage:
                            'La période de différé doit être inférieure à la durée totale du prêt',
                    },
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
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: `Veuillez remplir tous les champs obligatoires: ${missingLabels}`,
                },
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
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: `Les champs suivants doivent être positifs: ${invalidLabels}`,
                },
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
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage: response.error || 'Validation failed',
                    },
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
        if (!formData.entityType || !formData.entityId) {
            setShowConfirmDialog(true);
            return;
        }

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

            const loan = await loansApi.createLoanFromCalculator(loanData);
            onLoanCreated?.(loan.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save loan');
        } finally {
            setIsLoading(false);
        }
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
                snackbar: { showSuccess: true, successMessage: 'Emprunt créé avec succès !' },
            });
            onLoanCreated?.(loan.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save loan');
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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('fr-FR');

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
        if (entityType) {
            setFormData((prev) => ({
                ...prev,
                entityType,
                entityId: entityId || '',
            }));
            setSelectedEntity(entityId || '');
            loadEntities(entityType);
        } else {
            setFormData((prev) => ({
                ...prev,
                entityType: EntityType.GROUP,
            }));
            loadEntities(EntityType.GROUP);
        }
    }, [entityType, entityId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <Calculator className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Calculatrice d&apos;emprunt intégrée
                        </h3>
                        <p className="text-xs text-slate-500">
                            Générez un échéancier complet à partir des caractéristiques de votre
                            prêt.
                        </p>
                    </div>
                </div>
                <div className="mt-6">
                    <StepIndicator currentStep={currentStep} />
                </div>
            </div>

            {error && (
                <AlertDialog open={true}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                Erreur
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription className="text-red-800">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Step 1 */}
            {currentStep === 1 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                        Caractéristiques principales
                    </h3>
                    <p className="mb-5 text-xs text-slate-500">
                        Renseignez les informations essentielles de votre emprunt.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label
                                htmlFor="loanName"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Nom de l&apos;emprunt <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="loanName"
                                placeholder="ex: Prêt BNP Agence X"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="principalAmount"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Capital emprunté (EUR) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="principalAmount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="ex: 200000"
                                value={formData.principalAmount || ''}
                                onChange={(e) =>
                                    handleInputChange('principalAmount', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="annualInterestRate"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Taux d&apos;intérêt annuel (%){' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="annualInterestRate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="ex: 2.5"
                                value={formData.annualInterestRate || ''}
                                onChange={(e) =>
                                    handleInputChange('annualInterestRate', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="duration"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Durée totale (mois) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                max="600"
                                placeholder="ex: 24"
                                value={formData.durationMonths || ''}
                                onChange={(e) =>
                                    handleInputChange('durationMonths', e.target.value)
                                }
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label
                                htmlFor="firstInstallmentDate"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Date de la première échéance{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="firstInstallmentDate"
                                type="date"
                                value={formData.firstInstallmentDate}
                                onChange={(e) =>
                                    handleInputChange('firstInstallmentDate', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                        <Button
                            onClick={validateStep1}
                            disabled={isLoading}
                            className="bg-primary text-white hover:bg-slate-800"
                        >
                            {isLoading ? 'Validation…' : 'Continuer'}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                        Modalités spécifiques
                    </h3>
                    <p className="mb-5 text-xs text-slate-500">
                        Paramètres optionnels pour affiner votre échéancier.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label
                                htmlFor="monthlyInsuranceCost"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Coût de l&apos;assurance mensuelle (EUR)
                            </Label>
                            <Input
                                id="monthlyInsuranceCost"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="ex: 50.00"
                                value={formData.monthlyInsuranceCost || ''}
                                onChange={(e) =>
                                    handleInputChange('monthlyInsuranceCost', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="deferralPeriodMonths"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                Période de différé (mois)
                            </Label>
                            <Input
                                id="deferralPeriodMonths"
                                type="number"
                                min="0"
                                placeholder="ex: 6"
                                value={formData.deferralPeriodMonths || ''}
                                onChange={(e) =>
                                    handleInputChange('deferralPeriodMonths', e.target.value)
                                }
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Durant cette période, seuls les intérêts et l&apos;assurance sont
                                payés.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                            <ArrowLeft className="h-4 w-4" />
                            Précédent
                        </Button>
                        <Button
                            onClick={generateSchedule}
                            disabled={isLoading}
                            className="bg-primary text-white hover:bg-slate-800"
                        >
                            {isLoading ? 'Génération…' : "Générer l'échéancier"}
                            <Calculator className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && generation && (
                <div className="space-y-6">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {(
                            [
                                {
                                    label: 'Mensualité',
                                    value: formatCurrency(generation.summary.monthlyPayment),
                                    color: 'text-slate-900',
                                    bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
                                },
                                {
                                    label: 'Intérêts',
                                    value: formatCurrency(generation.summary.totalInterest),
                                    color: 'text-amber-700',
                                    bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
                                },
                                {
                                    label: 'Assurance',
                                    value: formatCurrency(generation.summary.totalInsurance),
                                    color: 'text-blue-700',
                                    bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
                                },
                                {
                                    label: 'Total dû',
                                    value: formatCurrency(generation.summary.totalPayment),
                                    color: 'text-emerald-700',
                                    bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
                                },
                            ] as const
                        ).map((s) => (
                            <div
                                key={s.label}
                                className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}
                            >
                                <p
                                    className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                                >
                                    {s.label}
                                </p>
                                <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Amortization table */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-slate-500" />
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Tableau d&apos;amortissement
                                </h3>
                                <span className="text-xs text-slate-400">
                                    ({generation.amortizationTable.length} échéances)
                                </span>
                            </div>
                        </div>
                        <div className="max-h-[480px] overflow-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            N°
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Date
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Capital
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Intérêts
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Assurance
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Total
                                        </th>
                                        <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                            Restant dû
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {generation.amortizationTable.map(
                                        (inst: LoanInstallmentCalculation) => (
                                            <tr
                                                key={inst.installmentNumber}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                    {inst.installmentNumber}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatDate(inst.dueDate)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                    {formatCurrency(inst.principalPayment)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                    {formatCurrency(inst.interestPayment)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                    {formatCurrency(inst.insurancePayment)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                                    {formatCurrency(inst.totalPayment)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-600">
                                                    {formatCurrency(inst.remainingBalance)}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={resetCalculator}>
                                <RefreshCw className="h-4 w-4" />
                                Nouveau calcul
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                <ArrowLeft className="h-4 w-4" />
                                Précédent
                            </Button>
                        </div>
                        <Button
                            onClick={saveLoan}
                            disabled={isLoading}
                            className="bg-primary text-white hover:bg-slate-800"
                        >
                            {isLoading ? 'Sauvegarde…' : "Sauvegarder l'échéancier"}
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Confirmation dialog */}
            {showConfirmDialog && (
                <AlertDialog open={true} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                Confirmer la sauvegarde
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Choisissez l&apos;entité à laquelle associer cet emprunt.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                            <div>
                                <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Type d&apos;entité
                                </Label>
                                <Select
                                    value={formData.entityType || EntityType.GROUP}
                                    onValueChange={(v) => {
                                        handleInputChange('entityType', v);
                                        loadEntities(v as EntityType);
                                        setSelectedEntity('');
                                    }}
                                >
                                    <option value={EntityType.GROUP}>Groupe</option>
                                    <option value={EntityType.COMPANY}>Entreprise</option>
                                    <option value={EntityType.BUSINESSUNIT}>
                                        Unité d&apos;affaires
                                    </option>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Entité
                                </Label>
                                <Select
                                    value={selectedEntity || ''}
                                    onValueChange={(v) => {
                                        setSelectedEntity(v);
                                        setFormData((prev) => ({ ...prev, entityId: v }));
                                    }}
                                    disabled={!formData.entityType}
                                >
                                    <option value="">Sélectionner…</option>
                                    {entities.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                                Annuler
                            </Button>
                            <Button
                                onClick={confirmSaveLoan}
                                className="bg-primary text-white hover:bg-slate-800"
                                disabled={!formData.entityId}
                            >
                                Confirmer
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

export default LoanCalculator;
