import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { logout as authLogout } from "@/lib/authApi";
import type { PermissionGrant, PermissionsUser } from "@/permissions/types";

type PermissionsContextValue = {
  user: PermissionsUser | null;
  grants: PermissionGrant[];
  isLoading: boolean;
  setGrants: (next: PermissionGrant[]) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider(props: {
  children: React.ReactNode;
  bootstrap?: { user?: PermissionsUser | null; grants?: PermissionGrant[] };
}) {
  const [user, setUser] = useState<PermissionsUser | null>(props.bootstrap?.user ?? null);
  const [grants, setGrants] = useState<PermissionGrant[]>(props.bootstrap?.grants ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    setIsLoading(true);
    try {
      const me = await apiFetch<PermissionsUser>("/auth/me", {
        snackbar: options?.silent ? { showError: false } : undefined,
      });
      setUser(me);
      setGrants(me.permissions ?? []);
    } catch {
      if (!options?.silent) setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe({ silent: true });
  }, [refreshMe]);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      setUser(null);
      setGrants([]);
    }
  }, []);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      user,
      grants,
      isLoading,
      setGrants,
      refreshMe,
      logout,
    }),
    [user, grants, isLoading, refreshMe, logout],
  );

  return <PermissionsContext.Provider value={value}>{props.children}</PermissionsContext.Provider>;
}

export function usePermissionsContext() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within <PermissionsProvider />");
  }
  return ctx;
}

