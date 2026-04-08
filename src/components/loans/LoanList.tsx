import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Eye, Edit, Trash2 } from 'lucide-react';
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
    return (
        <Card>
            <CardHeader>
                <CardTitle>Liste des emprunts</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Label htmlFor="search">Rechercher</Label>
                        <Input
                            id="search"
                            placeholder="Rechercher un emprunt..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select value={filterStatus} onValueChange={(value) => onFilterStatusChange(value as LoanStatus | 'all')}>
                            <option value="all">Tous les statuts</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="PENDING">En attente</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="entityType">Type d&apos;entité</Label>
                        <Select value={filterEntityType} onValueChange={(value) => onFilterEntityTypeChange(value as EntityType | 'all')}>
                            <option value="all">Tous les types</option>
                            <option value="PERSON">Personne</option>
                            <option value="GROUP">Groupe</option>
                            <option value="COMPANY">Entreprise</option>
                        </Select>
                    </div>
                </div>

                {/* Loans Table */}
                {isLoading ? (
                    <div className="text-center py-8">
                        <p>Chargement des emprunts...</p>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Aucun emprunt trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Nom</th>
                                    <th className="text-left p-2">Capital</th>
                                    <th className="text-left p-2">Taux</th>
                                    <th className="text-left p-2">Durée</th>
                                    <th className="text-left p-2">Statut</th>
                                    <th className="text-left p-2">Méthode</th>
                                    <th className="text-left p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">
                                            <div>
                                                <div className="font-medium">{loan.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(loan.firstInstallmentDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2">{formatCurrency(loan.principalAmount)}</td>
                                        <td className="p-2">{loan.annualInterestRate}%</td>
                                        <td className="p-2">{loan.durationMonths} mois</td>
                                        <td className="p-2">{getStatusBadge(loan.status)}</td>
                                        <td className="p-2">{getMethodBadge(loan.inputMethod)}</td>
                                        <td className="p-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onLoanView(loan.id)}
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onLoanEdit(loan.id)}
                                                    title="Modifier"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onLoanDelete(loan.id)}
                                                    title="Supprimer"
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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