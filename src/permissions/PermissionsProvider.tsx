import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, setAccessTokenGetter } from "@/lib/apiClient";
import { logout as authLogout, refreshTokens, impersonateUser, exitImpersonation as exitImpersonationApi,type TokenPair } from "@/lib/authApi";
import type { PermissionGrant, PermissionsUser } from "@/permissions/types";
import { useAuthRevalidator } from "@/hooks/useAuthRevalidator";
import { loansApi } from "@/lib/loansApi";

type PermissionsContextValue = {
  user: PermissionsUser | null;
  grants: PermissionGrant[];
  isLoading: boolean;
  /** True once the initial auth bootstrap (localStorage + /auth/me attempt) has completed. */
  isAuthReady: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: TokenPair | null) => void;
  setGrants: (next: PermissionGrant[]) => void;
  refreshMe: (options?: { silent?: boolean }) => Promise<PermissionsUser | null>;
  logout: () => Promise<void>;
  impersonate: (targetUserId: string) => Promise<void>;
  exitImpersonation: () => Promise<PermissionsUser | null>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider(props: {
  children: React.ReactNode;
  bootstrap?: { user?: PermissionsUser | null; grants?: PermissionGrant[] };
}) {
  const [user, setUser] = useState<PermissionsUser | null>(props.bootstrap?.user ?? null);
  const [grants, setGrants] = useState<PermissionGrant[]>(props.bootstrap?.grants ?? []);
  const [isLoading, setIsLoading] = useState(false);

  // Indicates that we've finished the initial token load + /auth/me attempt.
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Ref updated synchronously so apiFetch sees the new token before the next React render/effect.
  // Fixes /me being called without Authorization right after login (setState is async).
  const tokensRef = useRef<TokenPair | null>(null);

  const setTokens = useCallback((tokens: TokenPair | null) => {
    tokensRef.current = tokens ?? null;

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

  // Single getter that reads from ref so it always sees the latest token (including right after setTokens).
  useEffect(() => {
    const tokenGetter = () => tokensRef.current?.accessToken ?? null;
    setAccessTokenGetter(tokenGetter);
    loansApi.setAccessTokenGetter(tokenGetter);
  }, []);

  const refreshMe = useCallback(
    async (options?: { silent?: boolean }): Promise<PermissionsUser | null> => {
      setIsLoading(true);
      try {
        // First attempt: call /auth/me without forcing a redirect on 401.
        const me = await apiFetch<PermissionsUser>("/auth/me", {
          snackbar: options?.silent ? { showError: false } : undefined,
          authRedirect: false,
        });
        setUser(me);
        setGrants(me.permissions ?? []);
        return me;
      } catch (err) {
        // Detect explicit 401 from apiFetch when authRedirect === false
        const message = err instanceof Error ? err.message : "";
        let is401 = false;
        try {
          const parsed = JSON.parse(message) as { status?: number } | undefined;
          if (parsed?.status === 401) is401 = true;
        } catch {
          if (message.toLowerCase().includes("unauthorized")) is401 = true;
        }

        // If we have a refresh token and got a 401, try to refresh tokens once.
        if (is401 && refreshToken) {
          try {
            const newTokens = await refreshTokens(refreshToken);
            setTokens(newTokens);
            const meAfterRefresh = await apiFetch<PermissionsUser>("/auth/me", {
              snackbar: options?.silent ? { showError: false } : undefined,
            });
            setUser(meAfterRefresh);
            setGrants(meAfterRefresh.permissions ?? []);
            return meAfterRefresh;
          } catch {
            // Refresh failed: clear session and optionally redirect.
            setUser(null);
            setGrants([]);
            setTokens(null);
            if (!options?.silent && typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return null;
          }
        }

        if (!options?.silent) setUser(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshToken, setTokens],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
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
      await refreshMe({ silent: true });
      setIsAuthReady(true);
    })();
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

  // Activate session revalidation
  useAuthRevalidator(refreshMe, isAuthReady, !!accessToken);
  const impersonate = useCallback(async (targetUserId: string) => {
  const res = await impersonateUser(targetUserId);
  // On remplace les tokens par ceux de la session impersonifiée
  setTokens(res.tokens);
  // refreshMe va appeler /auth/me avec le nouveau token
  // → user dans le contexte devient la cible
  await refreshMe({ silent: true });
  }, [setTokens, refreshMe]);

  const exitImpersonation = useCallback(async () => {
    const res = await exitImpersonationApi();

    // 1. update tokens
    setTokens(res.tokens);

    // 2. reset immédiat du state (IMPORTANT)
    setUser(null);
    setGrants([]);

    // 3. reload real user
    const me = await refreshMe({ silent: true });

    return me;
  }, [setTokens, refreshMe]);

  const value = useMemo<PermissionsContextValue>(
  () => ({
    user,
    grants,
    isLoading,
    isAuthReady,
    accessToken,
    refreshToken,
    setTokens,
    setGrants,
    refreshMe,
    logout,
    impersonate,        
    exitImpersonation,  
  }),
  [user, grants, isLoading, isAuthReady, accessToken, refreshToken,
   setTokens, refreshMe, logout, impersonate, exitImpersonation],
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

