import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Loan, LoanStatistics } from '@/types/loans';

interface LoanDetailsProps {
    loan: Loan;
    loanStats?: LoanStatistics | null;
    onBack: () => void;
    onEdit: (loanId: string) => void;
    onDelete: (loanId: string) => void;
}

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
};

export function LoanDetails({ loan, loanStats, onBack, onEdit, onDelete }: LoanDetailsProps) {
    return (
        <div className="space-y-6">
            {/* Loan Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {loan.name}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onEdit(loan.id)}>
                                    Modifier
                                </Button>
                                <Button variant="destructive" onClick={() => onDelete(loan.id)}>
                                    Supprimer
                                </Button>
                            </div>
                        </div>
                        <Button variant="outline" onClick={onBack}>
                            Retour
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Capital emprunté</Label>
                            <p className="text-lg font-semibold">{formatCurrency(loan.principalAmount)}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Taux d&apos;intérêt</Label>
                            <p className="text-lg font-semibold">{loan.annualInterestRate}%</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Durée</Label>
                            <p className="text-lg font-semibold">{loan.durationMonths} mois</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Date de début</Label>
                            <p className="text-lg font-semibold">{formatDate(loan.firstInstallmentDate)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loanStats && (
                <Card>
                    <CardHeader>
                        <CardTitle>Statistiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Intérêts payés</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalInterestPaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Capital remboursé</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalPrincipalPaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Solde restant</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.currentRemainingBalance)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loan.installments && loan.installments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Échéancier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">N°</th>
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-left p-2">Capital</th>
                                        <th className="text-left p-2">Intérêts</th>
                                        <th className="text-left p-2">Total</th>
                                        <th className="text-left p-2">Solde restant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.installments.map((installment) => (
                                        <tr key={installment.id} className="border-b">
                                            <td className="p-2">{installment.installmentNumber}</td>
                                            <td className="p-2">{formatDate(installment.dueDate)}</td>
                                            <td className="p-2">{formatCurrency(installment.principalPayment)}</td>
                                            <td className="p-2">{formatCurrency(installment.interestPayment)}</td>
                                            <td className="p-2">{formatCurrency(installment.totalPayment)}</td>
                                            <td className="p-2">{formatCurrency(installment.remainingBalance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}