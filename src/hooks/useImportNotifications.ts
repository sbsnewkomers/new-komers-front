import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

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
  const socketRef = useRef<Socket | null>(null);
  // ✅ Toujours garder la dernière version du callback sans recréer le socket
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) return;

    // ✅ Séparer la base URL du path API
    // Ex: NEXT_PUBLIC_API_BASE_URL = "http://localhost:3001/api"
    // → on prend juste l'origine "http://localhost:3001"
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const socketUrl = apiUrl.replace(/\/api\/?$/, ''); // retire le "/api" si présent

    const socket = io(`${socketUrl}/notifications`, {
      query: { userId },
      transports: ['websocket', 'polling'], // ✅ polling en fallback
    });

    socketRef.current = socket;

    // Debug temporaire — retire une fois que ça marche
    socket.on('connect', () => {
      console.log('[WS] Connecté au namespace /notifications, userId:', userId);
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Erreur de connexion:', err.message);
    });

    socket.on('notification', (payload: ImportNotificationPayload) => {
      console.log('[WS] RAW:', JSON.stringify(payload)); // ← JSON.stringify force l'affichage
      console.log('[WS] type:', payload?.type);
      console.log('[WS] severity:', payload?.severity);
      if (payload.type === 'import') {
        onNotificationRef.current(payload); // toujours la dernière callback
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]); // userId seulement, le callback est géré via le ref
}