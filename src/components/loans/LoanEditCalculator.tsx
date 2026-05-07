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
    Calculator,
    Loader2,
} from 'lucide-react';
import { Loan, LoanStatus, LoanInputMethod } from '@/types/loans';
import { loansApi } from '@/lib/loansApi';

interface LoanEditCalculatorProps {
    loanId: string;
    originalMethod: LoanInputMethod;
    onBack: () => void;
    onLoanUpdated: (loan: Loan) => void;
}

export function LoanEditCalculator({ loanId, originalMethod, onBack, onLoanUpdated }: LoanEditCalculatorProps) {
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
                const errorMessage = err instanceof Error ? err.message : 'Failed to load loan';
                const { emitSnackbar } = await import('@/ui/snackbarBus');
                emitSnackbar({
                    message: errorMessage,
                    variant: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadLoan();
    }, [loanId]);

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

            // Always set input method to CALCULATOR when using calculator edit
            updateData.inputMethod = LoanInputMethod.CALCULATOR;

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

            // Update local state with the new loan data
            setLoan(updatedLoan);
            setFormData({
                name: updatedLoan.name,
                principalAmount: updatedLoan.principalAmount.toString(),
                annualInterestRate: updatedLoan.annualInterestRate.toString(),
                durationMonths: updatedLoan.durationMonths.toString(),
                firstInstallmentDate: updatedLoan.firstInstallmentDate,
                monthlyInsuranceCost: updatedLoan.monthlyInsuranceCost.toString(),
                deferralPeriodMonths: updatedLoan.deferralPeriodMonths.toString(),
                status: updatedLoan.status,
            });
            setHasCriticalChanges(false);

            onLoanUpdated(updatedLoan);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update loan';
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: errorMessage,
                variant: 'error'
            });
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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-(--nebula-gold-light)" />
                <span className="ml-2 text-(--nebula-muted)">Chargement du prêt...</span>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="nebula-glass rounded-3xl border border-white/10 p-12">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-300" />
                    </div>
                    <p className="text-sm font-semibold text-white">Emprunt non trouvé</p>
                    <p className="mt-1 text-xs text-(--nebula-muted)">
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
                <div className="nebula-glass nebula-blob flex flex-col gap-4 rounded-3xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                <Calculator className="h-5 w-5 text-(--nebula-gold-light)" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    Modification par calculatrice
                                </h3>
                                <p className="text-xs text-(--nebula-muted)">{loan.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Method Change Warning */}
                {originalMethod !== LoanInputMethod.CALCULATOR && (
                    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
                        <div className="text-sm">
                            <p className="font-semibold text-white">Changement de méthode</p>
                            <p className="mt-0.5 text-xs text-(--nebula-muted)">
                                Vous modifiez ce prêt avec la calculatrice alors qu&apos;il a été créé avec la méthode &quot;{originalMethod}&quot;.
                                L&apos;échéancier sera complètement recalculé.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                        <h3 className="mb-1 text-sm font-semibold text-white">
                            Paramètres du prêt
                        </h3>
                        <p className="mb-5 text-xs text-(--nebula-muted)">
                            Modifier ces paramètres recalculera automatiquement l&apos;échéancier.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="name"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-700">Attention</p>
                                <p className="mt-0.5 text-xs text-(--nebula-muted)">
                                    Vous avez modifié des paramètres qui affectent
                                    l&apos;échéancier de remboursement. La régénération
                                    supprimera les échéances existantes et en créera de
                                    nouvelles.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="nebula-glass flex flex-col gap-3 rounded-3xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <Button type="button" variant="outline" onClick={onBack}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="gap-2"
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
                        <AlertDialogTitle className="flex items-center gap-2 text-red-200">
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
                        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                            <p className="text-xs font-semibold text-white">
                                Conséquences :
                            </p>
                            <ul className="mt-1 list-inside list-disc text-xs text-(--nebula-muted)">
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

                        <p className="text-xs text-(--nebula-muted)">
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
                            variant="destructive"
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
