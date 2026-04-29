'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
    Edit,
    Plus,
    Trash2,
    Save,
    Wallet,
    Percent,
    Shield,
    TrendingUp,
    Calculator,
} from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { emitSnackbar } from '@/ui/snackbarBus';
import { EntityType, LoanInputMethod } from '@/types/loans';

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

export function ManualLoanEntry({
    onLoanCreated,
    entityType,
    entityId,
}: ManualLoanEntryProps) {
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

    useEffect(() => {
        if (selectedEntityType === EntityType.GROUP) {
            setTimeout(() => loadEntities(EntityType.GROUP), 0);
        }
    }, [selectedEntityType]);

    // Validate loan name when it changes or when entity changes
    useEffect(() => {
        if (loanName.trim() && selectedEntityType && selectedEntityId) {
            validateLoanName(loanName, selectedEntityType, selectedEntityId);
        } else {
            setNameValidationError(null);
        }
    }, [loanName, selectedEntityType, selectedEntityId]);

    useEffect(() => {
        if (!isInitialized.current && installments.length === 0) {
            isInitialized.current = true;
            setTimeout(() => addNewInstallment(), 0);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            averageMonthlyPayment:
                installments.length > 0 ? totalPayment / installments.length : 0,
        };
    };

    const validateInstallments = () => {
        if (!loanName.trim()) {
            emitSnackbar({ message: "Le nom de l'emprunt est requis", variant: 'error' });
            return false;
        }

        // Check for loan name validation error
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

            if (
                installment.principalPayment < 0 ||
                installment.interestPayment < 0 ||
                installment.insurancePayment < 0
            ) {
                emitSnackbar({
                    message: `Les montants doivent être positifs pour l'échéance ${i + 1}`,
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
            onLoanCreated?.(loan.id);
        } catch (err) {
            emitSnackbar({
                message: err instanceof Error ? err.message : 'Failed to save loan',
                variant: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(amount);

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                        <Edit className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Saisie manuelle ou ajustement
                        </h3>
                        <p className="text-xs text-slate-500">
                            Pour les prêts complexes ou pour ajuster une échéance spécifique.
                        </p>
                    </div>
                </div>
            </div>

            {/* Loan Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                    Informations sur l&apos;emprunt
                </h3>
                <p className="mb-5 text-xs text-slate-500">
                    Renseignez les informations de base de votre emprunt.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                            value={loanName}
                            onChange={(e) => setLoanName(e.target.value)}
                            className={nameValidationError ? 'border-red-500' : ''}
                        />
                        {nameValidationError && (
                            <p className="mt-1 text-xs text-red-600">
                                {nameValidationError}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label
                            htmlFor="entityType"
                            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                            Type d&apos;entité <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedEntityType}
                            onValueChange={handleEntityTypeChange}
                        >
                            <option value={EntityType.GROUP}>Groupe</option>
                            <option value={EntityType.COMPANY}>Entreprise</option>
                            <option value={EntityType.BUSINESSUNIT}>
                                Unité d&apos;affaires
                            </option>
                        </Select>
                    </div>
                    <div>
                        <Label
                            htmlFor="entityId"
                            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                            Entité <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            id="entityId"
                            value={selectedEntityId || ''}
                            onValueChange={(value) => setSelectedEntityId(value)}
                            disabled={!selectedEntityType}
                        >
                            <option value="">Sélectionner une entité…</option>
                            {entities.map((entity) => (
                                <option key={entity.id} value={entity.id}>
                                    {entity.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {(
                    [
                        {
                            label: 'Capital total',
                            value: formatCurrency(totals.totalPrincipal),
                            color: 'text-slate-900',
                            bg: 'bg-linear-to-l from-slate-200 to-white ring-1 ring-slate-100',
                            icon: Wallet,
                        },
                        {
                            label: 'Intérêts',
                            value: formatCurrency(totals.totalInterest),
                            color: 'text-amber-700',
                            bg: 'bg-linear-to-l from-yellow-200 to-white ring-1 ring-yellow-100',
                            icon: Percent,
                        },
                        {
                            label: 'Assurance',
                            value: formatCurrency(totals.totalInsurance),
                            color: 'text-blue-700',
                            bg: 'bg-linear-to-l from-blue-200 to-white ring-1 ring-blue-100',
                            icon: Shield,
                        },
                        {
                            label: 'Total dû',
                            value: formatCurrency(totals.totalPayment),
                            color: 'text-emerald-700',
                            bg: 'bg-linear-to-l from-green-200 to-white ring-1 ring-green-100',
                            icon: TrendingUp,
                        },
                        {
                            label: 'Moyenne / mois',
                            value: formatCurrency(totals.averageMonthlyPayment),
                            color: 'text-purple-700',
                            bg: 'bg-linear-to-l from-purple-200 to-white ring-1 ring-purple-100',
                            icon: Calculator,
                        },
                    ] as const
                ).map((s) => {
                    const Icon = s.icon;
                    return (
                        <div
                            key={s.label}
                            className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p
                                        className={`text-xs font-bold uppercase tracking-wider ${s.color}`}
                                    >
                                        {s.label}
                                    </p>
                                    <p className={`mt-1 text-lg font-bold ${s.color}`}>
                                        {s.value}
                                    </p>
                                </div>
                                <Icon className={`h-4 w-4 ${s.color} opacity-60`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Installments Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-900">Échéancier</h3>
                        <span className="text-xs text-slate-400">
                            ({installments.length} échéance{installments.length > 1 ? 's' : ''})
                        </span>
                    </div>
                    <Button onClick={addNewInstallment} variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                        Ajouter une ligne
                    </Button>
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
                                <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                    Commentaire
                                </th>
                                <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {installments.map((installment, index) => (
                                <tr
                                    key={index}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-4 py-2 text-sm font-medium text-slate-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input
                                            type="date"
                                            value={installment.dueDate}
                                            onChange={(e) =>
                                                updateInstallment(
                                                    index,
                                                    'dueDate',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-36"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={installment.principalPayment}
                                            onChange={(e) =>
                                                updateInstallment(
                                                    index,
                                                    'principalPayment',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-28 text-right"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={installment.interestPayment}
                                            onChange={(e) =>
                                                updateInstallment(
                                                    index,
                                                    'interestPayment',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-28 text-right"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={installment.insurancePayment}
                                            onChange={(e) =>
                                                updateInstallment(
                                                    index,
                                                    'insurancePayment',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-28 text-right"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                        {formatCurrency(installment.totalPayment)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm text-slate-600">
                                        {formatCurrency(installment.remainingBalance)}
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input
                                            type="text"
                                            placeholder="Commentaires…"
                                            value={installment.comments || ''}
                                            onChange={(e) =>
                                                updateInstallment(
                                                    index,
                                                    'comments',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-40"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeInstallment(index)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                            aria-label="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {installments.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <p className="text-sm text-slate-500">
                                            Aucune échéance pour l&apos;instant.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={addNewInstallment}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Ajouter une ligne
                                        </Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <Button
                    variant="outline"
                    onClick={() => setInstallments([])}
                    disabled={installments.length === 0}
                >
                    <Trash2 className="h-4 w-4" />
                    Tout effacer
                </Button>
                <Button
                    onClick={saveLoan}
                    disabled={isLoading}
                    className="bg-primary text-white hover:bg-slate-800"
                >
                    {isLoading ? 'Sauvegarde…' : "Sauvegarder l'emprunt"}
                    <Save className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
