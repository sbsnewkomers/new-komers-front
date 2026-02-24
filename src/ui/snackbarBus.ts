export type SnackbarVariant = "success" | "error" | "info" | "warning";

export type SnackbarEvent = {
  message: string;
  variant?: SnackbarVariant;
};

type Listener = (event: SnackbarEvent) => void;

const listeners = new Set<Listener>();

export function subscribeSnackbar(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSnackbar(event: SnackbarEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

