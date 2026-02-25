"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCompanies, useBusinessUnits } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

export default function StructureCompanyPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : null;
  const companies = useCompanies();
  const businessUnits = useBusinessUnits(id);

  const [activeTab, setActiveTab] = useState("informations");

  useEffect(() => {
    if (id) companies.fetchOne(id);
  }, [id]);
  useEffect(() => {
    if (id) businessUnits.fetchList();
  }, [id]);

  const company = id && companies.one?.id === id ? companies.one : null;
  const loading = companies.loading || businessUnits.loading;

  if (id && !company && !companies.loading && !companies.error) {
    return null;
  }

  return (
    <AppLayout
      title="Structure"
      companies={companies.list ?? []}
      selectedCompanyId={id ?? ""}
      onCompanyChange={() => {}}
    >
      <Head>
        <title>{company ? `${company.name} — Fiche entreprise` : "Fiche entreprise"}</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/structure"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Structure
          </Link>
        </div>
        {companies.error && (
          <p className="text-sm text-destructive">{companies.error}</p>
        )}
        {loading && !company && (
          <p className="py-8 text-muted-foreground">Chargement…</p>
        )}
        {company && (
          <>
            <header>
              <h1 className="text-2xl font-semibold text-foreground">
                {company.name}
              </h1>
            </header>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="informations">Informations</TabsTrigger>
                <TabsTrigger value="business-units">Business Units</TabsTrigger>
                <TabsTrigger value="actionnaires">Actionnaires</TabsTrigger>
              </TabsList>
              <TabsContent value="informations" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <dt className="text-muted-foreground">SIRET</dt>
                    <dd>{company.siret}</dd>
                    <dt className="text-muted-foreground">Début d'exercice</dt>
                    <dd>{company.fiscal_year_start}</dd>
                    <dt className="text-muted-foreground">Fin d'exercice</dt>
                    <dd>{company.fiscal_year_end}</dd>
                    {company.address && (
                      <>
                        <dt className="text-muted-foreground">Adresse</dt>
                        <dd className="whitespace-pre-wrap">{company.address}</dd>
                      </>
                    )}
                    {company.ape_code && (
                      <>
                        <dt className="text-muted-foreground">Code APE</dt>
                        <dd>{company.ape_code}</dd>
                      </>
                    )}
                    {company.main_activity && (
                      <>
                        <dt className="text-muted-foreground">Activité principale</dt>
                        <dd>{company.main_activity}</dd>
                      </>
                    )}
                    {company.size && (
                      <>
                        <dt className="text-muted-foreground">Taille</dt>
                        <dd>{company.size}</dd>
                      </>
                    )}
                    {company.model && (
                      <>
                        <dt className="text-muted-foreground">Modèle</dt>
                        <dd>{company.model}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </TabsContent>
              <TabsContent value="business-units" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  {businessUnits.error && (
                    <p className="mb-2 text-sm text-destructive">
                      {businessUnits.error}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {businessUnits.list?.map((bu) => (
                      <li
                        key={bu.id}
                        className="flex items-center justify-between rounded-lg border border-border py-2 px-3"
                      >
                        <span className="font-medium">{bu.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {bu.code} — {bu.siret}
                        </span>
                      </li>
                    ))}
                    {businessUnits.list?.length === 0 && !businessUnits.loading && (
                      <li className="py-4 text-center text-muted-foreground">
                        Aucune business unit.
                      </li>
                    )}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="actionnaires" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  <p className="text-muted-foreground">
                    Section Actionnaires à venir.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
