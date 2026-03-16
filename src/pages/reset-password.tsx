import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";

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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-muted-foreground">Vérification du lien de réinitialisation...</p>
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 font-sans text-slate-900">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Lien invalide</h2>
            <p className="text-slate-500 mb-6">
              Le lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-lg bg-[#1e293b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 w-full"
            >
              Demander un nouveau lien
            </Link>
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
            <h2 className="text-2xl font-semibold text-slate-900">Nouveau mot de passe</h2>
            <p className="mt-2 text-sm text-slate-500">
              Choisissez votre nouveau mot de passe
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
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="••••••••••••"
              />
              <div className="mt-2 text-xs text-slate-500">
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

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full rounded-lg bg-[#1e293b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
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
      </div>
    </>
  );
}
