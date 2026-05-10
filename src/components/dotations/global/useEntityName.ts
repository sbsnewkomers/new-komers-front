'use client';

import { useState, useEffect } from 'react';
import { GlobalDotation } from '@/types/asset.types';
import { entitiesApi } from '@/lib/entitiesApi';

export function useEntityName(selectedDotation: GlobalDotation | undefined, viewMode: string) {
  const [entityName, setEntityName] = useState<string>('');

  useEffect(() => {
    if (viewMode === 'view' && selectedDotation) {
      const loadEntityName = async () => {
        try {
          // Validation UUID
          const isValidUUID = (id: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
          };

          if (isValidUUID(selectedDotation.entityId)) {
            const name = await entitiesApi.getEntityName(selectedDotation.entityType, selectedDotation.entityId);
            setEntityName(name);
          } else {
            setEntityName(`${selectedDotation.entityType} #${selectedDotation.entityId.slice(0, 8)}...`);
          }
        } catch {
          setEntityName(`${selectedDotation.entityType} #${selectedDotation.entityId.slice(0, 8)}...`);
        }
      };

      loadEntityName();
    }
  }, [viewMode, selectedDotation]);

  return entityName;
}
