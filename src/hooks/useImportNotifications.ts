import { useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';

export interface ImportNotificationPayload {
  id: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  type: string;
  title: string;
  message: string;
  metadata?: any;
  createdAt: string;
  isRead: boolean;
}

export function useImportNotifications(
  userId: string | undefined,
  onNotification: (payload: ImportNotificationPayload) => void,
) {
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      try {
        const notifications = await apiFetch<ImportNotificationPayload[]>('/notifications', {
          method: 'GET',
          snackbar: { showError: false, showSuccess: false },
        });

        const newOnes = notifications.filter(
          (n) => !n.isRead && n.type === 'import' && n.id !== lastSeenIdRef.current
        );

        if (newOnes.length > 0) {
          lastSeenIdRef.current = newOnes[0].id;
          // On rafraîchit juste l'historique, pas de modale
          newOnes.forEach((n) => onNotification(n));
        }
      } catch {
        // silencieux
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [userId]);
}