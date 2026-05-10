import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Récupérer le token depuis l'URL
    const queryToken = router.query.token as string;
    console.log('🔍 Frontend DEBUG: Token depuis URL:', queryToken);

    if (queryToken) {
      setToken(queryToken);
      setIsValidToken(true);
      console.log('🔍 Frontend DEBUG: Token défini comme valide');
    } else {
      console.log('❌ Frontend DEBUG: Aucun token trouvé dans l\'URL');
      setIsValidToken(false);
    }
  }, [router.query]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return "Le mot de passe doit contenir au moins 12 caractères";
    }
    if (!/[A-Z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre majuscule";
    }
    if (!/[a-z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre minuscule";
    }
    if (!/[0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un caractère spécial";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation des mots de passe
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrorMessage(passwordError);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Frontend DEBUG: Envoi de la requête reset password');
      console.log('🔍 Frontend DEBUG: Token envoyé:', token);
      console.log('🔍 Frontend DEBUG: Nouveau mot de passe:', newPassword ? '***' : 'VIDE');

      await apiFetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        }),
        snackbar: {
          showSuccess: true,
          successMessage: "Mot de passe réinitialisé avec succès",
          showError: true,
        },
      });

      console.log('✅ Frontend DEBUG: Réinitialisation réussie');
      setSuccessMessage("Mot de passe réinitialisé avec succès");

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (error) {
      const raw = error instanceof Error ? error.message : "Erreur lors de la réinitialisation";

      // Essayer d'extraire le message d'erreur du backend
      let backendMessage: string | undefined;
      try {
        const parsed = JSON.parse(raw);
        backendMessage = parsed?.message;
      } catch {
        backendMessage = raw;
      }

      if (backendMessage?.includes("token") || backendMessage?.includes("expiré")) {
        setErrorMessage("Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.");
      } else if (backendMessage?.includes("invalide")) {
        setErrorMessage("Le lien de réinitialisation est invalide. Veuillez demander un nouveau lien.");
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen nebula-grid-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-(--nebula-muted)">Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <Head>
          <title>Lien invalide - NewKomers</title>
        </Head>
        <div className="min-h-screen nebula-grid-bg flex flex-col items-center justify-center px-4 py-10">
          {/* Logo */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight">
              <span className="nebula-grad-text">NEWKOMERS</span>
            </h1>
          </div>

          <div className="w-full max-w-[400px] nebula-glass nebula-blob rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-full rounded-full bg-(--nebula-gold)/25 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-full w-full rounded-full bg-(--nebula-gold-light)/20 blur-3xl" />

            <div className="relative text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">Lien invalide</h2>
              <p className="text-(--nebula-muted) mb-6">
                Le lien de réinitialisation est invalide ou a expiré.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[13px] font-semibold h-10 w-full transition-colors"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Réinitialiser le mot de passe - NewKomers</title>
      </Head>
      <div className="min-h-screen nebula-grid-bg flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight">
            <span className="nebula-grad-text">NEWKOMERS</span>
          </h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px] nebula-glass nebula-blob rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-full rounded-full bg-(--nebula-gold)/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-full w-full rounded-full bg-(--nebula-gold-light)/20 blur-3xl" />

          <div className="relative">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-white">Nouveau mot de passe</h2>
              <p className="mt-2 text-sm text-(--nebula-muted)">
                Choisissez votre nouveau mot de passe
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
                  htmlFor="newPassword"
                  className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                >
                  § Nouveau mot de passe
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                />
                <div className="mt-2 text-xs text-(--nebula-muted)">
                  Le mot de passe doit contenir :
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Au moins 12 caractères</li>
                    <li>Au moins une lettre majuscule</li>
                    <li>Au moins une lettre minuscule</li>
                    <li>Au moins un chiffre</li>
                    <li>Au moins un caractère spécial</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                >
                  § Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
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
      </div>
    </>
  );
}
