import { useEffect, useRef } from 'react';
import Ably, { Message } from 'ably';
import { ImportMetadata } from '@/features/types/notifications';

export interface ImportNotificationPayload {
  severity: 'success' | 'error' | 'info' | 'warning';
  type: string;
  title: string;
  message: string;
  metadata?: ImportMetadata;
}

let globalAbly: Ably.Realtime | null = null;

function getAbly(): Ably.Realtime {
  if (!globalAbly) {
    globalAbly = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_KEY!);
  }
  return globalAbly;
}

export function useImportNotifications(
  userId: string | undefined,
  onNotification: (payload: ImportNotificationPayload) => void,
) {
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    if (!userId) return;

    const ably = getAbly();
    const channel = ably.channels.get(`user-${userId}`);

    const handler = (message: Message) => {
      const payload = message.data as ImportNotificationPayload;
      console.log('[Ably] reçu:', payload.type, payload.severity);
      if (payload.type === 'import') {
        onNotificationRef.current(payload);
      }
    };

    channel.subscribe('notification', handler);

    channel.once('attached', () => {
      console.log('[Ably] ✅ Canal souscrit:', `user-${userId}`);
    });

    return () => {
      channel.unsubscribe('notification', handler);
    };
  }, [userId]);
}
