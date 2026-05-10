'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AmortizationScheduleDisplay } from '@/components/dotations/assets/AmortizationSchedule';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, EntityType } from '@/types/asset.types';
import { Button } from '@/components/ui/Button';
import { fetchStructureTree, TreeCompany, TreeBU, TreeGroup } from '@/lib/structureApi';
import { formatDateFR } from '@/lib/format';
import { ArrowLeft, Edit3, Building, Calendar, DollarSign, TrendingUp, Package, Settings } from 'lucide-react';

export default function ViewAssetPage() {
  const router = useRouter();
  const { id } = router.query;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityInfo, setEntityInfo] = useState<TreeCompany | TreeBU | TreeGroup | null>(null);

  const fetchEntityInfo = useCallback(async (entityType: EntityType, entityId: string) => {
    try {
      const tree = await fetchStructureTree();
      let entity = null;

      if (entityType === EntityType.COMPANY) {
        const standaloneCompanies = tree?.standaloneCompanies || [];
        entity = standaloneCompanies.find(c => c.id === entityId);

        if (!entity) {
          const workspaceGroupCompanies = tree?.workspaces?.flatMap(w =>
            w.groups.flatMap(g => g.companies)
          ) || [];
          entity = workspaceGroupCompanies.find(c => c.id === entityId);
        }
      } else if (entityType === EntityType.BUSINESS_UNIT) {
        const allCompanies = [
          ...(tree?.standaloneCompanies || []),
          ...(tree?.workspaces?.flatMap(w => w.groups.flatMap(g => g.companies)) || [])
        ];
        for (const company of allCompanies) {
          entity = company.businessUnits.find(bu => bu.id === entityId);
          if (entity) break;
        }
      } else if (entityType === EntityType.GROUP) {
        const groups = tree?.workspaces?.flatMap(w => w.groups) || [];
        entity = groups.find(g => g.id === entityId);
      }

      setEntityInfo(entity || null);
    } catch (error) {
      console.error('Error fetching entity info:', error);
      setEntityInfo(null);
    }
  }, []);


  useEffect(() => {
    const loadAsset = async () => {
      if (id && typeof id === 'string') {
        try {
          setLoading(true);
          const assetData = await assetsApi.getAssetById(id);
          setAsset(assetData);

          if (assetData.entityType && assetData.entityId) {
            await fetchEntityInfo(assetData.entityType, assetData.entityId);
          }
        } catch (error) {
          console.error('Error fetching asset:', error);
          router.push('/dotations/assets');
        } finally {
          setLoading(false);
        }
      }
    };

    loadAsset();
  }, [id, router, fetchEntityInfo]);

  const handleBack = () => {
    router.push('/dotations/assets');
  };

  const handleEdit = () => {
    if (asset) {
      router.push(`/dotations/assets/edit/${asset.id}`);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Visualiser l&apos;actif">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-(--nebula-gold-light)" />
            </div>
            <p className="text-(--nebula-muted) text-lg font-medium">Chargement de l&apos;actif...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout title="Visualiser l&apos;actif">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl border border-red-400/30 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-red-300" />
            </div>
            <p className="text-(--nebula-muted) text-lg font-medium">Actif non trouv&eacute;</p>
            <Button
              onClick={handleBack}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Visualiser: ${asset.name}`}>
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-(--nebula-gold-light)" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{asset.name}</h1>
              <p className="text-(--nebula-muted) text-sm">D&eacute;tails et plan d&apos;amortissement</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleEdit}
              className="w-full sm:w-auto"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Package className="h-4 w-4 text-(--nebula-gold-light)" />
              </div>
              <h2 className="text-lg font-bold text-white">R&eacute;sum&eacute; de l&apos;actif</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <Building className="h-3 w-3" />
                  Nom de l&apos;actif
                </div>
                <p className="text-base font-semibold text-white">{asset.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <Settings className="h-3 w-3" />
                  Entit&eacute; li&eacute;e
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    {entityInfo ? entityInfo.name : 'Chargement...'}
                  </p>
                  {entityInfo && (
                    <span className="text-xs text-(--nebula-muted)">
                      ({asset.entityType === EntityType.COMPANY ? 'Entreprise' :
                        asset.entityType === EntityType.BUSINESS_UNIT ? 'Unité de travail' : 'Groupe'})
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <DollarSign className="h-3 w-3" />
                  Montant d&apos;acquisition
                </div>
                <p className="text-base font-semibold text-white">{asset.acquisitionAmount.toLocaleString('fr-FR')} &euro;</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Date d&apos;acquisition
                </div>
                <p className="text-base font-semibold text-white">{formatDateFR(asset.acquisitionDate, { fallback: "-" })}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Date de mise en service
                </div>
                <p className="text-base font-semibold text-white">
                  {asset.commissioningDate ? formatDateFR(asset.commissioningDate, { fallback: "-" }) : 'Non d&eacute;finie'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Dur&eacute;e d&apos;amortissement
                </div>
                <p className="text-base font-semibold text-white">{asset.amortizationDurationYears} ans</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <Settings className="h-3 w-3" />
                  Type d&apos;amortissement
                </div>
                <p className="text-base font-semibold text-white">{asset.amortizationType === 'LINEAR' ? 'Linéaire' : 'Dégressif'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <DollarSign className="h-3 w-3" />
                  Valeur r&eacute;siduelle
                </div>
                <p className="text-base font-semibold text-white">{asset.residualValue.toLocaleString('fr-FR')} &euro;</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Statut
                </div>
                <p className="text-base font-semibold text-white">
                  {asset.status === 'ACTIVE' ? 'Actif' :
                    asset.status === 'FULLY_AMORTIZED' ? 'Totalement amorti' : 'Cédé'}
                </p>
              </div>

              {asset.disposalDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    Date de cession
                  </div>
                  <p className="text-base font-semibold text-white">{formatDateFR(asset.disposalDate, { fallback: "-" })}</p>
                </div>
              )}

              {asset.disposalAmount && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium">
                    <DollarSign className="h-3 w-3" />
                    Montant de cession
                  </div>
                  <p className="text-base font-semibold text-white">{asset.disposalAmount.toLocaleString('fr-FR')} &euro;</p>
                </div>
              )}
            </div>

            {asset.description && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="flex items-center gap-2 text-(--nebula-muted) text-xs font-medium mb-2">
                  <Package className="h-3 w-3" />
                  Description
                </div>
                <p className="text-white/90 leading-relaxed text-sm">{asset.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl border border-(--nebula-gold-light)/25 bg-(--nebula-gold-light)/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-(--nebula-gold-light)" />
              </div>
              <h2 className="text-lg font-bold text-white">Plan d&apos;amortissement</h2>
            </div>
            <AmortizationScheduleDisplay asset={asset} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
