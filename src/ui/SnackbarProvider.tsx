import React, { useEffect, useState, useCallback } from "react";
import { emitSnackbar, subscribeSnackbar, type SnackbarEvent } from "@/ui/snackbarBus";

type VisibleSnackbar = SnackbarEvent & { id: number };

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 5000;
let globalId = 0;

const bgColor: Record<string, string> = {
  success: "#16a34a",
  error: "#dc2626",
  warning: "#f97316",
  info: "#2563eb",
};

const icons: Record<string, string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbars, setSnackbars] = useState<VisibleSnackbar[]>([]);

  const dismiss = useCallback((id: number) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSnackbar((event) => {
      const id = ++globalId;
      setSnackbars((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message: event.message, variant: event.variant ?? "info" }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    });
    return unsubscribe;
  }, [dismiss]);

  return (
    <>
      {children}
      {snackbars.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 9999,
            maxWidth: 420,
            width: "100%",
            pointerEvents: "none",
          }}
        >
          {snackbars.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                color: "#fff",
                backgroundColor: bgColor[s.variant ?? "info"],
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                fontSize: 13,
                lineHeight: "1.4",
                wordBreak: "break-word",
                pointerEvents: "auto",
                animation: "snackbar-slide-in 0.25s ease-out",
              }}
            >
              <span style={{ fontSize: 16, lineHeight: "1", flexShrink: 0, marginTop: 1 }}>
                {icons[s.variant ?? "info"]}
              </span>
              <span style={{ flex: 1 }}>{s.message}</span>
              <button
                type="button"
                onClick={() => dismiss(s.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: "1",
                  padding: 0,
                  flexShrink: 0,
                  marginTop: 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
      <style jsx global>{`
        @keyframes snackbar-slide-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export function showSnackbar(message: string, variant: SnackbarEvent["variant"] = "info") {
  emitSnackbar({ message, variant });
}

