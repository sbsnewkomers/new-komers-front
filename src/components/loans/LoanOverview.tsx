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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total des emprunts</p>
                            <p className="text-2xl font-bold text-blue-900">{overviewStats?.totalLoans || 0}</p>
                        </div>
                        <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        {overviewStats?.activeLoans || 0} actifs
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Emprunts actifs</p>
                            <p className="text-2xl font-bold text-green-900">{overviewStats?.activeLoans || 0}</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                        {overviewStats?.totalLoans ? Math.round(((overviewStats?.activeLoans || 0) / (overviewStats?.totalLoans || 1)) * 100) : 0}% actifs
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Capital total</p>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(overviewStats?.totalPrincipal || 0)}</p>
                        </div>
                        <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                        {overviewStats?.totalLoans ? formatCurrency((overviewStats?.totalPrincipal || 0) / (overviewStats?.totalLoans || 1)) : '0'} par prêt
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 font-medium">Taux moyen</p>
                            <p className="text-2xl font-bold text-orange-900">{(overviewStats?.averageRate || 0).toFixed(2)}%</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                        {overviewStats?.totalLoans ? ((overviewStats?.averageRate || 0) * 12).toFixed(2) : '0'}% annuel
                    </div>
                </div>
            </div>

            {/* Recent Loans */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Emprunts récents
                        <span className="text-sm text-muted-foreground ml-2">
                            ({loans.length} prêt{loans.length > 1 ? 's' : ''})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loans.slice(0, 5).map((loan) => (
                            <div
                                key={loan.id}
                                className="group border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-white"
                                onClick={() => onLoanSelect(loan.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {loan.name}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(loan.status)}
                                                {getMethodBadge(loan.inputMethod)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">Capital:</span>
                                                <span>{formatCurrency(loan.principalAmount)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">Taux:</span>
                                                <span>{loan.annualInterestRate}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">Durée:</span>
                                                <span>{loan.durationMonths} mois</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">Début:</span>
                                                <span>{formatDate(loan.firstInstallmentDate)}</span>
                                            </div>
                                        </div>
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