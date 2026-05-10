'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetForm } from '@/components/dotations/assets/AssetForm';
import { assetsApi } from '@/lib/assetsApi';
import { CreateAssetDto, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

export default function CreateAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { workspaces } = useWorkspaceContext();

  const entityType = EntityType.COMPANY;
  const entityId = workspaces[0]?.id || '';

  const handleSubmit = async (data: CreateAssetDto) => {
    try {
      setLoading(true);
      await assetsApi.createAsset(data);
      router.push('/dotations/assets');
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dotations/assets');
  };

  return (
    <AppLayout title="Créer un actif">
      <div className="container mx-auto py-6 space-y-6">
        {/* Asset Form */}
        <div className="max-w-4xl mx-auto">
          <AssetForm
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
