import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/apiClient";

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof ApiError && error.status === 401) return false;
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: shouldRetry,
    },
  },
});

export function clearQueryCache(): void {
  queryClient.clear();
}
