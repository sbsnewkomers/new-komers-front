'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AmortizationScheduleDisplay } from '@/components/dotations/assets/AmortizationSchedule';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, EntityType } from '@/types/asset.types';
import { Button } from '@/components/ui/Button';
import { fetchStructureTree, TreeCompany, TreeBU, TreeGroup } from '@/lib/structureApi';
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
        // Chercher dans les entreprises autonomes
        const standaloneCompanies = tree?.standaloneCompanies || [];
        entity = standaloneCompanies.find(c => c.id === entityId);

        // Si pas trouvé, chercher dans les groupes des workspaces
        if (!entity) {
          const workspaceGroupCompanies = tree?.workspaces?.flatMap(w =>
            w.groups.flatMap(g => g.companies)
          ) || [];
          entity = workspaceGroupCompanies.find(c => c.id === entityId);
        }
      } else if (entityType === EntityType.BUSINESS_UNIT) {
        // Chercher dans toutes les unités de travail
        const allCompanies = [
          ...(tree?.standaloneCompanies || []),
          ...(tree?.workspaces?.flatMap(w => w.groups.flatMap(g => g.companies)) || [])
        ];
        for (const company of allCompanies) {
          entity = company.businessUnits.find(bu => bu.id === entityId);
          if (entity) break;
        }
      } else if (entityType === EntityType.GROUP) {
        // Chercher dans les groupes des workspaces
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

          // Récupérer les informations de l'entité liée
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
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-lg font-medium">Chargement de l&apos;actif...</p>
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
            <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-slate-600 text-lg font-medium">Actif non trouv&eacute;</p>
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{asset.name}</h1>
              <p className="text-slate-600 text-sm">D&eacute;tails et plan d&apos;amortissement</p>
            </div>
          </div>

          {/* Actions */}
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
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Asset Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">R&eacute;sum&eacute; de l&apos;actif</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Building className="h-3 w-3" />
                  Nom de l&apos;actif
                </div>
                <p className="text-base font-semibold text-slate-900">{asset.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Settings className="h-3 w-3" />
                  Entit&eacute; li&eacute;e
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {entityInfo ? entityInfo.name : 'Chargement...'}
                  </p>
                  {entityInfo && (
                    <span className="text-xs text-slate-500">
                      ({asset.entityType === EntityType.COMPANY ? 'Entreprise' :
                        asset.entityType === EntityType.BUSINESS_UNIT ? 'Unité de travail' : 'Groupe'})
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <DollarSign className="h-3 w-3" />
                  Montant d&apos;acquisition
                </div>
                <p className="text-base font-semibold text-slate-900">{asset.acquisitionAmount.toLocaleString('fr-FR')} &euro;</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Date d&apos;acquisition
                </div>
                <p className="text-base font-semibold text-slate-900">{new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Date de mise en service
                </div>
                <p className="text-base font-semibold text-slate-900">
                  {asset.commissioningDate ? new Date(asset.commissioningDate).toLocaleDateString('fr-FR') : 'Non d&eacute;finie'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Dur&eacute;e d&apos;amortissement
                </div>
                <p className="text-base font-semibold text-slate-900">{asset.amortizationDurationYears} ans</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Settings className="h-3 w-3" />
                  Type d&apos;amortissement
                </div>
                <p className="text-base font-semibold text-slate-900">{asset.amortizationType === 'LINEAR' ? 'Linéaire' : 'Dégressif'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <DollarSign className="h-3 w-3" />
                  Valeur r&eacute;siduelle
                </div>
                <p className="text-base font-semibold text-slate-900">{asset.residualValue.toLocaleString('fr-FR')} &euro;</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Statut
                </div>
                <p className="text-base font-semibold text-slate-900">
                  {asset.status === 'ACTIVE' ? 'Actif' :
                    asset.status === 'FULLY_AMORTIZED' ? 'Totalement amorti' : 'C&eacute;d&eacute;'}
                </p>
              </div>

              {asset.disposalDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    Date de cession
                  </div>
                  <p className="text-base font-semibold text-slate-900">{new Date(asset.disposalDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              {asset.disposalAmount && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                    <DollarSign className="h-3 w-3" />
                    Montant de cession
                  </div>
                  <p className="text-base font-semibold text-slate-900">{asset.disposalAmount.toLocaleString('fr-FR')} &euro;</p>
                </div>
              )}
            </div>

            {asset.description && (
              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-2">
                  <Package className="h-3 w-3" />
                  Description
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">{asset.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amortization Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Plan d&apos;amortissement</h2>
            </div>
            <AmortizationScheduleDisplay asset={asset} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
