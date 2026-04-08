import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Loan } from '@/types/loans';

interface LoanOverviewProps {
    loans: Loan[];
    overviewStats?: {
        totalLoans: number;
        activeLoans: number;
        totalPrincipal: number;
        averageRate: number;
    };
    onLoanSelect: (loanId: string) => void;
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

const getStatusBadge = (status: string) => {
    const statusColors = {
        ACTIVE: 'bg-green-100 text-green-800',
        COMPLETED: 'bg-blue-100 text-blue-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
    };

    const statusLabels = {
        ACTIVE: 'Actif',
        COMPLETED: 'Terminé',
        PENDING: 'En attente',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {statusLabels[status as keyof typeof statusLabels]}
        </span>
    );
};

const getMethodBadge = (method: string) => {
    const methodColors = {
        CALCULATOR: 'bg-purple-100 text-purple-800',
        IMPORT: 'bg-orange-100 text-orange-800',
        MANUAL: 'bg-gray-100 text-gray-800',
    };

    const methodLabels = {
        CALCULATOR: 'Calculatrice',
        IMPORT: 'Import',
        MANUAL: 'Manuel',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodColors[method as keyof typeof methodColors]}`}>
            {methodLabels[method as keyof typeof methodLabels]}
        </span>
    );
};

export function LoanOverview({ loans, overviewStats, onLoanSelect }: LoanOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total des emprunts</p>
                                <p className="text-2xl font-bold">{overviewStats?.totalLoans || 0}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Emprunts actifs</p>
                                <p className="text-2xl font-bold">{overviewStats?.activeLoans || 0}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Capital total</p>
                                <p className="text-2xl font-bold">{formatCurrency(overviewStats?.totalPrincipal || 0)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Taux moyen</p>
                                <p className="text-2xl font-bold">{(overviewStats?.averageRate || 0).toFixed(2)}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Loans */}
            <Card>
                <CardHeader>
                    <CardTitle>Emprunts récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loans.slice(0, 5).map((loan) => (
                            <div
                                key={loan.id}
                                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => onLoanSelect(loan.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium">{loan.name}</h4>
                                        {getStatusBadge(loan.status)}
                                        {getMethodBadge(loan.inputMethod)}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                        <div>Capital: {formatCurrency(loan.principalAmount)}</div>
                                        <div>Taux: {loan.annualInterestRate}%</div>
                                        <div>Durée: {loan.durationMonths} mois</div>
                                        <div>Début: {formatDate(loan.firstInstallmentDate)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}