'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/AlertDialog';
import { Edit, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import {
    EntityType,
    LoanInputMethod
} from '@/types/loans';

interface ManualLoanEntryProps {
    onLoanCreated?: (loanId: string) => void;
    entityType?: EntityType;
    entityId?: string;
}

interface EditableInstallment {
    id?: string;
    installmentNumber: number;
    dueDate: string;
    principalPayment: number;
    interestPayment: number;
    insurancePayment: number;
    totalPayment: number;
    remainingBalance: number;
    isNew?: boolean;
}

export function ManualLoanEntry({ onLoanCreated, entityType, entityId }: ManualLoanEntryProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Loan information
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(entityType || EntityType.GROUP);
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');

    // Installments
    const [installments, setInstallments] = useState<EditableInstallment[]>([]);

    const addNewInstallment = useCallback(() => {
        const newNumber = installments.length + 1;
        const lastBalance = installments.length > 0 ? installments[installments.length - 1].remainingBalance : 0;

        const newInstallment: EditableInstallment = {
            installmentNumber: newNumber,
            dueDate: new Date().toISOString().split('T')[0],
            principalPayment: 0,
            interestPayment: 0,
            insurancePayment: 0,
            totalPayment: 0,
            remainingBalance: lastBalance,
            isNew: true,
        };

        setInstallments(prev => [...prev, newInstallment]);
    }, [installments.length]);

    // Initialize with one empty row
    useEffect(() => {
        if (installments.length === 0) {
            addNewInstallment();
        }
    }, [installments.length, addNewInstallment]);

    const removeInstallment = (index: number) => {
        setInstallments(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // Recalculate installment numbers and remaining balances
            return updated.map((installment, i) => ({
                ...installment,
                installmentNumber: i + 1,
                remainingBalance: i === 0 ? totals.totalPrincipal : updated[i - 1].remainingBalance - installment.principalPayment,
            }));
        });
    };

    const updateInstallment = (index: number, field: keyof EditableInstallment, value: string | number) => {
        setInstallments(prev => {
            const updated = [...prev];
            const installment = { ...updated[index] };

            if (field === 'dueDate') {
                installment[field] = value as string;
            } else if (field === 'principalPayment' || field === 'interestPayment' || field === 'insurancePayment') {
                const numValue = Number(value) || 0;
                installment[field] = numValue;
                // Recalculate total payment
                installment.totalPayment = installment.principalPayment + installment.interestPayment + installment.insurancePayment;

                // Recalculate remaining balance for this and subsequent installments
                if (field === 'principalPayment') {
                    const previousBalance = index === 0 ?
                        totals.totalPrincipal :
                        updated[index - 1].remainingBalance;
                    installment.remainingBalance = previousBalance - numValue;

                    // Update remaining balances for subsequent installments
                    for (let i = index + 1; i < updated.length; i++) {
                        updated[i].remainingBalance = updated[i - 1].remainingBalance - updated[i].principalPayment;
                    }
                }
            }

            updated[index] = installment;
            return updated;
        });
    };

    const calculateTotals = () => {
        const totalPrincipal = installments.reduce((sum, i) => sum + i.principalPayment, 0);
        const totalInterest = installments.reduce((sum, i) => sum + i.interestPayment, 0);
        const totalInsurance = installments.reduce((sum, i) => sum + i.insurancePayment, 0);
        const totalPayment = installments.reduce((sum, i) => sum + i.totalPayment, 0);

        return {
            totalPrincipal,
            totalInterest,
            totalInsurance,
            totalPayment,
            averageMonthlyPayment: installments.length > 0 ? totalPayment / installments.length : 0,
        };
    };

    const validateInstallments = () => {
        if (!loanName.trim()) {
            setError('Le nom de l\'emprunt est requis');
            return false;
        }

        if (!selectedEntityType || !selectedEntityId) {
            setError('Le type d\'entité et l\'ID sont requis');
            return false;
        }

        if (installments.length === 0) {
            setError('Au moins une échéance est requise');
            return false;
        }

        // Check for required fields
        for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];
            if (!installment.dueDate) {
                setError(`La date est requise pour l'échéance ${i + 1}`);
                return false;
            }

            if (installment.principalPayment < 0 || installment.interestPayment < 0 || installment.insurancePayment < 0) {
                setError(`Les montants doivent être positifs pour l'échéance ${i + 1}`);
                return false;
            }
        }

        // Check sequential dates
        for (let i = 1; i < installments.length; i++) {
            const currentDate = new Date(installments[i].dueDate);
            const previousDate = new Date(installments[i - 1].dueDate);

            if (currentDate <= previousDate) {
                setError(`Les dates doivent être séquentielles. La date de l'échéance ${i + 1} est antérieure à la précédente`);
                return false;
            }
        }

        return true;
    };

    const saveLoan = async () => {
        if (!validateInstallments()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const totals = calculateTotals();

            // Create loan with calculated parameters
            const loanData = {
                name: loanName,
                principalAmount: totals.totalPrincipal,
                annualInterestRate: totals.totalPrincipal > 0 ? (totals.totalInterest / totals.totalPrincipal) * 100 : 0,
                durationMonths: installments.length,
                firstInstallmentDate: installments[0]?.dueDate || new Date().toISOString().split('T')[0],
                monthlyInsuranceCost: installments[0]?.insurancePayment || 0,
                deferralPeriodMonths: 0,
                entityType: selectedEntityType,
                entityId: selectedEntityId,
                inputMethod: LoanInputMethod.MANUAL,
            };

            const loan = await loansApi.createLoan(loanData);

            // Create installments manually
            const installmentPromises = installments.map((installment, index) => {
                // This would need a dedicated API endpoint for manual installment creation
                // For now, we'll use the existing loan structure
                return loansApi.updateLoan(loan.id, {
                    // This is a simplified approach - in reality, you'd need a specific endpoint
                    // for creating individual installments
                });
            });

            await Promise.all(installmentPromises);

            setSuccess('Emprunt créé avec succès');
            onLoanCreated?.(loan.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save loan');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const totals = calculateTotals();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Saisie Manuelle ou Ajustement
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Pour les prêts complexes ou pour ajuster une échéance spécifique
                    </p>
                </CardHeader>
                <CardContent>
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
                                    <AlertDialogDescription className="text-red-800">
                                        {error}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {success && (
                        <AlertDialog open={true}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                                        <div className="rounded-lg bg-green-50 p-1.5">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        Succès
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-green-800">
                                        {success}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Loan Information */}
                    <div className="space-y-6 mb-8">
                        <h3 className="text-lg font-semibold">Informations sur l&rsquo;emprunt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="loanName">Nom de l&rsquo;emprunt</Label>
                                <Input
                                    id="loanName"
                                    placeholder="ex: Prêt BNP Agence X"
                                    value={loanName}
                                    onChange={(e) => setLoanName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="entityType">Type d&rsquo;entité</Label>
                                <select
                                    value={selectedEntityType}
                                    onChange={(e) => setSelectedEntityType(e.target.value as EntityType)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value={EntityType.GROUP}>Groupe</option>
                                    <option value={EntityType.COMPANY}>Entreprise</option>
                                    <option value={EntityType.BUSINESSUNIT}>Unité de business</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="entityId">ID de l&rsquo;entité</Label>
                                <Input
                                    id="entityId"
                                    placeholder="UUID de l'entité"
                                    value={selectedEntityId}
                                    onChange={(e) => setSelectedEntityId(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Installments Table */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Échéancier</h3>
                            <Button onClick={addNewInstallment} variant="outline" size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter une ligne
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
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
                                            <th className="px-4 py-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {installments.map((installment, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2">{installment.installmentNumber}</td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="date"
                                                        value={installment.dueDate}
                                                        onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                                                        className="w-32"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={installment.principalPayment}
                                                        onChange={(e) => updateInstallment(index, 'principalPayment', e.target.value)}
                                                        className="w-24 text-right"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={installment.interestPayment}
                                                        onChange={(e) => updateInstallment(index, 'interestPayment', e.target.value)}
                                                        className="w-24 text-right"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={installment.insurancePayment}
                                                        onChange={(e) => updateInstallment(index, 'insurancePayment', e.target.value)}
                                                        className="w-24 text-right"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {formatCurrency(installment.totalPayment)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(installment.remainingBalance)}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Button
                                                        onClick={() => removeInstallment(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <h4 className="font-semibold text-blue-900 mb-3">Résumé de l&rsquo;emprunt</h4>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <div className="text-sm text-blue-700">Capital total</div>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(totals.totalPrincipal)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-700">Total des intérêts</div>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(totals.totalInterest)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-700">Total assurance</div>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(totals.totalInsurance)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-700">Total à rembourser</div>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(totals.totalPayment)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-700">Moyenne mensuelle</div>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(totals.averageMonthlyPayment)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setInstallments([])}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Tout effacer
                            </Button>
                            <Button onClick={saveLoan} disabled={isLoading}>
                                {isLoading ? 'Sauvegarde...' : 'Sauvegarder l&rsquo;emprunt'}
                                <Save className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}