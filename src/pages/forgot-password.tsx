import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { apiFetch } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        snackbar: {
          showSuccess: true,
          successMessage: "Si cet email est enregistré, vous recevrez un lien de réinitialisation.",
          showError: true,
        },
      });

      setSuccessMessage("Si cet email est enregistré, vous recevrez un lien de réinitialisation.");
      setEmail("");
    } catch (error) {
      // Même en cas d'erreur, on montre un message générique pour la sécurité
      setSuccessMessage("Si cet email est enregistré, vous recevrez un lien de réinitialisation.");
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mot de passe oublié - NewKomers</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 font-sans text-slate-900">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-widest text-slate-700">
            NEWKOMERS
          </h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Mot de passe oublié</h2>
            <p className="mt-2 text-sm text-slate-500">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="nom@entreprise.fr"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-[#1e293b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">
                Ou
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 w-full"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-[#1e293b] hover:underline"
          >
            Inscription
          </Link>
        </div>
      </div>
    </>
  );
}
