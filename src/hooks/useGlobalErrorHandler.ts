import { useEffect } from "react";
import { emitSnackbar } from "@/ui/snackbarBus";

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Une erreur inattendue est survenue.";
}

export function useGlobalErrorHandler() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      const msg = formatErrorMessage(event.error ?? event.message);
      emitSnackbar({ message: msg, variant: "error" });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const msg = formatErrorMessage(event.reason);
      emitSnackbar({ message: msg, variant: "error" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
}
