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
import { formatCurrencyEUR } from '@/lib/format';

// Utility functions
const formatCurrency = (amount: number | string | null | undefined) =>
  formatCurrencyEUR(amount, { fallback: "0,00 €" });

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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-(--nebula-gold-light)" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-300 text-center">{error}</div>
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
          <div className="text-center py-8 text-(--nebula-muted)">
            Aucune dotation globale trouvée.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Affichage groupé par entité */}
            {groupedDotations.map((entityGroup) => (
              <div key={`${entityGroup.entityType}-${entityGroup.entityId}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {entityGroup.entityName}
                  </h3>
                  <div className="text-sm text-(--nebula-muted)">
                    {entityGroup.dotations.length} dotation{entityGroup.dotations.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Tableau des dotations pour cette entité */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-(--nebula-muted) border-white/10">Année</TableHead>
                        <TableHead className="text-(--nebula-muted) border-white/10">Montant total annuel</TableHead>
                        <TableHead className="text-(--nebula-muted) border-white/10">Montant mensuel</TableHead>
                        <TableHead className="text-(--nebula-muted) border-white/10">Validation</TableHead>
                        <TableHead className="text-(--nebula-muted) border-white/10">Actions</TableHead>
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
                                isCurrentYear ? 'bg-sky-500/10 border-white/10 font-semibold' :
                                  isFutureYear ? 'text-white/40 border-white/10' : 'border-white/10'
                              }
                            >
                              <TableCell className="text-white">
                                {dotation.year}
                                {isCurrentYear && (
                                  <span className="ml-2 text-xs border border-sky-400/30 bg-sky-500/15 text-sky-100 px-2 py-1 rounded-lg">
                                    Année en cours
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-white">
                                {formatCurrency(dotation.totalAnnualAmortization || 0)}
                              </TableCell>
                              <TableCell className="text-white">
                                {formatCurrency(dotation.monthlyAmortization || (dotation.totalAnnualAmortization || 0) / 12)}
                                <div className="text-xs text-(--nebula-muted)">
                                  Réparti sur 12 mois
                                </div>
                              </TableCell>
                              <TableCell>
                                {dotation.isValidated ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-emerald-400/30 bg-emerald-500/15 text-emerald-500">
                                    Validée
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-amber-400/30 bg-amber-500/15 text-amber-500">
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
                                      className="text-red-300 hover:text-red-200"
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
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-(--nebula-muted)">Total entité</p>
                      <p className="text-lg font-bold text-emerald-500">
                        {formatCurrency(entityGroup.dotations.reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0))}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-(--nebula-muted)">Dotation {currentYear}</p>
                      <p className="text-lg font-bold text-sky-500">
                        {formatCurrency(
                          entityGroup.dotations
                            .filter(d => d.year === currentYear)
                            .reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-(--nebula-muted)">Validées</p>
                      <p className="text-lg font-bold text-violet-500">
                        {entityGroup.dotations.filter(d => d.isValidated).length} / {entityGroup.dotations.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Statistiques globales */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Statistiques globales</h3>

              {/* Debug des statistiques */}
              {(() => {
                const totalAmount = dotations.reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0);
                const currentYearAmount = dotations
                  .filter(d => d.year === currentYear)
                  .reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0);
                const avgMonthly = dotations.length > 0
                  ? dotations.reduce((sum, d) => sum + (Number(d.monthlyAmortization) || (Number(d.totalAnnualAmortization) || 0) / 12), 0) / dotations.length
                  : 0;

                console.log('Debug statistiques:', {
                  totalDotations: dotations.length,
                  totalAmount,
                  currentYearAmount,
                  avgMonthly,
                  dotations: dotations.map(d => ({
                    year: d.year,
                    totalAnnualAmortization: d.totalAnnualAmortization,
                    monthlyAmortization: d.monthlyAmortization,
                    totalAnnualAmortizationType: typeof d.totalAnnualAmortization,
                    monthlyAmortizationType: typeof d.monthlyAmortization
                  }))
                });

                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-(--nebula-muted)">Total toutes entités</p>
                  <p className="text-xl font-bold text-emerald-500">
                    {formatCurrency(dotations.reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
                  <p className="text-sm text-(--nebula-muted)">Dotation {currentYear}</p>
                  <p className="text-xl font-bold text-sky-500">
                    {formatCurrency(
                      dotations
                        .filter(d => d.year === currentYear)
                        .reduce((sum, d) => sum + (Number(d.totalAnnualAmortization) || 0), 0)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
                  <p className="text-sm text-(--nebula-muted)">Moyenne mensuelle</p>
                  <p className="text-xl font-bold text-violet-500">
                    {formatCurrency(
                      dotations.length > 0
                        ? dotations.reduce((sum, d) => sum + (Number(d.monthlyAmortization) || (Number(d.totalAnnualAmortization) || 0) / 12), 0) / dotations.length
                        : 0
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-(--nebula-muted)">Nombre d&apos;entités</p>
                  <p className="text-xl font-bold text-amber-500">
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
