import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Loan, LoanStatistics } from '@/types/loans';
import { entitiesApi } from '@/lib/entitiesApi';
import { fetchUser } from '@/lib/usersApi';

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
    const [entityName, setEntityName] = useState<string>('');
    const [creatorName, setCreatorName] = useState<string>('');

    useEffect(() => {
        const fetchEntityName = async () => {
            try {
                const name = await entitiesApi.getEntityName(loan.entityType, loan.entityId);
                setEntityName(name);
            } catch (error) {
                console.error('Erreur lors de la récupération du nom de l\'entité:', error);
                setEntityName(`${loan.entityType} #${loan.entityId.slice(0, 8)}...`);
            }
        };

        const fetchCreatorName = async () => {
            try {
                const user = await fetchUser(loan.createdById);
                const fullName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || loan.createdById;
                setCreatorName(fullName);
            } catch (error) {
                console.error('Erreur lors de la récupération du nom de l\'utilisateur:', error);
                setCreatorName(loan.createdById);
            }
        };

        if (loan.entityType && loan.entityId) {
            fetchEntityName();
        }

        if (loan.createdById) {
            fetchCreatorName();
        }
    }, [loan.entityType, loan.entityId, loan.createdById]);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Nom du prêt</Label>
                            <p className="text-lg font-semibold">{loan.name}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Capital emprunté</Label>
                            <p className="text-lg font-semibold">{formatCurrency(loan.principalAmount)}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Taux d&apos;intérêt annuel</Label>
                            <p className="text-lg font-semibold">{loan.annualInterestRate}%</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Durée</Label>
                            <p className="text-lg font-semibold">{loan.durationMonths} mois</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Date de première échéance</Label>
                            <p className="text-lg font-semibold">{formatDate(loan.firstInstallmentDate)}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Coût mensuel assurance</Label>
                            <p className="text-lg font-semibold">{formatCurrency(loan.monthlyInsuranceCost)}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Période de différé</Label>
                            <p className="text-lg font-semibold">{loan.deferralPeriodMonths} mois</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                            <p className="text-lg font-semibold">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    loan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                        loan.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {loan.status === 'ACTIVE' ? 'Actif' :
                                        loan.status === 'COMPLETED' ? 'Terminé' :
                                            loan.status === 'SUSPENDED' ? 'Suspendu' :
                                                loan.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Mensualité totale</Label>
                            <p className="text-lg font-semibold">
                                {loan.installments && loan.installments.length > 0
                                    ? formatCurrency(loan.installments[0].totalPayment)
                                    : 'Non calculée'
                                }
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Type d&apos;entité</Label>
                            <p className="text-lg font-semibold">{loan.entityType}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Nom de l&apos;entité</Label>
                            <p className="text-lg font-semibold">{entityName || 'Chargement...'}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
                            <p className="text-lg font-semibold">{loan.createdAt ? formatDate(loan.createdAt) : 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Dernière modification</Label>
                            <p className="text-lg font-semibold">{loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Nombre d&apos;échéances</Label>
                            <p className="text-lg font-semibold">{loan.installments ? loan.installments.length : 0}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Échéances payées</Label>
                            <p className="text-lg font-semibold">
                                {loan.installments ? loan.installments.filter(i => i.isPaid).length : 0}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Méthode de saisie</Label>
                            <p className="text-lg font-semibold">
                                {loan.inputMethod === 'CALCULATOR' ? 'Calculatrice' :
                                    loan.inputMethod === 'IMPORT' ? 'Importation' :
                                        loan.inputMethod === 'MANUAL' ? 'Manuelle' :
                                            loan.inputMethod}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Créé par</Label>
                            <p className="text-lg font-semibold">{creatorName || 'Chargement...'}</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Intérêts payés</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalInterestPaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Assurance payée</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalInsurancePaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Capital remboursé</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalPrincipalPaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Solde restant</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.currentRemainingBalance)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Échéances restantes</Label>
                                <p className="text-lg font-semibold">{loanStats.remainingInstallments}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Date de fin prévue</Label>
                                <p className="text-lg font-semibold">{loanStats.projectedEndDate ? formatDate(loanStats.projectedEndDate) : 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Total payé</Label>
                                <p className="text-lg font-semibold">{formatCurrency(loanStats.totalInterestPaid + loanStats.totalInsurancePaid + loanStats.totalPrincipalPaid)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Progression</Label>
                                <p className="text-lg font-semibold">
                                    {loan.principalAmount > 0
                                        ? `${Math.round((loanStats.totalPrincipalPaid / loan.principalAmount) * 100)}%`
                                        : '0%'
                                    }
                                </p>
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
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left p-2">Numéro d&apos;échéance</th>
                                        <th className="text-left p-2">Date d&apos;échéance</th>
                                        <th className="text-right p-2">Paiement du capital</th>
                                        <th className="text-right p-2">Paiement des intérêts</th>
                                        <th className="text-right p-2">Paiement de l&apos;assurance</th>
                                        <th className="text-right p-2">Paiement total</th>
                                        <th className="text-right p-2">Solde restant</th>
                                        <th className="text-center p-2">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.installments.map((installment) => (
                                        <tr key={installment.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{installment.installmentNumber}</td>
                                            <td className="p-2">{formatDate(installment.dueDate)}</td>
                                            <td className="p-2 text-right">{formatCurrency(installment.principalPayment)}</td>
                                            <td className="p-2 text-right">{formatCurrency(installment.interestPayment)}</td>
                                            <td className="p-2 text-right">{formatCurrency(installment.insurancePayment)}</td>
                                            <td className="p-2 text-right font-semibold">{formatCurrency(installment.totalPayment)}</td>
                                            <td className="p-2 text-right">{formatCurrency(installment.remainingBalance)}</td>
                                            <td className="p-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${installment.isPaid
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {installment.isPaid ? 'Payé' : 'En attente'}
                                                </span>
                                            </td>
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