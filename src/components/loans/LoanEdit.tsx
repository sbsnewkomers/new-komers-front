import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/AlertDialog';
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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Détecter les modifications critiques qui nécessitent une régénération d'échéancier
        if (loan && ['principalAmount', 'annualInterestRate', 'durationMonths', 'firstInstallmentDate', 'monthlyInsuranceCost', 'deferralPeriodMonths'].includes(field)) {
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

        // Vérifier si le prêt a des échéances existantes et s'il y a des modifications critiques
        if (hasCriticalChanges && loan.installments && loan.installments.length > 0) {
            setShowConfirmDialog(true);
            return;
        }

        saveLoan();
    };

    const saveLoan = async (confirmRegeneration: boolean = false) => {
        setIsSaving(true);
        try {
            // Ne envoyer que les champs qui ont été modifiés
            const updateData: Record<string, string | number | boolean> = {};

            // Toujours envoyer le nom et le statut s'ils sont différents
            if (loan && formData.name !== loan.name) {
                updateData.name = formData.name;
            }

            if (loan && formData.status !== loan.status) {
                updateData.status = formData.status;
            }

            // Vérifier les champs critiques
            const criticalFields = ['principalAmount', 'annualInterestRate', 'durationMonths', 'firstInstallmentDate', 'monthlyInsuranceCost', 'deferralPeriodMonths'];
            let hasCriticalFieldChanges = false;

            if (loan) {
                criticalFields.forEach(field => {
                    const formValue = formData[field as keyof typeof formData];
                    const loanValue = loan[field as keyof Loan];

                    if (formValue !== undefined && formValue !== '' && formValue !== loanValue?.toString()) {
                        if (field === 'principalAmount' || field === 'annualInterestRate' || field === 'monthlyInsuranceCost') {
                            updateData[field] = parseFloat(formValue as string);
                        } else if (field === 'durationMonths' || field === 'deferralPeriodMonths') {
                            updateData[field] = parseInt(formValue as string);
                        } else {
                            updateData[field] = formValue;
                        }
                        hasCriticalFieldChanges = true;
                    }
                });
            }

            // Ajouter la confirmation de régénération si nécessaire
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
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <p>Chargement des données de l&apos;emprunt...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!loan) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <p className="text-red-600">Emprunt non trouvé</p>
                        <Button onClick={onBack} className="mt-4">
                            Retour
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Modifier l&apos;emprunt
                        <Button variant="outline" onClick={onBack}>
                            Retour
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="name">Nom de l&apos;emprunt</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="principalAmount">Capital emprunté </Label>
                                <Input
                                    id="principalAmount"
                                    type="number"
                                    step="0.01"
                                    value={formData.principalAmount}
                                    onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="annualInterestRate">Taux d&apos;intérêt annuel (%)</Label>
                                <Input
                                    id="annualInterestRate"
                                    type="number"
                                    step="0.01"
                                    value={formData.annualInterestRate}
                                    onChange={(e) => handleInputChange('annualInterestRate', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="durationMonths">Durée (mois)</Label>
                                <Input
                                    id="durationMonths"
                                    type="number"
                                    value={formData.durationMonths}
                                    onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="firstInstallmentDate">Date de première échéance</Label>
                                <Input
                                    id="firstInstallmentDate"
                                    type="date"
                                    value={formData.firstInstallmentDate}
                                    onChange={(e) => handleInputChange('firstInstallmentDate', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="monthlyInsuranceCost">Coût mensuel assurance </Label>
                                <Input
                                    id="monthlyInsuranceCost"
                                    type="number"
                                    step="0.01"
                                    value={formData.monthlyInsuranceCost}
                                    onChange={(e) => handleInputChange('monthlyInsuranceCost', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="deferralPeriodMonths">Période de différé (mois)</Label>
                                <Input
                                    id="deferralPeriodMonths"
                                    type="number"
                                    value={formData.deferralPeriodMonths}
                                    onChange={(e) => handleInputChange('deferralPeriodMonths', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="status">Statut</Label>
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

                        {hasCriticalChanges && loan.installments && loan.installments.length > 0 && (
                            <div className="p-4 mb-4 rounded-lg border bg-yellow-50 border-yellow-200">
                                <div className="text-sm text-yellow-800">
                                    <strong>Attention:</strong> Vous avez modifié des paramètres qui affectent l&#39;échéancier de remboursement.
                                    La régénération supprimera les échéances existantes et en créera de nouvelles.
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </Button>
                            <Button type="button" variant="outline" onClick={onBack}>
                                Annuler
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Boîte de dialogue de confirmation */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Confirmation requise</AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-4">
                                <p>
                                    <strong>Attention:</strong> Ce prêt contient déjà {loan.installments?.length || 0} échéance(s).
                                </p>
                                <p>
                                    Les modifications que vous avez apportées aux paramètres du prêt vont régénérer complètement l&apos;échéancier.
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Conséquences:</strong>
                                    </p>
                                    <ul className="text-sm text-yellow-800 list-disc list-inside mt-1">
                                        <li>Suppression de toutes les échéances existantes</li>
                                        <li>Création d&apos;un nouvel échéancier avec les nouveaux paramètres</li>
                                        <li>Perte de l&apos;historique des paiements enregistrés</li>
                                    </ul>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Voulez-vous continuer et régénérer l&apos;échéancier ?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            onClick={handleConfirmRegeneration}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Régénération...' : 'Régénérer l\'échéancier'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelRegeneration}
                            disabled={isSaving}
                        >
                            Annuler
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
