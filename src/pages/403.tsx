import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ForbiddenPage() {
  return (
    <AppLayout title="Acces refuse" companies={[]} selectedCompanyId="" onCompanyChange={() => { }}>
      <Head>
        <title>403 - Acces refuse</title>
      </Head>

      <section className="flex min-h-[70vh] items-center justify-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <svg
            width="220"
            height="140"
            viewBox="0 0 220 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-auto w-full max-w-[220px]"
          >
            <rect x="20" y="20" width="180" height="100" rx="12" fill="#EEF2FF" />
            <circle cx="72" cy="70" r="20" fill="#C7D2FE" />
            <path d="M144 56h38M132 70h50M146 84h36" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
            <path d="M64 62h16M72 54v16" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
          </svg>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Erreur 403</p>
            <h1 className="text-2xl font-bold text-primary">Acces refuse</h1>
            <p className="text-sm text-slate-600">
              Vous n&apos;avez pas les permissions necessaires pour acceder a cette page.
            </p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

