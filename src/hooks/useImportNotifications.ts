import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

interface ImportNotificationPayload {
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

export function useImportNotifications(
  userId: string | undefined,
  onNotification: (payload: ImportNotificationPayload) => void,
) {
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${userId}`);

    channel.bind('notification', (payload: ImportNotificationPayload) => {
      if (payload.type === 'import') {
        onNotificationRef.current(payload);
      }
    });

    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] Erreur subscription:', err);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${userId}`);
      pusher.disconnect();
    };
  }, [userId]);
}