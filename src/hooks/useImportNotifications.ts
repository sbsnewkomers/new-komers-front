import { useEffect, useRef } from 'react';

interface ImportNotificationPayload {
  severity: 'success' | 'error' | 'info' | 'warning';
  type: string;
  title: string;
  message: string;
  metadata?: {
    // erreurs
    errors?: any[];
    // succès
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
    const url = `${apiUrl}/notifications/stream?userId=${userId}`;

    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(url);

      es.onopen = () => console.log('[SSE] Connecté, userId:', userId);

      es.onmessage = (event) => {
        try {
          const payload: ImportNotificationPayload = JSON.parse(event.data);
          if (payload.type === 'import') {
            onNotificationRef.current(payload);
          }
        } catch (err) {
          console.error('[SSE] Erreur parsing:', err);
        }
      };

      es.onerror = () => {
        console.error('[SSE] Erreur — reconnexion dans 3s');
        es.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [userId]);
}