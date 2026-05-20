import { useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/queries/queryKeys';

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
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.import.all,
          });
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