import { useEffect, useRef, useCallback } from "react";
import type { PermissionsUser } from "@/permissions/types";

export type RevalidationOptions = {
  /** Polling interval in milliseconds. Disabled if 0 or undefined. Default: 5 minutes (300000ms) */
  refreshInterval?: number;
  /** Whether to revalidate when window gains focus. Default: true */
  revalidateOnFocus?: boolean;
  /** Whether to revalidate when network connection is restored. Default: true */
  revalidateOnReconnect?: boolean;
};

export function useAuthRevalidator(
  refreshMe: (options?: { silent?: boolean }) => Promise<PermissionsUser | null>,
  isAuthReady: boolean,
  hasTokens: boolean,
  options: RevalidationOptions = {},
) {
  const {
    refreshInterval = 5 * 60 * 1000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
  } = options;

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearRetryTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Core revalidation logic with exponential backoff for network errors
  const triggerRevalidation = useCallback(async () => {
    // If not ready, no tokens, or document isn't visible, skip
    if (!isAuthReady || !hasTokens || (typeof document !== "undefined" && document.visibilityState === "hidden")) {
      return;
    }

    const scheduleRetry = () => {
      // Exponential backoff: base * 2^retry => max 30s
      if (retryCountRef.current < 5) { // max 5 retries
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        timeoutRef.current = setTimeout(triggerRevalidation, delay);
      }
    };

    try {
      clearRetryTimeout();
      
      const user = await refreshMe({ silent: true });
      
      if (user) {
        // Success
        retryCountRef.current = 0;
      } else {
        // If refreshMe returned null but we STILL have tokens, it was likely 
        // a network/500 error that was swallowed. We should retry.
        // (If refreshMe failed on 401, it clears tokens synchronously and hasTokens will be false next render).
        scheduleRetry();
      }
    } catch {
      // In case refreshMe ever throws
      scheduleRetry();
    }
  }, [isAuthReady, hasTokens, refreshMe, clearRetryTimeout]);

  // Window Focus listener
  useEffect(() => {
    if (!revalidateOnFocus || !hasTokens) return;

    const onFocus = () => {
      // Small debounce/timeout to avoid firing immediately on quick switch
      setTimeout(triggerRevalidation, 100);
    };

    window.addEventListener("focus", onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [revalidateOnFocus, hasTokens, triggerRevalidation]);

  // Network Reconnect listener
  useEffect(() => {
    if (!revalidateOnReconnect || !hasTokens) return;

    const onOnline = () => {
      triggerRevalidation();
    };

    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [revalidateOnReconnect, hasTokens, triggerRevalidation]);

  // Polling logic
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !isAuthReady || !hasTokens) return;

    const intervalId = setInterval(triggerRevalidation, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, isAuthReady, hasTokens, triggerRevalidation]);
}
