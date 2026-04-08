'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/AlertDialog';
import { Calculator, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
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
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [validation, setValidation] = useState<CalculatorValidationResponse | null>(null);
    const [generation, setGeneration] = useState<CalculatorGenerationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const validateStep1 = async () => {
        setIsLoading(true);
        setError(null);

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
                setError(response.error || 'Validation failed');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const saveLoan = async () => {
        if (!entityType || !entityId) {
            setError('Entity type and entity ID are required');
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
                entityType,
                entityId,
            };

            const loan = await loansApi.createLoanFromCalculator(loanData);
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

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Caractéristiques Principales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="loanName">Nom de l&rsquo;emprunt</Label>
                                        <Input
                                            id="loanName"
                                            placeholder="ex: Prêt BNP Agence X"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="principalAmount">Montant du capital emprunté (EUR)</Label>
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
                                        <Label htmlFor="annualInterestRate">Taux d&apos;intérêt annuel (%)</Label>
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
                                        <Label htmlFor="duration">Durée totale</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="50"
                                                placeholder="Années"
                                                value={formData.durationYears || ''}
                                                onChange={(e) => handleInputChange('durationYears', e.target.value)}
                                            />
                                            <span className="flex items-center text-muted-foreground">ou</span>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="600"
                                                placeholder="Mois"
                                                value={formData.durationMonths || ''}
                                                onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="firstInstallmentDate">Date de la première échéance</Label>
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
                    )}

                    {/* Step 2: Optional Parameters */}
                    {currentStep === 2 && (
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

                            {validation && (
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-6">
                                        <h4 className="font-semibold text-blue-900 mb-3">Résumé des paramètres saisis</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div><span className="font-medium">Nom:</span> {validation.parameters.loanName}</div>
                                            <div><span className="font-medium">Capital:</span> {formatCurrency(validation.parameters.principalAmount)}</div>
                                            <div><span className="font-medium">Taux:</span> {validation.parameters.annualInterestRate}%</div>
                                            <div><span className="font-medium">Durée:</span> {validation.parameters.durationInMonths} mois</div>
                                            <div><span className="font-medium">Première échéance:</span> {formatDate(validation.parameters.firstInstallmentDate)}</div>
                                            <div><span className="font-medium">Assurance:</span> {formatCurrency(validation.parameters.monthlyInsuranceCost)}/mois</div>
                                            {validation.parameters.deferralPeriodMonths > 0 && (
                                                <div><span className="font-medium">Différé:</span> {validation.parameters.deferralPeriodMonths} mois</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    Précédent
                                </Button>
                                <Button onClick={generateSchedule} disabled={isLoading}>
                                    {isLoading ? 'Génération...' : 'Générer l&rsquo;échéancier'}
                                    <Calculator className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results and Save */}
                    {currentStep === 3 && generation && (
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
                                <Button onClick={saveLoan} disabled={isLoading || !entityType || !entityId}>
                                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder cet échéancier'}
                                    <CheckCircle className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card >
        </div >
    );
}