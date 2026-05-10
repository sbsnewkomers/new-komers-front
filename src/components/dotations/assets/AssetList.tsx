'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { Pencil, Trash2, Eye, Plus, MoreHorizontal, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, AssetStatus, AmortizationType, EntityType } from '@/types/asset.types';
import { usePermissions } from '@/permissions/usePermissions';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { formatCurrencyEUR, formatDateFR } from '@/lib/format';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';

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

const statusVariant: Record<string, BadgeVariant> = {
  [AssetStatus.ACTIVE]: 'success',
  [AssetStatus.FULLY_AMORTIZED]: 'info',
  [AssetStatus.DISPOSED]: 'danger',
};

const statusLabel: Record<string, string> = {
  [AssetStatus.ACTIVE]: 'Actif',
  [AssetStatus.FULLY_AMORTIZED]: 'Totalement amorti',
  [AssetStatus.DISPOSED]: 'Cédé',
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
  const [currentPage, setCurrentPage] = useState(1);
  const { role } = usePermissions();
  const { user } = usePermissionsContext();
  const canManage = user?.role !== 'END_USER';
  const { deleteConfirmOpen, loanToDelete, confirmDelete, cancelDelete, closeDialog } = useDeleteConfirm();
  const itemsPerPage = 10;

  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssets = assets.slice(startIndex, endIndex);

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
      <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nebula-glass rounded-3xl border border-white/10 p-6">
        <div className="text-red-300 text-center">{error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Header with create button */}
      {canManage && onCreate && (
        <div className="flex justify-end">
          <Button
            onClick={onCreate}
            className="h-10 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvel actif
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
        {assets.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <FileText className="h-6 w-6 text-white/30" />
            </div>
            <h3 className="text-sm font-medium text-white">
              Aucun actif trouvé
            </h3>
            <p className="mt-1 text-sm text-(--nebula-muted)">
              Créez votre premier actif.
            </p>
          </div>
        ) : (
          <>
            {/* Pagination info */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sm:px-6">
              <p className="text-sm text-(--nebula-muted)">
                Affichage de {startIndex + 1}-{Math.min(endIndex, assets.length)} sur {assets.length} actif{assets.length > 1 ? 's' : ''}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-(--nebula-muted)">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.6fr_0.8fr_0.8fr_0.8fr_80px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted) sm:px-6">
                  <div>Actif</div>
                  <div className="text-right">Montant d&apos;acquisition</div>
                  <div>Date d&apos;acquisition</div>
                  <div className="text-right">Durée</div>
                  <div>Type d&apos;amortissement</div>
                  <div>Statut</div>
                  <div className="text-right">Valeur nette</div>
                  <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-white/10">
                  {currentAssets.map((asset) => {
                    const currentYear = new Date().getFullYear();
                    const sortedSchedules = asset.amortizationSchedules?.sort((a, b) => a.year - b.year) || [];

                    const netBookValue = sortedSchedules.find(s => s.year === currentYear)?.netBookValue ||
                      sortedSchedules[sortedSchedules.length - 1]?.netBookValue ||
                      asset.acquisitionAmount;

                    return (
                      <div
                        key={asset.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onView?.(asset)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") onView?.(asset);
                        }}
                        className="group grid cursor-pointer grid-cols-[1.5fr_0.8fr_0.8fr_0.6fr_0.8fr_0.8fr_0.8fr_80px] items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 sm:px-6"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {asset.name}
                          </p>
                          {asset.description && (
                            <p className="truncate text-xs text-(--nebula-muted)">{asset.description}</p>
                          )}
                        </div>

                        <div className="text-right text-sm font-medium text-white">
                          {formatCurrency(asset.acquisitionAmount)}
                        </div>

                        <div className="text-sm text-white">
                          {formatDate(asset.acquisitionDate)}
                        </div>

                        <div className="text-right text-sm text-(--nebula-muted)">
                          {asset.amortizationDurationYears} ans
                        </div>

                        <div className="text-sm text-white">
                          {amortizationTypeLabels[asset.amortizationType]}
                        </div>

                        <div>
                          <Badge variant={statusVariant[asset.status] ?? "neutral"}>
                            {statusLabel[asset.status] ?? asset.status}
                          </Badge>
                        </div>

                        <div className="text-right text-sm font-medium text-white">
                          {formatCurrency(netBookValue)}
                        </div>

                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 opacity-100 transition-colors hover:bg-white/10 hover:text-(--nebula-gold-light) md:opacity-0 md:group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onView?.(asset)}>
                                <Eye className="mr-2 h-4 w-4" /> Voir
                              </DropdownMenuItem>
                              {canManage && onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(asset)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => confirmDelete(asset.id)}
                                className="text-red-300 focus:bg-white/10 focus:text-red-200"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pagination controls at bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 sm:px-6">
                <p className="text-sm text-(--nebula-muted)">
                  {assets.length} actif{assets.length > 1 ? 's' : ''} au total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-white/10 rounded-lg bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Première
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                            ? 'bg-white/15 text-white'
                            : 'border border-white/10 bg-white/5  hover:bg-white/10'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-white/10 rounded-lg bg-white/5 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dernière
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
