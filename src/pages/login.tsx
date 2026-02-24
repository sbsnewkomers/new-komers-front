import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { login } from "@/lib/authApi";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshMe } = usePermissionsContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      await refreshMe();
      router.push("/");
    } catch {
      // Error already shown by apiFetch snackbar
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-900">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Connexion
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href="/"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
