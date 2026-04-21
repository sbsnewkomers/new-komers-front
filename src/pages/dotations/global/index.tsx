'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalDotationList } from '@/components/dotations/global/GlobalDotationList';
import { GlobalDotationForm } from '@/components/dotations/global/GlobalDotationForm';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, TrendingDown } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export default function GlobalDotationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDotation, setSelectedDotation] = useState<GlobalDotation | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { workspaces } = useWorkspaceContext();

  const entityType = EntityType.COMPANY;
  const entityId = workspaces[0]?.id || '';

  const handleCreateNew = () => {
    setSelectedDotation(undefined);
    setViewMode('create');
  };

  const handleEditDotation = (dotation: GlobalDotation) => {
    setSelectedDotation(dotation);
    setViewMode('edit');
  };

  const handleSaveDotation = (dotation: GlobalDotation) => {
    // Retourner à la liste et rafraîchir
    setViewMode('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedDotation(undefined);
  };

  const handleBackToAssets = () => {
    router.push('/dotations');
  };

  return (
    <AppLayout title="Dotations Globales - Mode Simplifié">
      <div className="container mx-auto py-6 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-down h-5 w-5 text-primary" aria-hidden="true">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                  <line x1="2" x2="22" y1="17" y2="17"></line>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Mode Global - Dotations simplifiées</h2>
                <p className="text-sm text-slate-500">Gérez vos dotations par montant annuel global</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleBackToAssets}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' && (
          <GlobalDotationList
            entityType={entityType}
            entityId={entityId}
            onEdit={handleEditDotation}
            onCreate={handleCreateNew}
            refreshTrigger={refreshTrigger}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <GlobalDotationForm
            entityType={entityType}
            entityId={entityId}
            dotation={selectedDotation}
            onSave={handleSaveDotation}
            onCancel={handleCancel}
          />
        )}

      </div>
    </AppLayout>
  );
}
