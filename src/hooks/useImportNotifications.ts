// hooks/useImportNotifications.ts
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface ImportNotificationPayload {
  severity: 'SUCCESS' | 'ERROR' | 'INFO';
  type: string;
  metadata?: {
    errors?: Array<{ line: number; column: string; reason: string }>;
    importId?: string;
    totalProcessed?: number;
  };
  title: string;
  message: string;
}

export function useImportNotifications(
  userId: string | undefined,
  onNotification: (payload: ImportNotificationPayload) => void,
) {
  const socketRef = useRef<Socket | null>(null); 


  useEffect(() => {
    if (!userId) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications`, {
      query: { userId },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('notification', (payload: ImportNotificationPayload) => {
      if (payload.type === 'IMPORT') {
        onNotification(payload);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);
}