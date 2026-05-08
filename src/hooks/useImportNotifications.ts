import { useEffect, useRef } from 'react';
import Pusher, { Channel } from 'pusher-js';

export interface ImportNotificationPayload {
  severity: 'success' | 'error' | 'info' | 'warning';
  type: string;
  title: string;
  message: string;
  metadata?: {
    errors?: any[];
    importId?: string;
    totalProcessed?: number;
    skippedDescendantLines?: number;
    newFiscalYearsCount?: number;
    existingFiscalYearsCount?: number;
    rootEntityId?: string;
    rootEntityType?: string;
    rootEntityName?: string;
    fiscalYears?: {
      fiscalYearId: string;
      entityId: string;
      entityType: string;
      entityName: string | null;
      entityCode: string | null;
      calendarYear: number;
      startDate: string;
      endDate: string;
      isNew: boolean;
      linesCount: number;
    }[];
    dataImports?: {
      dataImportId: string;
      entityId: string;
      entityType: string;
      entityName: string | null;
      linesCount: number;
    }[];
  };
}

// Singleton global — survit aux re-renders et aux navigations
let globalPusher: Pusher | null = null;

function getPusher(): Pusher {
  if (
    !globalPusher ||
    globalPusher.connection.state === 'disconnected' ||
    globalPusher.connection.state === 'failed'
  ) {
    globalPusher?.disconnect();
    globalPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return globalPusher;
}

export function useImportNotifications(
  userId: string | undefined,
  onNotification: (payload: ImportNotificationPayload) => void,
) {
  const onNotificationRef = useRef(onNotification);

  // Sans tableau de dépendances → se met à jour à chaque render
  // garantit que le ref pointe toujours vers la closure la plus fraîche
  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusher();
    const channelName = `user-${userId}`;
    const channel: Channel = pusher.subscribe(channelName);

    const handler = (payload: ImportNotificationPayload) => {
      console.log('[Pusher] reçu:', payload.type, payload.severity);
      if (payload.type === 'import') {
        onNotificationRef.current(payload);
      }
    };

    channel.bind('notification', handler);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Canal souscrit:', channelName);
    });

    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] ❌ Erreur:', err);
    });

    return () => {
      // Retire seulement ce handler, ne déconnecte PAS le singleton
      channel.unbind('notification', handler);
    };
  }, [userId]);
}