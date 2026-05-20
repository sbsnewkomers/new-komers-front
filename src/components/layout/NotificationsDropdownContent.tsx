"use client";

import * as React from "react";

import { apiFetch } from "@/lib/apiClient";
import type { ImportNotificationPayload } from "@/hooks/useImportNotifications";
import {
  isNotificationUnread,
  setAllNotificationsReadInCache,
  useImportNotificationsList,
  useMarkNotificationRead,
} from "@/queries/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import {
  AlertCircle,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";

function severityIcon(severity: ImportNotificationPayload["severity"]) {
  switch (severity) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />;
    case "error":
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden />;
    case "warning":
      return <TriangleAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />;
    default:
      return <Info className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />;
  }
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export function NotificationsDropdownContent() {
  const queryClient = useQueryClient();
  const listQuery = useImportNotificationsList();
  const markReadMut = useMarkNotificationRead();
  const [markingAll, setMarkingAll] = React.useState(false);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  const items = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error =
    listQuery.error != null
      ? "Impossible de charger les notifications."
      : null;

  const markRead = async (n: ImportNotificationPayload) => {
    if (!isNotificationUnread(n)) return;
    setMarkingId(n.id);
    try {
      await markReadMut.mutateAsync(n.id);
    } catch {
      // keep UI unchanged
    } finally {
      setMarkingId((id) => (id === n.id ? null : id));
    }
  };

  const unreadCount = items.filter(isNotificationUnread).length;

  const markAllRead = async () => {
    const unread = items.filter(isNotificationUnread);
    if (unread.length === 0) return;
    setMarkingAll(true);
    const queryKey = queryKeys.notifications.import();
    const previous = queryClient.getQueryData<ImportNotificationPayload[]>(
      queryKey,
    );
    setAllNotificationsReadInCache(queryClient);
    try {
      await Promise.allSettled(
        unread.map((n) =>
          apiFetch(`/notifications/${n.id}/read`, {
            method: "PATCH",
            snackbar: { showError: false, showSuccess: false },
          }),
        ),
      );
      await queryClient.refetchQueries({
        queryKey: queryKeys.notifications.all,
      });
    } catch {
      if (previous != null) {
        queryClient.setQueryData(queryKey, previous);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="flex max-h-[min(22rem,55vh)] w-[min(27rem,calc(100vw-4.5rem))] flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
          Notifications
        </p>
        {!loading && !error && unreadCount > 0 ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={() => void markAllRead()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-(--nebula-gold-light) transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            )}
            Tout marquer comme lu
          </button>
        ) : null}
      </div>
      <div className="min-h-16 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-(--nebula-muted)">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Chargement…
          </div>
        ) : error ? (
          <p className="px-3 py-6 text-center text-sm text-red-300">{error}</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-(--nebula-muted)">Aucune notification.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((n) => (
              <li key={n.id}>
                <div
                  className={`flex gap-1 px-2 py-2.5 text-sm ${
                    isNotificationUnread(n) ? "bg-white/3" : "opacity-75"
                  }`}
                >
                  {isNotificationUnread(n) && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 self-start rounded-full bg-(--nebula-gold-light)"
                      aria-hidden
                    />
                  )}
                  {!isNotificationUnread(n) && (
                    <span className="w-1.5 shrink-0 self-start" aria-hidden />
                  )}
                  <span className="mt-0.5 shrink-0">{severityIcon(n.severity)}</span>
                  <div className="min-w-0 flex-1 text-left">
                    <span className="block font-medium text-white">{n.title}</span>
                    {n.message ? (
                      <span className="mt-0.5 line-clamp-2 text-[12px] text-(--nebula-muted)">
                        {n.message}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-(--nebula-muted)">
                      {formatWhen(n.createdAt)}
                    </span>
                  </div>
                  {isNotificationUnread(n) ? (
                    <button
                      type="button"
                      title="Marquer comme lu"
                      aria-label="Marquer comme lu"
                      disabled={markingId === n.id || markingAll}
                      onClick={(e) => {
                        e.stopPropagation();
                        void markRead(n);
                      }}
                      className="shrink-0 self-start rounded-lg p-1.5 text-(--nebula-muted) transition-colors hover:bg-white/10 hover:text-(--nebula-gold-light) disabled:opacity-50"
                    >
                      {markingId === n.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Check className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
