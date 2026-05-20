import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { ImportNotificationPayload } from "@/hooks/useImportNotifications";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

export function useImportNotificationsList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: queryKeys.notifications.import(),
    queryFn: async () => {
      const list = await apiFetch<ImportNotificationPayload[]>(
        "/notifications",
        {
          method: "GET",
          snackbar: { showError: false, showSuccess: false },
        },
      );
      return [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, {
        method: "PATCH",
        snackbar: { showSuccess: false, showError: true },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/notifications/read-all", {
        method: "PATCH",
        snackbar: { showSuccess: false, showError: true },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
