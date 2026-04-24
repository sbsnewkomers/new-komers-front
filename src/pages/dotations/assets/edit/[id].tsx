'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetForm } from '@/components/dotations/assets/AssetForm';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, CreateAssetDto, UpdateAssetDto, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

export default function EditAssetPage() {
  const router = useRouter();
  const { id } = router.query;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CreateAssetDto | null>(null);
  const { workspaces } = useWorkspaceContext();

  const entityType = EntityType.COMPANY;
  const entityId = workspaces[0]?.id || '';


  useEffect(() => {
    if (id && typeof id === 'string') {
      // Defer the entire fetch operation to avoid cascading renders
      const abortController = new AbortController();

      const fetchData = async () => {
        try {
          setFetchLoading(true);
          const assetData = await assetsApi.getAssetById(id);
          if (!abortController.signal.aborted) {
            setAsset(assetData);
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error('Error fetching asset:', error);
            router.push('/dotations/assets');
          }
        } finally {
          if (!abortController.signal.aborted) {
            setFetchLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        abortController.abort();
      };
    }
  }, [id, router]);

  const handleSubmit = async (data: CreateAssetDto) => {
    if (!asset) return;

    // Convert CreateAssetDto to UpdateAssetDto (all fields are optional)
    const updateData: UpdateAssetDto = {
      name: data.name,
      description: data.description,
      acquisitionAmount: data.acquisitionAmount,
      acquisitionDate: data.acquisitionDate,
      amortizationDurationYears: data.amortizationDurationYears,
      amortizationType: data.amortizationType,
      status: data.status,
      residualValue: data.residualValue,
      commissioningDate: data.commissioningDate,
      disposalDate: data.disposalDate,
      disposalAmount: data.disposalAmount,
      entityType: data.entityType,
      entityId: data.entityId,
    };

    // Vérifier si des champs affectant l'amortissement sont modifiés
    const amortizationFieldsChanged = (
      data.acquisitionAmount !== asset.acquisitionAmount ||
      data.amortizationDurationYears !== asset.amortizationDurationYears ||
      data.amortizationType !== asset.amortizationType ||
      data.residualValue !== asset.residualValue ||
      data.commissioningDate !== asset.commissioningDate
    );

    // Si des champs affectant l'amortissement sont modifiés, demander confirmation
    if (amortizationFieldsChanged) {
      setPendingData(data);
      setShowConfirmDialog(true);
      return;
    }

    // Sinon, procéder directement à la mise à jour
    performUpdate(updateData);
  };

  const performUpdate = async (updateData: UpdateAssetDto) => {
    if (!asset) return;

    try {
      setLoading(true);
      await assetsApi.updateAsset(asset.id, updateData);
      router.push('/dotations/assets');
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    if (!pendingData) return;

    const updateData: UpdateAssetDto = {
      name: pendingData.name,
      description: pendingData.description,
      acquisitionAmount: pendingData.acquisitionAmount,
      acquisitionDate: pendingData.acquisitionDate,
      amortizationDurationYears: pendingData.amortizationDurationYears,
      amortizationType: pendingData.amortizationType,
      status: pendingData.status,
      residualValue: pendingData.residualValue,
      commissioningDate: pendingData.commissioningDate,
      disposalDate: pendingData.disposalDate,
      disposalAmount: pendingData.disposalAmount,
      entityType: pendingData.entityType,
      entityId: pendingData.entityId,
    };

    setShowConfirmDialog(false);
    setPendingData(null);
    performUpdate(updateData);
  };

  const handleCancelUpdate = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  const handleCancel = () => {
    router.push('/dotations/assets');
  };

  if (fetchLoading) {
    return (
      <AppLayout title="Modifier l&apos;actif">
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
      <AppLayout title="Modifier l&apos;actif">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Actif non trouve</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Modifier l&apos;actif">
      <div className="container mx-auto py-6">
        <div className="max-w-4xl mx-auto">
          <AssetForm
            asset={asset}
            entityType={entityType}
            entityId={entityId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
          />
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirmation de modification
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              Attention : La modification de ces champs va régénérer entièrement le plan d'amortissement.
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCancelUpdate}>
              Annuler
            </Button>
            <Button onClick={handleConfirmUpdate} disabled={loading}>
              Confirmer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
