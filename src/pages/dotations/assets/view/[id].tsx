'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AmortizationScheduleDisplay } from '@/components/dotations/assets/AmortizationSchedule';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, EntityType } from '@/types/asset.types';
import { Button } from '@/components/ui/Button';
import { fetchStructureTree, TreeCompany, TreeBU, TreeGroup } from '@/lib/structureApi';

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
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Chargement de l&apos;actif...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout title="Visualiser l&apos;actif">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Actif non trouv&eacute;</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Visualiser: ${asset.name}`}>
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
              <p className="text-gray-600 mt-2">
                D&eacute;tails et plan d&apos;amortissement
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:space-x-4 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleBack}
                className="w-full sm:w-auto"
              >
                Retour
              </Button>
              <Button
                onClick={handleEdit}
                className="w-full sm:w-auto"
              >
                Modifier
              </Button>
            </div>
          </div>

          {/* Asset Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">R&eacute;sum&eacute; de l&apos;actif</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom de l&apos;actif</p>
                <p className="text-lg font-medium">{asset.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Entit&eacute; li&eacute;e</p>
                <p className="text-lg font-medium">
                  {entityInfo ? entityInfo.name : 'Chargement...'}
                  {entityInfo && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({asset.entityType === EntityType.COMPANY ? 'Entreprise' :
                        asset.entityType === EntityType.BUSINESS_UNIT ? 'Unité de travail' : 'Groupe'})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant d&apos;acquisition</p>
                <p className="text-lg font-medium">{asset.acquisitionAmount.toLocaleString('fr-FR')} &euro;</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d&apos;acquisition</p>
                <p className="text-lg font-medium">{new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de mise en service</p>
                <p className="text-lg font-medium">
                  {asset.commissioningDate ? new Date(asset.commissioningDate).toLocaleDateString('fr-FR') : 'Non d&eacute;finie'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dur&eacute;e d&apos;amortissement</p>
                <p className="text-lg font-medium">{asset.amortizationDurationYears} ans</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type d&apos;amortissement</p>
                <p className="text-lg font-medium">{asset.amortizationType === 'LINEAR' ? 'Linéaire' : 'Dégressif'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valeur r&eacute;siduelle</p>
                <p className="text-lg font-medium">{asset.residualValue.toLocaleString('fr-FR')} &euro;</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="text-lg font-medium">
                  {asset.status === 'ACTIVE' ? 'Actif' :
                    asset.status === 'FULLY_AMORTIZED' ? 'Totalement amorti' : 'C&eacute;d&eacute;'}
                </p>
              </div>
              {asset.disposalDate && (
                <div>
                  <p className="text-sm text-gray-600">Date de cession</p>
                  <p className="text-lg font-medium">{new Date(asset.disposalDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {asset.disposalAmount && (
                <div>
                  <p className="text-sm text-gray-600">Montant de cession</p>
                  <p className="text-lg font-medium">{asset.disposalAmount.toLocaleString('fr-FR')} &euro;</p>
                </div>
              )}
            </div>
            {asset.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-base">{asset.description}</p>
              </div>
            )}
          </div>

          {/* Amortization Schedule */}
          <div className="bg-white rounded-lg shadow">
            <AmortizationScheduleDisplay asset={asset} />
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
