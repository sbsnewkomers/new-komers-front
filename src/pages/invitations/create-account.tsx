import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiFetch, getApiBaseUrl } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type FormState = {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
};

export default function CreateAccountPage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (router.isReady && !token) {
      setError("Lien d\u2019invitation invalide. Aucun token fourni.");
    }
  }, [router.isReady, token]);

  const strengthEnabled =
    process.env.NEXT_PUBLIC_PASSWORD_STRENGTH_ENABLED !== "false";

  const hasMinLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasDigit = /[0-9]/.test(form.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password);
  const passwordValid = strengthEnabled
    ? hasMinLength && hasUpper && hasDigit && hasSpecial
    : hasMinLength;
  const passwordsMatch = form.password === form.confirmPassword;
  const canSubmit =
    token &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    passwordValid &&
    passwordsMatch &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    try {
      await apiFetch("/invitations/create-account", {
        method: "POST",
        body: JSON.stringify({
          token,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
        snackbar: { showError: true, showSuccess: false },
      });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <Head>
        <title>Créer mon compte - NewKomers</title>
      </Head>
      <div className="min-h-screen nebula-grid-bg flex flex-col items-center justify-center px-4 py-10">

        {/* Card */}
        <div className="w-full max-w-[400px] nebula-glass nebula-blob rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-full rounded-full bg-(--nebula-gold)/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-full w-full rounded-full bg-(--nebula-gold-light)/20 blur-3xl" />

          <div className="relative">
            {success ? (
              <SuccessView />
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-4xl font-bold leading-[1.05] tracking-tight">
                    <span className="nebula-grad-text">Cr&eacute;er mon compte</span>
                  </h1>
                  <p className="mt-2 text-[12px] text-(--nebula-muted)">
                    Compl&eacute;tez vos informations pour finaliser votre inscription.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 nebula-glass rounded-2xl px-4 py-3 text-xs text-white border border-white/15">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="firstName"
                        className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                      >
                        § Pr&eacute;nom
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        autoComplete="given-name"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="lastName"
                        className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                      >
                        § Nom
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        autoComplete="family-name"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                      § Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--nebula-muted) hover:text-white"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        )}
                      </button>
                    </div>
                    {form.password && !passwordValid && (
                      <p className="text-xs text-(--nebula-gold-light)">
                        {strengthEnabled
                          ? "Le mot de passe doit respecter tous les critères de sécurité ci-dessous."
                          : "Minimum 8 caractères requis."}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
                    >
                      § Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={`pr-10 ${form.confirmPassword && !passwordsMatch
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--nebula-muted) hover:text-white"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        )}
                      </button>
                    </div>
                    {form.confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-400">Les mots de passe ne correspondent pas.</p>
                    )}
                  </div>

                  {/* Password strength hints */}
                  {form.password && strengthEnabled && (
                    <div className="space-y-1">
                      <StrengthCheck ok={hasMinLength} label="Au moins 8 caractéres" />
                      <StrengthCheck ok={hasUpper} label="Une lettre majuscule" />
                      <StrengthCheck ok={hasDigit} label="Un chiffre" />
                      <StrengthCheck ok={hasSpecial} label="Un caractére spécial" />
                    </div>
                  )}

                  <Button type="submit" disabled={!canSubmit} className="w-full">
                    {loading ? "Création du compte…" : "Créer mon compte"}
                  </Button>
                </form>

                {/* Optionnel : lier votre compte Google pour les connexions futures */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-(--nebula-muted)">
                      Ou lier votre compte Google
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
                </div>

                <p className="mt-4 text-center text-xs text-(--nebula-muted)">
                  L&rsquo;invitation expire 72h après son envoi.
                </p>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link href="/login" className="text-(--nebula-muted) hover:text-white text-sm">
                    Déjà un compte ? Se connecter
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StrengthCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-(--nebula-muted)"}`}>
        {ok ? (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
        ) : (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
        )}
      </span>
      <span className={ok ? "text-emerald-400" : "text-(--nebula-muted)"}>{label}</span>
    </div>
  );
}

function SuccessView() {
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
        <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-white">Compte cr&eacute;&eacute; !</h2>
      <p className="mt-3 text-sm text-(--nebula-muted) leading-relaxed">
        Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s.<br />
        Un administrateur doit maintenant <strong>valider votre acc&egrave;s</strong> avant que vous puissiez vous connecter.
      </p>
      <p className="mt-4 text-sm text-(--nebula-muted)">
        Vous recevrez une notification lorsque votre compte sera activ&eacute;.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) text-white! nebula-glow hover:nebula-glow-soft transition-transform px-6 py-2.5 text-[13px] font-semibold"
      >
        Aller &agrave; la page de connexion
      </Link>
    </div>
  );
}
