import "@/styles/globals.css";

import type { AppProps } from "next/app";

import { PermissionsProvider, usePermissionsContext } from "@/permissions/PermissionsProvider";

import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

import { SnackbarProvider } from "@/ui/SnackbarProvider";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";



function GlobalErrorListener({ children }: { children: React.ReactNode }) {

  useGlobalErrorHandler();

  return <>{children}</>;

}



function AuthBootstrapGate({ children }: { children: React.ReactNode }) {

  const { isAuthReady } = usePermissionsContext();



  if (!isAuthReady) {

    // Simple global splash while we resolve /auth/me + refresh logic

    return (

      <div className="min-h-screen nebula-grid-bg flex items-center justify-center">
        <div className="nebula-glass rounded-3xl p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted) mb-3">
            Initialisation
          </div>
          <p className="text-sm font-semibold text-white">
            Chargement de votre session...
          </p>
        </div>

      </div>

    );

  }



  return <>{children}</>;

}



export default function App({ Component, pageProps }: AppProps) {

  return (

    <SnackbarProvider>

      <GlobalErrorListener>

        <ErrorBoundary>

          <PermissionsProvider>

            <WorkspaceProvider>

              <AuthBootstrapGate>

                <Component {...pageProps} />

              </AuthBootstrapGate>

            </WorkspaceProvider>

          </PermissionsProvider>

        </ErrorBoundary>

      </GlobalErrorListener>

    </SnackbarProvider>

  );

}

