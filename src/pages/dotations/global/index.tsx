'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalDotationList } from '@/components/dotations/global/GlobalDotationList';
import { GlobalDotationForm } from '@/components/dotations/global/GlobalDotationForm';
import { GlobalDotationView } from './GlobalDotationView';
import { GlobalDotationHeader } from './GlobalDotationHeader';
import { useEntityName } from './useEntityName';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function GlobalDotationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDotation, setSelectedDotation] = useState<GlobalDotation | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const entityName = useEntityName(selectedDotation, viewMode);

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

  const handleViewDotation = (dotation: GlobalDotation) => {
    setSelectedDotation(dotation);
    setViewMode('view');
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
        <GlobalDotationHeader onBackToAssets={handleBackToAssets} />

        {/* Content */}
        {viewMode === 'list' && (
          <GlobalDotationList
            entityType={entityType}
            entityId={entityId}
            onEdit={handleEditDotation}
            onView={handleViewDotation}
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
            allowEntitySelection={true}
          />
        )}

        {viewMode === 'view' && selectedDotation && (
          <GlobalDotationView
            dotation={selectedDotation}
            entityName={entityName}
            onCancel={handleCancel}
          />
        )}

      </div>
    </AppLayout>
  );
}
