"use client";

import * as React from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Save, Shield, Bell, Building2, KeyRound, Globe } from "lucide-react";

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = React.useState("general");

  // Mock state
  const [orgName, setOrgName] = React.useState("NewKomers");
  const [orgWebsite, setOrgWebsite] = React.useState("https://newkomers.com");
  const [locale, setLocale] = React.useState("fr-FR");
  const [timezone, setTimezone] = React.useState("Europe/Paris");

  const [notifProduct, setNotifProduct] = React.useState(true);
  const [notifSecurity, setNotifSecurity] = React.useState(true);
  const [notifWeekly, setNotifWeekly] = React.useState(false);

  const [mfaRequired, setMfaRequired] = React.useState(false);
  const [sessionTimeout, setSessionTimeout] = React.useState("30");

  const [saving, setSaving] = React.useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock delay to simulate a save
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Settings" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Settings</title>
      </Head>

      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Paramètres</h2>
            <p className="text-sm text-slate-500">
              (mock)
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1">
            <TabsTrigger value="general" className="rounded-lg">
              Général
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">
              Sécurité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white border border-slate-100">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base">Organisation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nom
                    </label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Nom de l'organisation"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Site web
                    </label>
                    <Input
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-100">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base">Région</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Langue
                    </label>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="fr-FR">Français (FR)</option>
                      <option value="en-US">English (US)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fuseau horaire
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-white border border-slate-100">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-slate-700" />
                  <CardTitle className="text-base">Préférences</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow
                  title="Mises à jour produit"
                  description="Nouvelles fonctionnalités, améliorations et annonces."
                  checked={notifProduct}
                  onChange={setNotifProduct}
                />
                <ToggleRow
                  title="Alertes de sécurité"
                  description="Connexions suspectes, changements de permissions, etc."
                  checked={notifSecurity}
                  onChange={setNotifSecurity}
                />
                <ToggleRow
                  title="Résumé hebdomadaire"
                  description="Un email hebdo avec les indicateurs clés."
                  checked={notifWeekly}
                  onChange={setNotifWeekly}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white border border-slate-100">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base">Accès</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ToggleRow
                    title="Exiger la double authentification (MFA)"
                    description="Recommandé pour les comptes Admin."
                    checked={mfaRequired}
                    onChange={setMfaRequired}
                  />
                  <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <label className="text-sm font-semibold text-slate-900">
                      Expiration de session (minutes)
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Temps d’inactivité avant déconnexion.
                    </p>
                    <div className="mt-2">
                      <Input
                        type="number"
                        min={5}
                        max={240}
                        step={5}
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-100">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base">Clés API (mock)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Aucune clé</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Cette section est une maquette. Les clés API seront ajoutées plus tard.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" disabled>
                        Générer une clé
                      </Button>
                      <Button type="button" variant="ghost" disabled>
                        Voir la documentation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

