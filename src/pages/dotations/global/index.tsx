'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { globalDotationsApi } from '@/lib/globalDotationsApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalDotationList } from '@/components/dotations/global/GlobalDotationList';
import { GlobalDotationForm } from '@/components/dotations/global/GlobalDotationForm';
import { GlobalDotationView } from '@/components/dotations/global/GlobalDotationView';
import { GlobalDotationHeader } from '@/components/dotations/global/GlobalDotationHeader';
import { useEntityName } from '@/components/dotations/global/useEntityName';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { useWorkspaceContext } from '@/providers/WorkspaceProvider';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function GlobalDotationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDotation, setSelectedDotation] = useState<GlobalDotation | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const entityName = useEntityName(selectedDotation, viewMode);
  const processedUrlRef = useRef<string>('');

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

  const handleSaveDotation = () => {
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

  // Gérer les paramètres d'URL pour afficher directement les détails d'une dotation
  useEffect(() => {
    const handleUrlParams = async () => {
      if (router.isReady) {
        const { view, dotationId } = router.query;
        const urlKey = `${view}-${dotationId}`;

        // Éviter de traiter la même URL plusieurs fois
        if (processedUrlRef.current === urlKey) return;

        if (view === 'details' && dotationId && typeof dotationId === 'string') {
          try {
            // Charger la dotation spécifique
            const dotation = await globalDotationsApi.getGlobalDotationById(dotationId);
            setSelectedDotation(dotation);
            setViewMode('view');
            processedUrlRef.current = urlKey;
          } catch (error) {
            console.error('Erreur lors du chargement de la dotation:', error);
            setViewMode('list');
          }
        }
      }
    };

    handleUrlParams();
  }, [router.isReady, router.query]);

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
