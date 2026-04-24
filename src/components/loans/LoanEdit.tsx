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
    ArrowLeft,
    AlertTriangle,
    Save,
    Pencil,
    Loader2,
} from 'lucide-react';
import { Loan, LoanStatus } from '@/types/loans';
import { loansApi } from '@/lib/loansApi';

interface LoanEditProps {
    loanId: string;
    onBack: () => void;
    onLoanUpdated: (loan: Loan) => void;
    onError: (error: string) => void;
}

export function LoanEdit({ loanId, onBack, onLoanUpdated, onError }: LoanEditProps) {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [hasCriticalChanges, setHasCriticalChanges] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        principalAmount: '',
        annualInterestRate: '',
        durationMonths: '',
        firstInstallmentDate: '',
        monthlyInsuranceCost: '',
        deferralPeriodMonths: '',
        status: '' as LoanStatus,
    });

    useEffect(() => {
        const loadLoan = async () => {
            try {
                const loanData = await loansApi.getLoan(loanId);
                setLoan(loanData);
                setFormData({
                    name: loanData.name,
                    principalAmount: loanData.principalAmount.toString(),
                    annualInterestRate: loanData.annualInterestRate.toString(),
                    durationMonths: loanData.durationMonths.toString(),
                    firstInstallmentDate: loanData.firstInstallmentDate,
                    monthlyInsuranceCost: loanData.monthlyInsuranceCost.toString(),
                    deferralPeriodMonths: loanData.deferralPeriodMonths.toString(),
                    status: loanData.status,
                });
            } catch (err) {
                onError(err instanceof Error ? err.message : 'Failed to load loan');
            } finally {
                setIsLoading(false);
            }
        };

        loadLoan();
    }, [loanId, onError]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (
            loan &&
            [
                'principalAmount',
                'annualInterestRate',
                'durationMonths',
                'firstInstallmentDate',
                'monthlyInsuranceCost',
                'deferralPeriodMonths',
            ].includes(field)
        ) {
            const originalValue = loan[field as keyof Loan]?.toString() || '';
            const newValue = value;

            if (originalValue !== newValue) {
                setHasCriticalChanges(true);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loan) return;

        if (hasCriticalChanges && loan.installments && loan.installments.length > 0) {
            setShowConfirmDialog(true);
            return;
        }

        saveLoan();
    };

    const saveLoan = async (confirmRegeneration: boolean = false) => {
        setIsSaving(true);
        try {
            const updateData: Record<string, string | number | boolean> = {};

            if (loan && formData.name !== loan.name) {
                updateData.name = formData.name;
            }

            if (loan && formData.status !== loan.status) {
                updateData.status = formData.status;
            }

            const criticalFields = [
                'principalAmount',
                'annualInterestRate',
                'durationMonths',
                'firstInstallmentDate',
                'monthlyInsuranceCost',
                'deferralPeriodMonths',
            ];
            let hasCriticalFieldChanges = false;

            if (loan) {
                criticalFields.forEach((field) => {
                    const formValue = formData[field as keyof typeof formData];
                    const loanValue = loan[field as keyof Loan];

                    if (
                        formValue !== undefined &&
                        formValue !== '' &&
                        formValue !== loanValue?.toString()
                    ) {
                        if (
                            field === 'principalAmount' ||
                            field === 'annualInterestRate' ||
                            field === 'monthlyInsuranceCost'
                        ) {
                            updateData[field] = parseFloat(formValue as string);
                        } else if (
                            field === 'durationMonths' ||
                            field === 'deferralPeriodMonths'
                        ) {
                            updateData[field] = parseInt(formValue as string);
                        } else {
                            updateData[field] = formValue;
                        }
                        hasCriticalFieldChanges = true;
                    }
                });
            }

            if (confirmRegeneration || hasCriticalFieldChanges) {
                updateData.confirmScheduleRegeneration = true;
            }

            const updatedLoan = await loansApi.updateLoan(loanId, updateData);

            onLoanUpdated(updatedLoan);
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to update loan');
        } finally {
            setIsSaving(false);
            setShowConfirmDialog(false);
        }
    };

    const handleConfirmRegeneration = () => {
        saveLoan(true);
    };

    const handleCancelRegeneration = () => {
        setShowConfirmDialog(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Chargement des données de l&apos;emprunt…</span>
                </div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Emprunt non trouvé</p>
                    <p className="mt-1 text-xs text-slate-500">
                        L&apos;emprunt demandé n&apos;existe pas ou a été supprimé.
                    </p>
                    <Button onClick={onBack} variant="outline" className="mt-4">
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                <Pencil className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Modifier l&apos;emprunt
                                </h3>
                                <p className="text-xs text-slate-500">{loan.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-1 text-sm font-semibold text-slate-900">
                            Caractéristiques de l&apos;emprunt
                        </h3>
                        <p className="mb-5 text-xs text-slate-500">
                            Modifier les paramètres critiques régénèrera l&apos;échéancier.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="name"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Nom de l&apos;emprunt
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="principalAmount"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Capital emprunté (EUR)
                                </Label>
                                <Input
                                    id="principalAmount"
                                    type="number"
                                    step="0.01"
                                    value={formData.principalAmount}
                                    onChange={(e) =>
                                        handleInputChange('principalAmount', e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="annualInterestRate"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Taux d&apos;intérêt annuel (%)
                                </Label>
                                <Input
                                    id="annualInterestRate"
                                    type="number"
                                    step="0.01"
                                    value={formData.annualInterestRate}
                                    onChange={(e) =>
                                        handleInputChange('annualInterestRate', e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="durationMonths"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Durée (mois)
                                </Label>
                                <Input
                                    id="durationMonths"
                                    type="number"
                                    value={formData.durationMonths}
                                    onChange={(e) =>
                                        handleInputChange('durationMonths', e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="firstInstallmentDate"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Date de première échéance
                                </Label>
                                <Input
                                    id="firstInstallmentDate"
                                    type="date"
                                    value={formData.firstInstallmentDate}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'firstInstallmentDate',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="monthlyInsuranceCost"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Coût mensuel assurance
                                </Label>
                                <Input
                                    id="monthlyInsuranceCost"
                                    type="number"
                                    step="0.01"
                                    value={formData.monthlyInsuranceCost}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'monthlyInsuranceCost',
                                            e.target.value,
                                        )
                                    }
                                    required
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
                                    value={formData.deferralPeriodMonths}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'deferralPeriodMonths',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="status"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Statut
                                </Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleInputChange('status', value)}
                                >
                                    <option value="ACTIVE">Actif</option>
                                    <option value="COMPLETED">Terminé</option>
                                    <option value="SUSPENDED">Suspendu</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {hasCriticalChanges && loan.installments && loan.installments.length > 0 && (
                        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                            <div className="text-sm text-yellow-900">
                                <p className="font-semibold">Attention</p>
                                <p className="mt-0.5 text-xs text-yellow-800">
                                    Vous avez modifié des paramètres qui affectent
                                    l&apos;échéancier de remboursement. La régénération
                                    supprimera les échéances existantes et en créera de
                                    nouvelles.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <Button type="button" variant="outline" onClick={onBack}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-primary text-white hover:bg-slate-800"
                        >
                            {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>

            {/* Regeneration confirm dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Régénérer l&apos;échéancier ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Ce prêt contient déjà{' '}
                            <strong>{loan.installments?.length || 0}</strong> échéance(s). Vos
                            modifications vont régénérer complètement l&apos;échéancier.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 pt-2">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50/80 p-3">
                            <p className="text-xs font-semibold text-yellow-900">
                                Conséquences :
                            </p>
                            <ul className="mt-1 list-inside list-disc text-xs text-yellow-800">
                                <li>Suppression de toutes les échéances existantes</li>
                                <li>
                                    Création d&apos;un nouvel échéancier avec les nouveaux
                                    paramètres
                                </li>
                                <li>
                                    Perte de l&apos;historique des paiements enregistrés
                                </li>
                            </ul>
                        </div>

                        <p className="text-xs text-slate-500">
                            Voulez-vous continuer et régénérer l&apos;échéancier ?
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelRegeneration}
                            disabled={isSaving}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirmRegeneration}
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Régénération…' : "Régénérer l'échéancier"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
