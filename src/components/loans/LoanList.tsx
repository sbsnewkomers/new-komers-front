import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Eye, Edit, Trash2, Calendar, Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Loan, LoanStatus, EntityType } from '@/types/loans';

interface LoanListProps {
    loans: Loan[];
    isLoading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filterStatus: LoanStatus | 'all';
    onFilterStatusChange: (status: LoanStatus | 'all') => void;
    filterEntityType: EntityType | 'all';
    onFilterEntityTypeChange: (type: EntityType | 'all') => void;
    onLoanView: (loanId: string) => void;
    onLoanEdit: (loanId: string) => void;
    onLoanDelete: (loanId: string) => void;
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

export function LoanList({
    loans,
    isLoading,
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterEntityType,
    onFilterEntityTypeChange,
    onLoanView,
    onLoanEdit,
    onLoanDelete
}: LoanListProps) {

    const getEntityTypeIcon = (entityType: string) => {
        switch (entityType) {
            case 'group':
                return <Users className="h-4 w-4" />;
            case 'company':
                return <Building2 className="h-4 w-4" />;
            case 'business unit':
                return <Building2 className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const calculateProgress = (loan: Loan) => {
        if (!loan.createdAt) return 0;
        const created = new Date(loan.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = loan.durationMonths * 30; // Approximation
        return Math.min(100, Math.round((daysSinceCreation / totalDays) * 100));
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Liste des emprunts
                        <span className="text-sm text-muted-foreground ml-2">
                            ({loans.length} emprunt{loans.length > 1 ? 's' : ''})
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Label htmlFor="search">Rechercher</Label>
                        <Input
                            id="search"
                            placeholder="Rechercher par nom ou montant..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select value={filterStatus} onValueChange={(value) => onFilterStatusChange(value as LoanStatus | 'all')}>
                            <option value="all">Tous les statuts</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="PENDING">En attente</option>
                            <option value="SUSPENDED">Suspendu</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="entityType">Type d&apos;entité</Label>
                        <Select value={filterEntityType} onValueChange={(value) => onFilterEntityTypeChange(value as EntityType | 'all')}>
                            <option value="all">Tous les types</option>
                            <option value="group">Groupe</option>
                            <option value="company">Entreprise</option>
                            <option value="business unit">Unité commerciale</option>
                        </Select>
                    </div>
                </div>

                {/* Loans Table */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p>Chargement des emprunts...</p>
                        </div>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">Aucun emprunt trouvé</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Essayez de modifier les filtres ou d&apos;ajouter un nouvel emprunt
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="text-left p-3 font-medium text-gray-700">Emprunt</th>
                                    <th className="text-left p-3 font-medium text-gray-700">Entité</th>
                                    <th className="text-right p-3 font-medium text-gray-700">Capital</th>
                                    <th className="text-right p-3 font-medium text-gray-700">Taux</th>
                                    <th className="text-right p-3 font-medium text-gray-700">Durée</th>
                                    <th className="text-center p-3 font-medium text-gray-700">Statut</th>
                                    <th className="text-center p-3 font-medium text-gray-700">Progression</th>
                                    <th className="text-center p-3 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3">
                                            <div className="max-w-xs">
                                                <div className="font-medium text-gray-900 truncate">{loan.name}</div>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(loan.firstInstallmentDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {getEntityTypeIcon(loan.entityType)}
                                                <span className="text-sm text-gray-600 capitalize">{loan.entityType}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-medium text-gray-900">
                                            {formatCurrency(loan.principalAmount)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {loan.annualInterestRate}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-gray-600">
                                            {loan.durationMonths} mois
                                        </td>
                                        <td className="p-3 text-center">
                                            {getStatusBadge(loan.status)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="w-full">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-500">
                                                        {calculateProgress(loan)}%
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {Math.round(loan.durationMonths * 30 - calculateProgress(loan) * loan.durationMonths * 30 / 100)}j restants
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculateProgress(loan))}`}
                                                        style={{ width: `${calculateProgress(loan)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onLoanView(loan.id)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Voir
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onLoanEdit(loan.id)}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Modifier
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onLoanDelete(loan.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}