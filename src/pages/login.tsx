import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { login } from "@/lib/authApi";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { getApiBaseUrl } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { refreshMe, setTokens } = usePermissionsContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<null | "PENDING" | "SUSPENDED">(null);

  // Handle OAuth callback: backend redirects to /login#access_token=...&refresh_token=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.slice(1) || "";
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
      refreshMe()
        .then(() => {
          const returnTo = window.localStorage.getItem("nk-return-to");
          if (returnTo) window.localStorage.removeItem("nk-return-to");
          const queryReturnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : null;
          router.replace(returnTo || queryReturnTo || "/dashboard");
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        })
        .catch(() => setErrorMessage("Erreur lors de la connexion Google."));
      return;
    }
    const qMessage = typeof router.query.message === "string" ? decodeURIComponent(router.query.message) : null;
    if (router.query.error === "oauth" && qMessage) {
      setErrorMessage(qMessage);
    }
  }, [router.query.error, router.query.message, router.query.returnTo, setTokens, refreshMe, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await login({ email, password });
      setTokens(res.tokens);
      await refreshMe();
      let redirectTo: string | null = null;
      if (typeof window !== "undefined") {
        try {
          redirectTo = window.localStorage.getItem("nk-return-to");
          if (redirectTo) {
            window.localStorage.removeItem("nk-return-to");
          }
        } catch {
          redirectTo = null;
        }
      }
      const queryReturnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : null;
      router.push(redirectTo || queryReturnTo || "/dashboard");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Erreur de système lors de la connexion";

      // Try to extract backend message from JSON (Nest error shape)
      let backendMessage: string | undefined;
      try {
        const parsed = JSON.parse(raw);
        const m = parsed?.message;
        backendMessage = Array.isArray(m) ? m.join(", ") : m;
      } catch {
        backendMessage = raw;
      }

      const msg = backendMessage?.toString() ?? "";
      const lower = msg.toLowerCase();

      if (msg && (msg.includes("Compte en attente de validation") || lower.includes("compte en attente") || lower.includes("attente de validation"))) {
        setStatusMessage("PENDING");
        return;
      }
      if (msg && (msg.includes("Compte suspendu") || lower.includes("compte suspendu") || lower.includes("suspendu"))) {
        setStatusMessage("SUSPENDED");
        return;
      }
      if (msg && (msg.includes("Identifiants invalides"))) {
        setErrorMessage("Identifiants invalides");
        return;
      }

      setErrorMessage("Erreur de système lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - Nk SOFTWARE</title>
      </Head>
      <div className="min-h-screen nebula-grid-bg flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] nebula-glass nebula-blob rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-full rounded-full bg-(--nebula-gold)/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-full w-full rounded-full bg-(--nebula-gold-light)/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8">
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
                <span className="nebula-grad-text">Connexion</span>
              </h1>
              <p className="mt-3 text-[13px] text-(--nebula-muted)">
                Accédez à votre espace financier.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-white border border-white/15">
                {errorMessage}
              </div>
            )}
            {statusMessage === "PENDING" && (
              <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-white border border-white/15">
                Votre compte a bien été créé et est{" "}
                <strong>en attente de validation</strong> par un administrateur.
                Vous recevrez une notification dès qu&apos;il sera activé.
              </div>
            )}
            {statusMessage === "SUSPENDED" && (
              <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-white border border-white/15">
                Votre compte est actuellement <strong>suspendu</strong>. Contactez
                un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une
                erreur.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                >
                  § Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="nom@entreprise.fr"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                >
                  § Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-(--nebula-muted)">
                  Ou continuer avec
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <a
                href={`${getApiBaseUrl()}/auth/google`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[13px] font-semibold h-10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </a>
              {/* <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
            >
              <svg className="h-4 w-4" viewBox="0 0 23 23" fill="currentColor">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Microsoft
            </button> */}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 space-y-2 text-center text-sm">
            <Link href="/forgot-password" className="block text-(--nebula-muted) hover:text-white">
              Mot de passe oublié ?
            </Link>
            <div className="text-(--nebula-muted)">
              Pas encore de compte ?{" "}
              <Link href="/register" className="font-semibold text-white hover:underline">
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
