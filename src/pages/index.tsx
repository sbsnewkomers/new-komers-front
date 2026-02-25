import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export default function Home() {
  const { user, logout } = usePermissionsContext();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Accueil
        </h1>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.email}
                {user.role && (
                  <span className="ml-2 rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-600">
                    {user.role}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Connexion
            </Link>
          )}
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        {user ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              Bienvenue, {user.firstName || user.email}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/structure"
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Structure (groupes, entreprises, BU)
              </Link>
              {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                <Link
                  href="/permissions-assign"
                  className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                >
                  Attribution des permissions
                </Link>
              )}
            </div>
          </>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Connectez-vous
            </Link>{" "}
            pour continuer.
          </p>
        )}
      </main>
    </div>
  );
}
