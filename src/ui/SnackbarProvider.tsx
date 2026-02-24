import React, { useEffect, useState } from "react";
import { emitSnackbar, subscribeSnackbar, type SnackbarEvent } from "@/ui/snackbarBus";

type VisibleSnackbar = SnackbarEvent & { id: number };

let globalId = 0;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<VisibleSnackbar | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSnackbar((event) => {
      setSnackbar({
        id: ++globalId,
        message: event.message,
        variant: event.variant ?? "info",
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = setTimeout(() => setSnackbar(null), 4000);
    return () => clearTimeout(timeout);
  }, [snackbar]);

  return (
    <>
      {children}
      {snackbar && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 8,
            color: "#fff",
            backgroundColor:
              snackbar.variant === "success"
                ? "#16a34a"
                : snackbar.variant === "error"
                  ? "#dc2626"
                  : snackbar.variant === "warning"
                    ? "#f97316"
                    : "#2563eb",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontSize: 14,
            zIndex: 9999,
            maxWidth: "90%",
            wordBreak: "break-word",
          }}
        >
          {snackbar.message}
        </div>
      )}
    </>
  );
}

// Convenience helper if you ever want to trigger a snackbar directly from React code.
export function showSnackbar(message: string, variant: SnackbarEvent["variant"] = "info") {
  emitSnackbar({ message, variant });
}

