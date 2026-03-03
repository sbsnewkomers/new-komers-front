import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PermissionsProvider } from "@/permissions/PermissionsProvider";
import { SnackbarProvider } from "@/ui/SnackbarProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";

function GlobalErrorListener({ children }: { children: React.ReactNode }) {
  useGlobalErrorHandler();
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SnackbarProvider>
      <GlobalErrorListener>
        <ErrorBoundary>
          <PermissionsProvider>
            <Component {...pageProps} />
          </PermissionsProvider>
        </ErrorBoundary>
      </GlobalErrorListener>
    </SnackbarProvider>
  );
}
