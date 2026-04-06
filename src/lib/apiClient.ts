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

let accessTokenGetter: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & {
    baseUrl?: string;
    snackbar?: ApiFetchSnackbarOptions;
    /** When false, do not auto-redirect to /login on 401. Caller is responsible for handling auth errors. */
    authRedirect?: boolean;
  },
): Promise<T> {
  const baseUrl = init?.baseUrl ?? getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const { snackbar, authRedirect, ...fetchInit } = init ?? {};

  const token = accessTokenGetter ? accessTokenGetter() : null;

  const res = await fetch(url, {
    ...fetchInit,
    // We rely on Authorization header tokens now; cookies are not needed.
    credentials: "same-origin",
    headers: {
      // Only set Content-Type for non-FormData requests
      ...(fetchInit.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchInit.headers ?? {}),
    },
  });

  if (!res.ok) {
    // Handle auth expiration / 401 globally: store current location and redirect to login
    // unless the caller explicitly disabled it (authRedirect === false).
    if (res.status === 401) {
      const text401 = await res.text().catch(() => "");

      if (authRedirect === false) {
        // Let callers know it's specifically a 401 without forcing navigation.
        // We encode the status so higher-level code can distinguish it.
        throw new Error(JSON.stringify({ status: 401, body: text401 || null }));
      }

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        // Avoid loops when already on login
        if (!currentPath.startsWith("/login") && !currentPath.startsWith("/invitations/")) {
          try {
            window.localStorage.setItem("nk-return-to", currentPath);
          } catch {
            // ignore storage errors
          }
          window.location.href = "/login";
        }
      }

      throw new Error(text401 || "Unauthorized");
    }

    const text = await res.text().catch(() => "");
    const defaultMessage = `Request failed (${res.status} ${res.statusText})`;

    // Try to parse backend JSON and extract a human message
    let parsed: unknown;
    let backendMessage: string | undefined;
    
    try {
      parsed = text ? JSON.parse(text) : undefined;
      // Add safety check for parsed object
      if (parsed && typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
        const m = (parsed as { message?: string | string[] } | undefined)?.message;
        backendMessage = Array.isArray(m) ? m.join(", ") : m;
      }
    } catch {
      parsed = undefined;
    }

    // If JSON parsing failed or no message found, use raw text
    if (!backendMessage) {
      backendMessage = text;
    }

    const displayMessage = snackbar?.errorMessage ?? backendMessage ?? text ?? defaultMessage ?? "Une erreur est survenue";

    if (snackbar?.showError !== false) {
      emitSnackbar({ message: (displayMessage && displayMessage.trim()) || "Une erreur est survenue", variant: "error" });
    }

    // Throw a richer error object, but with a clean .message for UI
    let finalMessage = "Une erreur est survenue";
    
    // Essayer de construire le message de manière sécurisée
    if (snackbar?.errorMessage && typeof snackbar.errorMessage === 'string') {
      finalMessage = snackbar.errorMessage;
    } else if (backendMessage && typeof backendMessage === 'string') {
      finalMessage = backendMessage;
    } else if (text && typeof text === 'string') {
      finalMessage = text;
    } else if (defaultMessage && typeof defaultMessage === 'string') {
      finalMessage = defaultMessage;
    }
    
    const err = new Error(finalMessage);
  }

  if (snackbar?.showSuccess) {
    const message = snackbar.successMessage ?? "Request completed successfully.";
    emitSnackbar({ message, variant: "success" });
  }

  // Handle empty or no-content responses safely
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }

  // Check if response is JSON
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as T;
    } catch {
      // If it's supposed to be JSON but can't parse, throw error
      throw new Error("Invalid JSON response from server");
    }
  }

  // For non-JSON responses, try to parse as JSON first (for multipart responses that contain JSON)
  try {
    return JSON.parse(text) as T;
  } catch {
    // If it's not JSON, return raw text
    return text as unknown as T;
  }
}
