import React, { useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { usePermissions } from "@/permissions/usePermissions";
import type { PermissionRequirement } from "@/permissions/types";

export type WithPermissionsOptions = {
  requiredPermissions: PermissionRequirement;
  redirectUrl?: string;
};

export function withPermissions<P>(Page: NextPage<P>, options: WithPermissionsOptions): NextPage<P> {
  const redirectUrl = options.redirectUrl ?? "/403";

  const Wrapped: NextPage<P> = (props: P) => {
    const router = useRouter();
    const { has, isLoading } = usePermissions();

    const allowed = has(options.requiredPermissions);

    useEffect(() => {
      if (isLoading) return;
      if (allowed) return;
      void router.replace(redirectUrl);
    }, [allowed, isLoading, redirectUrl, router]);

    if (!allowed) return null;
    // @ts-expect-error - Page is a valid React component
    return <Page {...props} />;
  };

  Wrapped.displayName = `withPermissions(${Page.displayName ?? Page.name ?? "Page"})`;
  return Wrapped;
}

