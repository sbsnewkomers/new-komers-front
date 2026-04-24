'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Pencil, Trash2, Plus, Eye } from 'lucide-react';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { globalDotationsApi } from '@/lib/globalDotationsApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { usePermissions } from '@/permissions/usePermissions';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';

// Utility functions
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) {
    return '0,00 €';
  }

  // Convertir en nombre si c'est une chaîne
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    console.warn('Valeur invalide pour formatCurrency:', amount);
    return '0,00 €';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(numericAmount);
};

interface GlobalDotationListProps {
  entityType: EntityType;
  entityId: string;
  onEdit?: (dotation: GlobalDotation) => void;
  onView?: (dotation: GlobalDotation) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

export function GlobalDotationList({
  entityType,
  entityId,
  onEdit,
  onView,
  onCreate,
  refreshTrigger,
}: GlobalDotationListProps) {
  const [dotations, setDotations] = useState<GlobalDotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dotationToDelete, setDotationToDelete] = useState<string | null>(null);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        const data: GlobalDotation[] = await globalDotationsApi.getAllGlobalDotations(entityType, entityId);

        // Charger les noms des entités
        const uniqueEntities = [...new Set(data.map(d => `${d.entityType}-${d.entityId}`))];
        console.log('Entités uniques trouvées:', uniqueEntities);

        const names: Record<string, string> = {};

        // Validation simple du format UUID
        const isValidUUID = (id: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        // Tester un appel API manuellement
        if (uniqueEntities.length > 0) {
          const testKey = uniqueEntities[0];
          const testParts = testKey.split('-');
          const testEntityType = testParts[0];
          const testEntityId = testParts.slice(1).join('-');
          console.log('Test manuel:', { testEntityType, testEntityId, isValidUUID: isValidUUID(testEntityId) });

          if (isValidUUID(testEntityId)) {
            try {
              const testName = await entitiesApi.getEntityName(testEntityType, testEntityId);
              console.log('Test API réussi, nom:', testName);
            } catch (testError) {
              console.error('Test API échoué:', testError);
            }
          }
        }

        for (const entityKey of uniqueEntities) {
          const parts = entityKey.split('-');
          const entityType = parts[0];
          const entityId = parts.slice(1).join('-'); // Joindre toutes les parties restantes pour reconstruire l'UUID complet

          console.log('Traitement entité:', { entityKey, entityType, entityId, isValidUUID: isValidUUID(entityId) });

          // Ne tenter de récupérer le nom que si c'est un UUID valide
          if (isValidUUID(entityId)) {
            try {
              console.log('Tentative de récupération du nom pour:', entityType, entityId);
              const name = await entitiesApi.getEntityName(entityType, entityId);
              console.log('Nom récupéré:', name);
              names[entityKey] = name;
            } catch (error) {
              console.error('Erreur lors de la récupération du nom:', error);
              names[entityKey] = `${entityType} #${entityId.slice(0, 8)}...`;
            }
          } else {
            // Si ce n'est pas un UUID, utiliser le nom généré
            console.log('UUID non valide, utilisation du nom généré pour:', entityType, entityId);
            names[entityKey] = `${entityType} #${entityId.slice(0, 8)}...`;
          }
        }

        console.log('Noms finaux:', names);

        if (isMounted) {
          setDotations(data);
          setEntityNames(names);
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

  const handleDeleteClick = (dotationId: string) => {
    setDotationToDelete(dotationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dotationToDelete) return;

    try {
      await globalDotationsApi.deleteGlobalDotation(dotationToDelete);

      // Mettre à jour la liste locale après suppression
      setDotations(prev => prev.filter(d => d.id !== dotationToDelete));
      setDeleteDialogOpen(false);
      setDotationToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setDeleteDialogOpen(false);
      setDotationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDotationToDelete(null);
  };

  const currentYear = new Date().getFullYear();

  // Grouper les dotations par entité
  const groupDotationsByEntity = (dotations: GlobalDotation[]) => {
    const grouped: Record<string, {
      entityType: EntityType;
      entityId: string;
      entityName: string;
      dotations: GlobalDotation[]
    }> = {};

    dotations.forEach(dotation => {
      const key = `${dotation.entityType}-${dotation.entityId}`;
      if (!grouped[key]) {
        grouped[key] = {
          entityType: dotation.entityType,
          entityId: dotation.entityId,
          entityName: entityNames[key] || `${dotation.entityType} #${dotation.entityId.slice(0, 8)}...`,
          dotations: []
        };
      }
      grouped[key].dotations.push(dotation);
    });

    return Object.values(grouped);
  };

  const groupedDotations = groupDotationsByEntity(dotations);

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
          </div>
        ) : (
          <div className="space-y-8">
            {/* Affichage groupé par entité */}
            {groupedDotations.map((entityGroup) => (
              <div key={`${entityGroup.entityType}-${entityGroup.entityId}`} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {entityGroup.entityName}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {entityGroup.dotations.length} dotation{entityGroup.dotations.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Tableau des dotations pour cette entité */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Année</TableHead>
                        <TableHead>Montant total annuel</TableHead>
                        <TableHead>Montant mensuel</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entityGroup.dotations
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
                                {formatCurrency(dotation.totalAmount || 0)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(dotation.monthlyAmount || (dotation.totalAmount || 0) / 12)}
                                <div className="text-xs text-gray-500">
                                  Réparti sur 12 mois
                                </div>
                              </TableCell>
                              <TableCell>
                                {dotation.isValidated ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Validée
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    En attente
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {onView && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onView(dotation)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onEdit && role !== 'END_USER' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEdit(dotation)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {role !== 'END_USER' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteClick(dotation.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>

                {/* Statistiques pour cette entité */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Total entité</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(entityGroup.dotations.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Dotation {currentYear}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(
                          entityGroup.dotations
                            .filter(d => d.year === currentYear)
                            .reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Validées</p>
                      <p className="text-lg font-bold text-purple-600">
                        {entityGroup.dotations.filter(d => d.isValidated).length} / {entityGroup.dotations.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Statistiques globales */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques globales</h3>

              {/* Debug des statistiques */}
              {(() => {
                const totalAmount = dotations.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
                const currentYearAmount = dotations
                  .filter(d => d.year === currentYear)
                  .reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
                const avgMonthly = dotations.length > 0
                  ? dotations.reduce((sum, d) => sum + (Number(d.monthlyAmount) || (Number(d.totalAmount) || 0) / 12), 0) / dotations.length
                  : 0;

                console.log('Debug statistiques:', {
                  totalDotations: dotations.length,
                  totalAmount,
                  currentYearAmount,
                  avgMonthly,
                  dotations: dotations.map(d => ({
                    year: d.year,
                    totalAmount: d.totalAmount,
                    monthlyAmount: d.monthlyAmount,
                    totalAmountType: typeof d.totalAmount,
                    monthlyAmountType: typeof d.monthlyAmount
                  }))
                });

                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total toutes entités</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(dotations.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dotation {currentYear}</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(
                      dotations
                        .filter(d => d.year === currentYear)
                        .reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
                    )}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Moyenne mensuelle</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(
                      dotations.length > 0
                        ? dotations.reduce((sum, d) => sum + (Number(d.monthlyAmount) || (Number(d.totalAmount) || 0) / 12), 0) / dotations.length
                        : 0
                    )}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Nombre d&apos;entités</p>
                  <p className="text-xl font-bold text-orange-600">
                    {groupedDotations.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        itemType="dotation"
      />
    </Card>
  );
}
