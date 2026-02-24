import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PermissionsProvider } from "@/permissions/PermissionsProvider";
import { SnackbarProvider } from "@/ui/SnackbarProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SnackbarProvider>
      <PermissionsProvider>
        <Component {...pageProps} />
      </PermissionsProvider>
    </SnackbarProvider>
  );
}
