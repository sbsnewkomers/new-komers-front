'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetList } from '@/components/dotations/assets/AssetList';
import { ArrowLeft, List } from 'lucide-react';
import { Asset, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

export default function AssetsPage() {
  const router = useRouter();

  const { workspaces } = useWorkspaceContext();

  const entityType = EntityType.COMPANY;
  const entityId = workspaces[0]?.id || '';

  const handleEditAsset = (asset: Asset) => {
    router.push(`/dotations/assets/edit/${asset.id}`);
  };

  const handleViewAsset = (asset: Asset) => {
    router.push(`/dotations/assets/view/${asset.id}`);
  };

  const handleCreateNew = () => {
    router.push('/dotations/assets/create');
  };

  const handleBackToDotations = () => {
    router.push('/dotations');
  };

  return (
    <AppLayout title="Actifs immobilisés">
      <div className="container mx-auto py-6 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list h-5 w-5 text-primary" aria-hidden="true">
                  <line x1="8" x2="21" y1="6" y2="6"></line>
                  <line x1="8" x2="21" y1="12" y2="12"></line>
                  <line x1="8" x2="21" y1="18" y2="18"></line>
                  <line x1="3" x2="3.01" y1="6" y2="6"></line>
                  <line x1="3" x2="3.01" y1="12" y2="12"></line>
                  <line x1="3" x2="3.01" y1="18" y2="18"></line>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Mode Détaillé - Gestion des actifs</h2>
                <p className="text-sm text-slate-500">Gérez vos actifs et suivez leurs plans d&apos;amortissement</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToDotations}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>
        {/* Asset List */}
        <AssetList
          entityType={entityType}
          entityId={entityId}
          onEdit={handleEditAsset}
          onView={handleViewAsset}
          onCreate={handleCreateNew}
        />

      </div>
    </AppLayout>
  );
}
