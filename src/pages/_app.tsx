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

      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-600">

        <div className="text-center space-y-2">

          <p className="text-sm font-medium">Chargement de votre session...</p>

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

