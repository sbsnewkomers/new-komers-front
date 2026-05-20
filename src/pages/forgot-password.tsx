import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
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
    } catch {
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
        <title>Mot de passe oublié - Nk SOFTWARE</title>
      </Head>
      <div className="min-h-screen nebula-grid-bg flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight">
            <span className="nebula-grad-text">Nk SOFTWARE</span>
          </h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px] nebula-glass nebula-blob rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-full rounded-full bg-(--nebula-gold)/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-full w-full rounded-full bg-(--nebula-gold-light)/20 blur-3xl" />

          <div className="relative">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-white">Mot de passe oublié</h2>
              <p className="mt-2 text-sm text-white">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-white border border-white/15">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-emerald-400 border border-emerald-500/20">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-[10px] uppercase tracking-[0.2em] text-white"
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

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-(--nebula-muted)">
                  Ou
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[13px] font-semibold h-10 w-full transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-4 text-center text-sm text-(--nebula-muted)">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-white hover:text-(--nebula-gold-light) transition-colors"
          >
            Inscription
          </Link>
        </div>
      </div>
    </>
  );
}
