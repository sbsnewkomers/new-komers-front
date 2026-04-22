"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useCompanies } from "@/hooks";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";

const CONNECTORS = [
  { id: "sage", name: "Sage", description: "Synchronisation avec Sage Comptabilité" },
  { id: "quadra", name: "Quadra", description: "Connecteur Quadra" },
  { id: "cegid", name: "Cegid", description: "Connecteur Cegid" },
  { id: "generic", name: "API générique", description: "Connexion à une API personnalisée" },
];

const SYNC_FREQUENCIES = [
  { value: "manual", label: "Manuel" },
  { value: "daily", label: "Journalier" },
  { value: "weekly", label: "Hebdomadaire" },
];

export default function ImportConnectorsPage() {
  const companies = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<typeof CONNECTORS[0] | null>(null);
  const [form, setForm] = useState({
    url: "",
    apiKey: "",
    frequency: "manual",
  });

  useEffect(() => {
    companies.fetchList();
  }, []);

  const companyList = companies.list ?? [];

  const openConfig = (connector: typeof CONNECTORS[0]) => {
    setSelectedConnector(connector);
    setForm({ url: "", apiKey: "", frequency: "manual" });
    setConfigOpen(true);
  };

  const handleSaveConfig = () => {
    setConfigOpen(false);
    setSelectedConnector(null);
  };

  return (
    <AppLayout
      title="Import"
      companies={companyList}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
    >
      <Head>
        <title>Connecteurs — Import</title>
      </Head>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/import" className="text-sm text-muted-foreground hover:text-foreground">
            ← Import
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Connecteurs</h1>
        <p className="text-muted-foreground">
          Configurez les connecteurs API pour synchroniser vos données.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.map((connector) => (
            <Card key={connector.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{connector.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{connector.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openConfig(connector)}
                >
                  Configurer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {selectedConnector ? `Configuration — ${selectedConnector.name}` : "Configuration"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                URL de l&apos;API
              </label>
              <Input
                placeholder="https://api.exemple.com"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Clé API
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Fréquence de synchronisation
              </label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
              >
                {SYNC_FREQUENCIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setConfigOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSaveConfig}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
