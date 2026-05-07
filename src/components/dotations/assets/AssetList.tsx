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
import { formatCurrencyEUR, formatDateFR } from '@/lib/format';

// Utility functions
const formatCurrency = (amount: number) => formatCurrencyEUR(amount, { fallback: "0,00 €" });

const formatDate = (dateString: string) => formatDateFR(dateString, { fallback: "-" });

interface AssetListProps {
  entityType: EntityType;
  entityId: string;
  onEdit?: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

const statusColors = {
  [AssetStatus.ACTIVE]: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  [AssetStatus.FULLY_AMORTIZED]: 'border border-sky-400/30 bg-sky-500/15 text-sky-100',
  [AssetStatus.DISPOSED]: 'border border-red-400/30 bg-red-500/15 text-red-100',
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
            <div className="text-center py-8 text-(--nebula-muted)">
              Aucun actif trouvé pour cette entité.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-(--nebula-muted) border-white/10">Nom</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Montant d&apos;acquisition</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Date d&apos;acquisition</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Durée d&apos;amortissement</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Type d&apos;amortissement</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Statut</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Valeur nette comptable actuelle</TableHead>
                  <TableHead className="text-(--nebula-muted) border-white/10">Actions</TableHead>
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
                    <TableRow key={asset.id} className="border-white/10">
                      <TableCell className="font-medium text-white">
                        <div>
                          <div>{asset.name}</div>
                          {asset.description && (
                            <div className="text-sm text-(--nebula-muted)">{asset.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{formatCurrency(asset.acquisitionAmount)}</TableCell>
                      <TableCell className="text-white">{formatDate(asset.acquisitionDate)}</TableCell>
                      <TableCell className="text-white">{asset.amortizationDurationYears} ans</TableCell>
                      <TableCell className="text-white">
                        {amortizationTypeLabels[asset.amortizationType]}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                          {asset.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">{formatCurrency(netBookValue)}</TableCell>
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
                            className="text-red-300 hover:text-red-200"
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
