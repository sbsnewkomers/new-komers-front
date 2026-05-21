import React, { useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export type WithAuthOptions = {
  /** Default: "/login" */
  redirectUrl?: string;
  /** Persist current path for post-login redirect (localStorage + query). Default: true */
  saveReturnTo?: boolean;
  /**
   * Inverse guard for public auth pages (login, forgot-password).
   * If user is already authenticated, redirect here instead of rendering the page.
   */
  guestOnly?: boolean;
  /** Used when guestOnly is true. Default: "/dashboard" */
  redirectIfAuthenticated?: string;
};

export function withAuth<P>(Page: NextPage<P>, options: WithAuthOptions = {}): NextPage<P> {
  const redirectUrl = options.redirectUrl ?? "/login";
  const saveReturnTo = options.saveReturnTo !== false;
  const guestOnly = options.guestOnly === true;
  const redirectIfAuthenticated = options.redirectIfAuthenticated ?? "/dashboard";

  const Wrapped: NextPage<P> = (props: P) => {
    const router = useRouter();
    const { user, isAuthReady } = usePermissionsContext();

    const isAuthenticated = !!user;

    const allowed = guestOnly ? !isAuthenticated : isAuthenticated;

    useEffect(() => {
      if (!isAuthReady) return;

      if (guestOnly) {
        if (!isAuthenticated) return;
        void router.replace(redirectIfAuthenticated);
        return;
      }

      if (isAuthenticated) return;

      const returnTo = router.asPath || "/dashboard";

      if (saveReturnTo && typeof window !== "undefined") {
        try {
          window.localStorage.setItem("nk-return-to", returnTo);
        } catch {
          // ignore storage write errors
        }
      }

      const loginPath = `${redirectUrl}?returnTo=${encodeURIComponent(returnTo)}`;
      void router.replace(loginPath);
    }, [isAuthReady, isAuthenticated, router, guestOnly, redirectIfAuthenticated, saveReturnTo, redirectUrl]);

    if (!isAuthReady || !allowed) return null;

    // @ts-expect-error - Page is a valid React component
    return <Page {...props} />;
  };

  Wrapped.displayName = `withAuth(${Page.displayName ?? Page.name ?? "Page"})`;
  return Wrapped;
}

/** Apply page guards left-to-right. Prefer: withAuth(withPermissions(Page, ...)). */
export function composePageGuards<P>(
  Page: NextPage<P>,
  ...guards: Array<(page: NextPage<P>) => NextPage<P>>,
): NextPage<P> {
  return guards.reduce((page, guard) => guard(page), Page);
}
