import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { ImportNotificationPayload } from "@/hooks/useImportNotifications";
import { queryKeys } from "@/queries/queryKeys";
import { useAuthEnabled } from "@/queries/useAuthEnabled";

function notificationsListQueryKey() {
  return queryKeys.notifications.import();
}

function normalizeNotification(
  notification: ImportNotificationPayload,
): ImportNotificationPayload {
  return {
    ...notification,
    isRead: notification.isRead === true,
  };
}

export function isNotificationUnread(
  notification: ImportNotificationPayload,
): boolean {
  return !notification.isRead;
}

export function setNotificationReadInCache(
  queryClient: QueryClient,
  id: string,
) {
  queryClient.setQueryData<ImportNotificationPayload[]>(
    notificationsListQueryKey(),
    (current) =>
      current?.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
  );
}

export function setAllNotificationsReadInCache(queryClient: QueryClient) {
  queryClient.setQueryData<ImportNotificationPayload[]>(
    notificationsListQueryKey(),
    (current) => current?.map((notification) => ({ ...notification, isRead: true })),
  );
}

export function useImportNotificationsList(options?: { enabled?: boolean }) {
  const authEnabled = useAuthEnabled();
  const enabled = (options?.enabled ?? true) && authEnabled;

  return useQuery({
    queryKey: notificationsListQueryKey(),
    queryFn: async () => {
      const list = await apiFetch<ImportNotificationPayload[]>(
        "/notifications",
        {
          method: "GET",
          snackbar: { showError: false, showSuccess: false },
        },
      );
      return [...list]
        .map(normalizeNotification)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    enabled,
    staleTime: 0,
  });
}

export function useHasUnreadNotifications() {
  const { data } = useImportNotificationsList();
  return useMemo(
    () => (data ?? []).some(isNotificationUnread),
    [data],
  );
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, {
        method: "PATCH",
        snackbar: { showSuccess: false, showError: true },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const queryKey = notificationsListQueryKey();
      const previous = queryClient.getQueryData<ImportNotificationPayload[]>(
        queryKey,
      );
      setNotificationReadInCache(queryClient, id);
      return { previous, queryKey };
    },
    onError: (_error, _id, context) => {
      if (context?.previous != null && context.queryKey != null) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () => {
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
