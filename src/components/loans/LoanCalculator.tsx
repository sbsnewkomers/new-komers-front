'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/AlertDialog';
import { Calculator, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi, Group, Company, BusinessUnit } from '@/lib/entitiesApi';
import { apiFetch } from '@/lib/apiClient';
import {
    LoanCalculatorDto,
    CalculatorValidationResponse,
    CalculatorGenerationResponse,
    LoanInstallmentCalculation,
    EntityType,
    LoanInputMethod
} from '@/types/loans';

interface LoanCalculatorProps {
    onLoanCreated?: (loanId: string) => void;
    entityType?: EntityType;
    entityId?: string;
}

export function LoanCalculator({ onLoanCreated, entityType, entityId }: LoanCalculatorProps) {
    const [currentStep, setCurrentStep] = useState<number>(1); // Corrigé le type de currentStep
    const [isLoading, setIsLoading] = useState<boolean>(false); // Corrigé le type de isLoading
    const [entities, setEntities] = useState<(Group[] | Company[] | BusinessUnit[])>([]);
    const [selectedEntity, setSelectedEntity] = useState<string | null>(''); // Corrigé le type de selectedEntity
    const [validation, setValidation] = useState<CalculatorValidationResponse | null>(null);
    const [generation, setGeneration] = useState<CalculatorGenerationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false); // Corrigé le type de showConfirmDialog

    // Form data
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
        // Validation spécifique pour la période de différé
        if (field === 'deferralPeriodMonths') {
            const deferralValue = Number(value);
            const totalDuration = Number(formData.durationMonths) || (Number(formData.durationYears) * 12);

            if (deferralValue > totalDuration && totalDuration > 0) {
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage: 'La période de différé doit être inférieure à la durée totale du prêt'
                    }
                });
                return;
            }
        }

        // Validation spécifique pour la durée totale
        if (field === 'durationMonths' || field === 'durationYears') {
            const newDurationMonths = field === 'durationMonths'
                ? Number(value)
                : Number(value) * 12;
            const deferralValue = Number(formData.deferralPeriodMonths);

            if (deferralValue > newDurationMonths && newDurationMonths > 0) {
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage: 'La période de différé doit être inférieure à la durée totale du prêt'
                    }
                });
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const validateStep1 = async () => {
        setIsLoading(true);
        setError(null);

        // Client-side validation for required fields
        const requiredFields = [
            { field: 'name', label: 'Nom de l\'emprunt' },
            { field: 'principalAmount', label: 'Montant du capital emprunté' },
            { field: 'annualInterestRate', label: 'Taux d\'intérêt annuel' },
            { field: 'durationMonths', label: 'Durée totale' },
            { field: 'firstInstallmentDate', label: 'Date de la première échéance' }
        ];

        const missingFields = requiredFields.filter(({ field }) => {
            const value = formData[field as keyof LoanCalculatorDto];
            return !value || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && (value === 0 || isNaN(value)));
        });

        if (missingFields.length > 0) {
            const missingLabels = missingFields.map(({ label }) => label).join(', ');
            apiFetch('/dummy', {
                method: 'POST',
                snackbar: {
                    showError: true,
                    errorMessage: `Veuillez remplir tous les champs obligatoires: ${missingLabels}`
                }
            });
            setIsLoading(false);
            return;
        }

        try {
            const validationData = {
                ...formData,
                principalAmount: Number(formData.principalAmount),
                annualInterestRate: Number(formData.annualInterestRate),
                durationMonths: Number(formData.durationMonths) || (Number(formData.durationYears) * 12),
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
            };

            const response = await loansApi.validateCalculatorParameters(validationData);
            setValidation(response);

            if (response.valid) {
                setCurrentStep(2);
            } else {
                // Show validation error via snackbar
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage: response.error || 'Validation failed'
                    }
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
                durationMonths: Number(formData.durationMonths) || (Number(formData.durationYears) * 12),
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
            };

            const response = await loansApi.generateLoanSchedule(calculatorData);
            setGeneration(response);
            setCurrentStep(3);
            // Success message handled by the API call
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
                durationMonths: Number(formData.durationMonths) || (Number(formData.durationYears) * 12),
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
                durationMonths: Number(formData.durationMonths) || (Number(formData.durationYears) * 12),
                durationYears: Number(formData.durationYears) || 0,
                monthlyInsuranceCost: Number(formData.monthlyInsuranceCost) || 0,
                deferralPeriodMonths: Number(formData.deferralPeriodMonths) || 0,
                entityType: formData.entityType,
                entityId: formData.entityId,
            };

            const loan = await loansApi.createLoanFromCalculator(loanData, {
                snackbar: { showSuccess: true, successMessage: 'Emprunt créé avec succès !' }
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const loadEntities = async (entityType: EntityType) => {
        try {
            let entitiesList: Group[] | Company[] | BusinessUnit[] = [];

            switch (entityType) {
                case 'group':
                    entitiesList = await entitiesApi.getGroups();
                    break;
                case 'company':
                    entitiesList = await entitiesApi.getCompanies();
                    break;
                case 'business unit':
                    // For business units, we need to get companies first, then their business units
                    const companies = await entitiesApi.getCompanies();
                    const allBusinessUnits: BusinessUnit[] = [];
                    for (const company of companies) {
                        const businessUnits = await entitiesApi.getBusinessUnits(company.id);
                        allBusinessUnits.push(...businessUnits);
                    }
                    entitiesList = allBusinessUnits;
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

    // Initialize form data with props and pre-load entities if entityType is provided
    useEffect(() => {
        if (entityType) {
            setFormData(prev => ({
                ...prev,
                entityType,
                entityId: entityId || ''
            }));
            setSelectedEntity(entityId || '');
            loadEntities(entityType);
        }
    }, [entityType, entityId]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Calculatrice d&rsquo;Emprunt Intégrée
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Créez un échéancier complet à partir des caractéristiques de votre prêt
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                1
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Caractéristiques
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-border mx-4" />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                2
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Modalités
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-border mx-4" />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                3
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Validation
                            </span>
                        </div>
                    </div>

                    {error && (
                        <AlertDialog open={true}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                        <div className="rounded-lg bg-red-50 p-1.5">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        </div>
                                        Erreur
                                    </AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogDescription className="text-red-800">
                                    {error}
                                </AlertDialogDescription>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Confirmation Dialog */}
                    {showConfirmDialog && (
                        <AlertDialog open={true}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                                        <div className="rounded-lg bg-blue-50 p-1.5">
                                            <CheckCircle className="h-4 w-4 text-blue-500" />
                                        </div>
                                        Confirmer la sauvegarde
                                    </AlertDialogTitle>
                                </AlertDialogHeader>
                                <div className="text-gray-700">
                                    <div className="space-y-4">
                                        <p className="font-medium">
                                            Vous allez sauvegarder cet échéancier pour l&apos;entité suivante :
                                        </p>
                                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Type d&apos;entité:</span>
                                                    <select
                                                        id="entityType"
                                                        value={formData.entityType}
                                                        onChange={(e) => {
                                                            handleInputChange('entityType', e.target.value);
                                                            loadEntities(e.target.value as EntityType);
                                                            setSelectedEntity('');
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:ring-2"
                                                    >
                                                        <option value="group">Groupe</option>
                                                        <option value="company">Entreprise</option>
                                                        <option value="business unit">Unité commerciale</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Entité:</span>
                                                    <select
                                                        id="selectedEntity"
                                                        value={selectedEntity || ''}
                                                        onChange={(e) => {
                                                            setSelectedEntity(e.target.value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                entityId: e.target.value
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:ring-2"
                                                        disabled={!formData.entityType}
                                                    >
                                                        <option value="">Sélectionner une entité...</option>
                                                        {(entities || []).map((entity: Group | Company | BusinessUnit, index) => (
                                                            <option key={index} value={entity.id}>
                                                                {entity.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-4">
                                        Voulez-vous confirmer la sauvegarde de cet échéancier ?
                                    </p>
                                </div>
                                <AlertDialogFooter className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                                        Annuler
                                    </Button>
                                    <Button onClick={confirmSaveLoan} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Confirmer la sauvegarde
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                    }

                    {/* Step 1: Basic Information */}
                    {
                        currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Caractéristiques Principales</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="loanName">Nom de l&rsquo;emprunt <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="loanName"
                                                placeholder="ex: Prêt BNP Agence X"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="principalAmount">Montant du capital emprunté (EUR) <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="principalAmount"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="ex: 200000"
                                                value={formData.principalAmount || ''}
                                                onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="annualInterestRate">Taux d&apos;intérêt annuel (%) <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="annualInterestRate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                placeholder="ex: 2.5"
                                                value={formData.annualInterestRate || ''}
                                                onChange={(e) => handleInputChange('annualInterestRate', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="duration">Durée totale (mois) <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="600"
                                                placeholder="ex: 24"
                                                value={formData.durationMonths || ''}
                                                onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="firstInstallmentDate">Date de la première échéance <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="firstInstallmentDate"
                                                type="date"
                                                value={formData.firstInstallmentDate}
                                                onChange={(e) => handleInputChange('firstInstallmentDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={validateStep1} disabled={isLoading}>
                                        {isLoading ? 'Validation...' : 'Continuer'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    }

                    {/* Step 2: Optional Parameters */}
                    {
                        currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Modalités Spécifiques (Optionnel)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="monthlyInsuranceCost">Coût de l&apos;assurance mensuelle (EUR)</Label>
                                            <Input
                                                id="monthlyInsuranceCost"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="ex: 50.00"
                                                value={formData.monthlyInsuranceCost || ''}
                                                onChange={(e) => handleInputChange('monthlyInsuranceCost', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="deferralPeriodMonths">Période de différé (mois)</Label>
                                            <Input
                                                id="deferralPeriodMonths"
                                                type="number"
                                                min="0"
                                                placeholder="ex: 6"
                                                value={formData.deferralPeriodMonths || ''}
                                                onChange={(e) => handleInputChange('deferralPeriodMonths', e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Durant cette période, seuls les intérêts et l&rsquo;assurance sont payés
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                        Précédent
                                    </Button>
                                    <Button onClick={generateSchedule} disabled={isLoading}>
                                        {isLoading ? 'Génération...' : 'Générer l\'échéancier'}
                                        <Calculator className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    }

                    {/* Step 3: Results and Save */}
                    {
                        currentStep === 3 && generation && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Échéancier Généré</h3>

                                    {/* Summary */}
                                    <Card className="bg-green-50 border-green-200 mb-6">
                                        <CardContent className="pt-6">
                                            <h4 className="font-semibold text-green-900 mb-3">Résumé de l&apos;emprunt</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-sm text-green-700">Mensualité</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {formatCurrency(generation.summary.monthlyPayment)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-green-700">Total des intérêts</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {formatCurrency(generation.summary.totalInterest)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-green-700">Total assurance</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {formatCurrency(generation.summary.totalInsurance)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-green-700">Total à rembourser</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {formatCurrency(generation.summary.totalPayment)}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Amortization Table */}
                                    <div className="border rounded-lg">
                                        <div className="max-h-96 overflow-y-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">N°</th>
                                                        <th className="px-4 py-2 text-left">Date</th>
                                                        <th className="px-4 py-2 text-right">Capital</th>
                                                        <th className="px-4 py-2 text-right">Intérêts</th>
                                                        <th className="px-4 py-2 text-right">Assurance</th>
                                                        <th className="px-4 py-2 text-right">Total</th>
                                                        <th className="px-4 py-2 text-right">Restant dû</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {generation.amortizationTable.map((installment: LoanInstallmentCalculation) => (
                                                        <tr key={installment.installmentNumber} className="border-b">
                                                            <td className="px-4 py-2">{installment.installmentNumber}</td>
                                                            <td className="px-4 py-2">{formatDate(installment.dueDate)}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(installment.principalPayment)}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(installment.interestPayment)}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(installment.insurancePayment)}</td>
                                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(installment.totalPayment)}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(installment.remainingBalance)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={resetCalculator}>
                                            Nouveau calcul
                                        </Button>
                                        <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                            Précédent
                                        </Button>
                                    </div>
                                    <Button onClick={saveLoan} disabled={isLoading}>
                                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder cet échéancier'}
                                        <CheckCircle className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    }
                </CardContent >
            </Card >
        </div >
    );
}

export default LoanCalculator;