'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, AssetStatus, AmortizationType, EntityType } from '@/types/asset.types';
import { usePermissions } from '@/permissions/usePermissions';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';

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

interface AssetListProps {
  entityType: EntityType;
  entityId: string;
  onEdit?: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

const statusColors = {
  [AssetStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [AssetStatus.FULLY_AMORTIZED]: 'bg-blue-100 text-blue-800',
  [AssetStatus.DISPOSED]: 'bg-red-100 text-red-800',
};

const amortizationTypeLabels = {
  [AmortizationType.LINEAR]: 'Linéaire',
  [AmortizationType.DEGRESSIVE]: 'Dégressif',
};

export function AssetList({
  entityType,
  entityId,
  onEdit,
  onView,
  onCreate,
  refreshTrigger,
}: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = usePermissions();
  const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        // Utiliser le nouvel endpoint qui filtre selon les permissions
        // Tous les rôles utilisent getAllAssets() qui retourne les actifs selon leurs permissions
        const data: Asset[] = await assetsApi.getAllAssets();

        if (isMounted) {
          setAssets(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement des actifs');
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

  const confirmDeleteAsset = async () => {
    if (!loanToDelete) return;

    try {
      await assetsApi.deleteAsset(loanToDelete);
      setError(null);

      // Remove asset from the list
      setAssets(prev => prev.filter(a => a.id !== loanToDelete));
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actifs</CardTitle>
          {onCreate && (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER' || role === 'HEAD_MANAGER') && (
            <Button onClick={onCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvel actif
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun actif trouvé pour cette entité.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Montant d'acquisition</TableHead>
                  <TableHead>Date d'acquisition</TableHead>
                  <TableHead>Durée d'amortissement</TableHead>
                  <TableHead>Type d'amortissement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Valeur nette comptable actuelle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => {
                  const currentYear = new Date().getFullYear();
                  const sortedSchedules = asset.amortizationSchedules?.sort((a, b) => a.year - b.year) || [];

                  const netBookValue = sortedSchedules.find(s => s.year === currentYear)?.netBookValue ||
                    sortedSchedules[sortedSchedules.length - 1]?.netBookValue ||
                    asset.acquisitionAmount;

                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{asset.name}</div>
                          {asset.description && (
                            <div className="text-sm text-gray-500">{asset.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(asset.acquisitionAmount)}</TableCell>
                      <TableCell>{formatDate(asset.acquisitionDate)}</TableCell>
                      <TableCell>{asset.amortizationDurationYears} ans</TableCell>
                      <TableCell>
                        {amortizationTypeLabels[asset.amortizationType]}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                          {asset.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(netBookValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(asset)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(asset.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={closeDialog}
        onConfirm={confirmDeleteAsset}
        onCancel={cancelDelete}
        itemType="actif"
      />
    </>
  );
}
