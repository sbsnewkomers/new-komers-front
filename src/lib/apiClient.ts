import { emitSnackbar } from "@/ui/snackbarBus";

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

export type ApiFetchSnackbarOptions = {
  /** Show a success snackbar when the request succeeds. Default: false */
  showSuccess?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Show an error snackbar when the request fails. Default: true */
  showError?: boolean;
  /** Custom error message (otherwise status + response body are used) */
  errorMessage?: string;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { baseUrl?: string; snackbar?: ApiFetchSnackbarOptions },
): Promise<T> {
  const baseUrl = init?.baseUrl ?? getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const { snackbar, ...fetchInit } = init ?? {};

  const res = await fetch(url, {
    ...fetchInit,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(fetchInit.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const defaultMessage = `Request failed (${res.status} ${res.statusText})`;
    const message = snackbar?.errorMessage ?? (text || defaultMessage);

    if (snackbar?.showError !== false) {
      emitSnackbar({ message, variant: "error" });
    }

    throw new Error(text || defaultMessage);
  }

  if (snackbar?.showSuccess) {
    const message = snackbar.successMessage ?? "Request completed successfully.";
    emitSnackbar({ message, variant: "success" });
  }

  return (await res.json()) as T;
}
