'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Edit, Plus, Trash2, Save } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { emitSnackbar } from '@/ui/snackbarBus';
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
    comments?: string;
    isNew?: boolean;
}

export function ManualLoanEntry({ onLoanCreated, entityType, entityId }: ManualLoanEntryProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Loan information
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(entityType || EntityType.GROUP);
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);

    // Installments
    const [installments, setInstallments] = useState<EditableInstallment[]>([]);
    const isInitialized = useRef(false);

    const addNewInstallment = useCallback(() => {
        // Simple sequential numbering based on current length
        const newNumber = installments.length + 1;

        // Calculate default due date
        let defaultDueDate = new Date().toISOString().split('T')[0];

        // If this is the second installment, set date to first installment date + 1 month
        if (installments.length === 1 && installments[0].dueDate) {
            const firstDate = new Date(installments[0].dueDate);
            const secondDate = new Date(firstDate);
            secondDate.setMonth(secondDate.getMonth() + 1);
            defaultDueDate = secondDate.toISOString().split('T')[0];
        }

        // Set remaining balance to 0 for new installments (will be calculated when user enters values)
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

        setInstallments(prev => [...prev, newInstallment]);
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
                    // Utiliser la nouvelle API directe pour les BU accessibles par l'utilisateur
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

    // Load entities by default on component mount
    useEffect(() => {
        if (selectedEntityType === EntityType.GROUP) {
            setTimeout(() => loadEntities(EntityType.GROUP), 0);
        }
    }, [selectedEntityType]);

    // Initialize with one empty row
    useEffect(() => {
        if (!isInitialized.current && installments.length === 0) {
            isInitialized.current = true;
            setTimeout(() => addNewInstallment(), 0);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const removeInstallment = (index: number) => {
        setInstallments(prev => {
            let updated = prev.filter((_, i) => i !== index);

            // Recalculate installment numbers
            updated = updated.map((installment, i) => ({
                ...installment,
                installmentNumber: i + 1,
            }));

            // Recalculate all remaining balances
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

                // Update the installment in the array first
                updated[index] = installment;

                // Recalculate all remaining balances when principal payment changes
                if (field === 'principalPayment') {
                    // Calculate total capital (sum of all principal payments)
                    const totalCapital = updated.reduce((sum, i) => sum + i.principalPayment, 0);

                    // Recalculate remaining balance for all installments
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
            emitSnackbar({ message: 'Le nom de l\'emprunt est requis', variant: 'error' });
            return false;
        }

        if (!selectedEntityType || !selectedEntityId) {
            emitSnackbar({ message: 'Le type d\'entité et l\'ID sont requis', variant: 'error' });
            return false;
        }

        if (installments.length === 0) {
            emitSnackbar({ message: 'Au moins une échéance est requise', variant: 'error' });
            return false;
        }

        // Check for required fields
        for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];
            if (!installment.dueDate) {
                emitSnackbar({ message: `La date est requise pour l'échéance ${i + 1}`, variant: 'error' });
                return false;
            }

            if (installment.principalPayment < 0 || installment.interestPayment < 0 || installment.insurancePayment < 0) {
                emitSnackbar({ message: `Les montants doivent être positifs pour l'échéance ${i + 1}`, variant: 'error' });
                return false;
            }
        }

        // Check sequential dates
        for (let i = 1; i < installments.length; i++) {
            const currentDate = new Date(installments[i].dueDate);
            const previousDate = new Date(installments[i - 1].dueDate);

            if (currentDate <= previousDate) {
                emitSnackbar({ message: `Les dates doivent être séquentielles. La date de l'échéance ${i + 1} est antérieure à la précédente`, variant: 'error' });
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
            // Normalize installment numbers before saving
            const normalizedInstallments = normalizeInstallmentNumbers(installments);

            // Create manual loan with installments
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
                    successMessage: 'Emprunt créé avec succès'
                }
            });

            emitSnackbar({ message: 'Emprunt créé avec succès', variant: 'success' });
            onLoanCreated?.(loan.id);
        } catch (err) {
            emitSnackbar({
                message: err instanceof Error ? err.message : 'Failed to save loan',
                variant: 'error'
            });
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

                    {/* Loan Information */}
                    <div className="space-y-6 mb-8">
                        <h3 className="text-lg font-semibold">Informations sur l&rsquo;emprunt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="loanName">Nom de l&rsquo;emprunt<span className="text-red-500">*</span></Label>
                                <Input
                                    id="loanName"
                                    placeholder="ex: Prêt BNP Agence X"
                                    value={loanName}
                                    onChange={(e) => setLoanName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="entityType">Type d&rsquo;entité<span className="text-red-500">*</span></Label>
                                <Select
                                    value={selectedEntityType}
                                    onValueChange={handleEntityTypeChange}
                                >
                                    <option value={EntityType.GROUP}>Groupe</option>
                                    <option value={EntityType.COMPANY}>Entreprise</option>
                                    <option value={EntityType.BUSINESSUNIT}>Unité de business</option>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="entityId">Entité<span className="text-red-500">*</span></Label>
                                <Select
                                    id="entityId"
                                    value={selectedEntityId || ''}
                                    onValueChange={(value) => setSelectedEntityId(value)}
                                    disabled={!selectedEntityType}
                                >
                                    <option value="">Sélectionner une entité...</option>
                                    {entities.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))}
                                </Select>
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
                                            <th className="px-4 py-2 text-right">Commentaire</th>
                                            <th className="px-4 py-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {installments.map((installment, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2">{index + 1}</td>
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
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Commentaires..."
                                                        value={installment.comments || ''}
                                                        onChange={(e) => updateInstallment(index, 'comments', e.target.value)}
                                                        className="w-32"
                                                    />
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
                                {isLoading ? 'Sauvegarde...' : 'Sauvegarder l\'emprunt'}
                                <Save className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div >
                </CardContent >
            </Card >
        </div >
    );
}