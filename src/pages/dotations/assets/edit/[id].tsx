'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetForm } from '@/components/dotations/assets/AssetForm';
import { assetsApi } from '@/lib/assetsApi';
import { Asset, CreateAssetDto, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

export default function EditAssetPage() {
  const router = useRouter();
  const { id } = router.query;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

    try {
      setLoading(true);
      // Note: The API seems to only have updateAssetStatus, not a full update method
      // For now, we only update the status. You may need to implement a full update endpoint
      if (data.status) {
        await assetsApi.updateAssetStatus(asset.id, {
          status: data.status,
          disposalDate: data.disposalDate,
          disposalAmount: data.disposalAmount
        });
      }
      router.push('/dotations/assets');
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setLoading(false);
    }
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
    </AppLayout>
  );
}
