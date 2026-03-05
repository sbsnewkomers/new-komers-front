import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, setAccessTokenGetter } from "@/lib/apiClient";
import { logout as authLogout, type TokenPair } from "@/lib/authApi";
import type { PermissionGrant, PermissionsUser } from "@/permissions/types";

type PermissionsContextValue = {
  user: PermissionsUser | null;
  grants: PermissionGrant[];
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: TokenPair | null) => void;
  setGrants: (next: PermissionGrant[]) => void;
  refreshMe: (options?: { silent?: boolean }) => Promise<PermissionsUser | null>;
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

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const setTokens = useCallback((tokens: TokenPair | null) => {
    if (typeof window === "undefined") {
      setAccessToken(tokens ? tokens.accessToken : null);
      setRefreshToken(tokens ? tokens.refreshToken : null);
      return;
    }

    if (!tokens) {
      setAccessToken(null);
      setRefreshToken(null);
      try {
        window.localStorage.removeItem("nk-auth-tokens");
      } catch {
        // ignore storage errors
      }
      return;
    }

    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    try {
      window.localStorage.setItem(
        "nk-auth-tokens",
        JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      );
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  const refreshMe = useCallback(
    async (options?: { silent?: boolean }): Promise<PermissionsUser | null> => {
      setIsLoading(true);
      try {
        const me = await apiFetch<PermissionsUser>("/auth/me", {
          snackbar: options?.silent ? { showError: false } : undefined,
        });
        setUser(me);
        setGrants(me.permissions ?? []);
        return me;
      } catch {
        if (!options?.silent) setUser(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("nk-auth-tokens");
      if (raw) {
        const parsed = JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
        if (parsed.accessToken && parsed.refreshToken) {
          setTokens({ accessToken: parsed.accessToken, refreshToken: parsed.refreshToken });
        }
      }
    } catch {
      // ignore parse/storage errors
    }
    // Always try to refresh current user once on startup (will fail gracefully if no/invalid token)
    void refreshMe({ silent: true });
  }, [setTokens, refreshMe]);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      setUser(null);
      setGrants([]);
      setTokens(null);
    }
  }, [setTokens]);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      user,
      grants,
      isLoading,
      accessToken,
      refreshToken,
      setTokens,
      setGrants,
      refreshMe,
      logout,
    }),
    [user, grants, isLoading, accessToken, refreshToken, setTokens, refreshMe, logout],
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

