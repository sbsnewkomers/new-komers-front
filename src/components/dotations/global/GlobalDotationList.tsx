'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { usePermissions } from '@/permissions/usePermissions';

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

interface GlobalDotationListProps {
  entityType: EntityType;
  entityId: string;
  onEdit?: (dotation: GlobalDotation) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

export function GlobalDotationList({
  entityType,
  entityId,
  onEdit,
  onCreate,
  refreshTrigger,
}: GlobalDotationListProps) {
  const [dotations, setDotations] = useState<GlobalDotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = usePermissions();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        // TODO: Remplacer par l'appel API réel quand disponible
        // const data: GlobalDotation[] = await globalDotationsApi.getAllGlobalDotations(entityType, entityId);
        
        // Données de démonstration pour le moment
        const data: GlobalDotation[] = [
          {
            id: '1',
            year: 2023,
            totalAmount: 45000,
            monthlyAmount: 3750,
            entityType,
            entityId,
            createdById: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            year: 2024,
            totalAmount: 52000,
            monthlyAmount: 4333.33,
            entityType,
            entityId,
            createdById: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            year: 2025,
            totalAmount: 55000,
            monthlyAmount: 4583.33,
            entityType,
            entityId,
            createdById: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        if (isMounted) {
          setDotations(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement des dotations globales');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [entityType, entityId, refreshTrigger, role]);

  const handleDelete = async (dotationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dotation globale ?')) {
      return;
    }

    try {
      // TODO: Remplacer par l'appel API réel
      // await globalDotationsApi.deleteGlobalDotation(dotationId);
      
      // Simuler la suppression
      setDotations(prev => prev.filter(d => d.id !== dotationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dotations Globales - Mode Simplifié</CardTitle>
        {onCreate && (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER' || role === 'HEAD_MANAGER') && (
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle dotation globale
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {dotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune dotation globale trouvée. 
            {onCreate && (
              <div className="mt-2">
                <Button onClick={onCreate} variant="outline">
                  Ajouter votre première dotation globale
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tableau des dotations globales */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Montant total annuel</TableHead>
                    <TableHead>Montant mensuel</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dotations
                    .sort((a, b) => b.year - a.year) // Trier par année décroissante
                    .map((dotation) => {
                      const isCurrentYear = dotation.year === currentYear;
                      const isFutureYear = dotation.year > currentYear;

                      return (
                        <TableRow
                          key={dotation.id}
                          className={
                            isCurrentYear ? 'bg-blue-50 font-semibold' :
                              isFutureYear ? 'text-gray-400' : ''
                          }
                        >
                          <TableCell>
                            {dotation.year}
                            {isCurrentYear && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Année en cours
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(dotation.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(dotation.monthlyAmount)}
                            <div className="text-xs text-gray-500">
                              Réparti sur 12 mois
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(dotation)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(dotation.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {/* Statistiques résumées */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Statistiques des dotations globales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total des dotations</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(dotations.reduce((sum, d) => sum + d.totalAmount, 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dotation {currentYear}</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(
                      dotations.find(d => d.year === currentYear)?.totalAmount || 0
                    )}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Moyenne mensuelle</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(
                      dotations.length > 0 
                        ? dotations.reduce((sum, d) => sum + d.monthlyAmount, 0) / dotations.length
                        : 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
