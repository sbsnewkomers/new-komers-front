"use client";

import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useGroups, useCompanies } from "@/hooks";
import { apiFetch } from "@/lib/apiClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetBody,
} from "@/components/ui/Sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { CompanyCreateWizard, type CompanyWizardForm } from "@/components/structure/CompanyCreateWizard";

type BusinessUnit = {
  id: string;
  name: string;
  code: string;
  activity: string;
  siret: string;
  company_id?: string;
};

type TreeNode =
  | { type: "group"; id: string; name: string }
  | { type: "company"; id: string; name: string; groupId: string }
  | { type: "bu"; id: string; name: string; companyId: string; code?: string };

export default function StructurePage() {
  const groups = useGroups();
  const companies = useCompanies();
  const [busByCompany, setBusByCompany] = useState<Record<string, BusinessUnit[]>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    groups.fetchList();
  }, []);
  useEffect(() => {
    companies.fetchList();
  }, []);

  const loadBUsForCompany = useCallback(async (companyId: string) => {
    try {
      const data = await apiFetch<BusinessUnit[]>(
        `/companies/${companyId}/business-units`,
        { snackbar: { showSuccess: false, showError: true } }
      );
      setBusByCompany((prev) => ({ ...prev, [companyId]: data }));
    } catch {
      setBusByCompany((prev) => ({ ...prev, [companyId]: [] }));
    }
  }, []);

  const handleRowClick = useCallback(
    (node: TreeNode) => {
      setSelectedNode(node);
      if (node.type === "company") loadBUsForCompany(node.id);
      setSheetOpen(true);
    },
    [loadBUsForCompany]
  );

  const handleCreateCompany = useCallback(
    async (form: CompanyWizardForm) => {
      const size =
        form.size === "MEDIUM_ETI" ? "MEDIUM" : (form.size as "SMALL" | "MEDIUM" | "LARGE");
      const model =
        form.model === "INDEPENDANT" ? "SUBSIDIARY" : (form.model as "HOLDING" | "SUBSIDIARY");
      await companies.create({
        groupId: form.groupId,
        name: form.name,
        fiscal_year_start: form.fiscal_year_start,
        fiscal_year_end: form.fiscal_year_end,
        siret: form.siret,
        address: form.address || undefined,
        ape_code: form.ape_code || undefined,
        main_activity: form.main_activity || undefined,
        size,
        model,
      });
      companies.fetchList();
    },
    [companies]
  );

  const handleUpdateGroup = async (id: string) => {
    const g = groups.list?.find((x) => x.id === id);
    if (!g) return;
    const name = window.prompt("Nom", g.name);
    if (name == null) return;
    await groups.update(id, { name });
    setSheetOpen(false);
  };
  const handleUpdateCompany = async (id: string) => {
    const c = companies.list?.find((x) => x.id === id);
    if (!c) return;
    const name = window.prompt("Nom", c.name);
    if (name == null) return;
    await companies.update(id, { name });
    setSheetOpen(false);
  };
  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm("Supprimer ce groupe ?")) return;
    await groups.remove(id);
    setSheetOpen(false);
  };
  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm("Supprimer cette entreprise ?")) return;
    await companies.remove(id);
    setSheetOpen(false);
  };

  const groupList = groups.list ?? [];
  const companyList = companies.list ?? [];
  const treeRows: TreeNode[] = [];
  groupList.forEach((g) => {
    treeRows.push({ type: "group", id: g.id, name: g.name });
    companyList
      .filter((c) => c.group_id === g.id)
      .forEach((c) => {
        treeRows.push({ type: "company", id: c.id, name: c.name, groupId: g.id });
        (busByCompany[c.id] ?? []).forEach((b) => {
          treeRows.push({
            type: "bu",
            id: b.id,
            name: b.name,
            companyId: c.id,
            code: b.code,
          });
        });
      });
  });

  return (
    <AppLayout title="Structure" companies={companyList} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Structure de l'organisation</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            Structure de l'organisation
          </h1>
          <div className="flex gap-2">
            <Link
              href="/structure/import/upload"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/60"
            >
              Importer
            </Link>
            <Button onClick={() => setWizardOpen(true)}>Nouvelle Entreprise</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          {groups.error && (
            <p className="mb-2 text-sm text-destructive">{groups.error}</p>
          )}
          {companies.error && (
            <p className="mb-2 text-sm text-destructive">{companies.error}</p>
          )}
          {groups.loading && !groupList.length ? (
            <p className="py-8 text-center text-muted-foreground">
              Chargement…
            </p>
          ) : (
            <ul className="space-y-0">
              {treeRows.map((node) => {
                const indent =
                  node.type === "group" ? 0 : node.type === "company" ? 1 : 2;
                const icon =
                  node.type === "group"
                    ? "📁"
                    : node.type === "company"
                    ? "🏢"
                    : "📦";
                return (
                  <li key={`${node.type}-${node.id}`} className="list-none">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-md py-2 px-2 hover:bg-muted/60"
                      style={{ paddingLeft: 8 + indent * 24 }}
                      onClick={() => handleRowClick(node)}
                    >
                      <span className="text-lg" aria-hidden>
                        {icon}
                      </span>
                      <span className="flex-1 truncate font-medium text-foreground">
                        {node.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          className="rounded p-1 hover:bg-muted"
                        >
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground"
                            aria-label="Menu"
                          >
                            ⋮
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.type === "group") handleUpdateGroup(node.id);
                              else if (node.type === "company")
                                handleUpdateCompany(node.id);
                            }}
                          >
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.type === "group") handleDeleteGroup(node.id);
                              else if (node.type === "company")
                                handleDeleteCompany(node.id);
                            }}
                            className="text-destructive"
                          >
                            Supprimer
                          </DropdownMenuItem>
                          {node.type === "company" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetOpen(false);
                                window.location.href = `/structure/${node.id}`;
                              }}
                            >
                              Ajouter une BU
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
              {treeRows.length === 0 && !groups.loading && (
                <li className="py-8 text-center text-muted-foreground">
                  Aucun groupe. Créez une entreprise pour commencer.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          {selectedNode && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedNode.name}</SheetTitle>
                <SheetClose className="absolute right-4 top-4 rounded p-1 hover:bg-muted">
                  ✕
                </SheetClose>
              </SheetHeader>
              <SheetBody>
                {selectedNode.type === "group" && (
                  <GroupDetail
                    node={selectedNode}
                    onModifier={() => handleUpdateGroup(selectedNode.id)}
                    onSupprimer={() => handleDeleteGroup(selectedNode.id)}
                    group={groups.list?.find((g) => g.id === selectedNode.id)}
                  />
                )}
                {selectedNode.type === "company" && (
                  <CompanyDetail
                    node={selectedNode}
                    onModifier={() => handleUpdateCompany(selectedNode.id)}
                    onSupprimer={() => handleDeleteCompany(selectedNode.id)}
                    company={companies.list?.find((c) => c.id === selectedNode.id)}
                    bus={busByCompany[selectedNode.id] ?? []}
                    onOpenFiche={() => {
                      setSheetOpen(false);
                      window.location.href = `/structure/${selectedNode.id}`;
                    }}
                  />
                )}
                {selectedNode.type === "bu" && (
                  <BUDetail
                    node={selectedNode}
                    bus={busByCompany[selectedNode.companyId] ?? []}
                  />
                )}
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CompanyCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        groups={groupList.map((g) => ({ id: g.id, name: g.name }))}
        onSubmit={handleCreateCompany}
      />
    </AppLayout>
  );
}

function GroupDetail({
  node,
  group,
  onModifier,
  onSupprimer,
}: {
  node: TreeNode;
  group?: { name: string; siret?: string };
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  if (node.type !== "group") return null;
  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <dt className="text-muted-foreground">Nom</dt>
        <dd className="font-medium">{group?.name ?? node.name}</dd>
        {group?.siret && (
          <>
            <dt className="text-muted-foreground">SIRET</dt>
            <dd>{group.siret}</dd>
          </>
        )}
      </dl>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onModifier}>
          Modifier
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={onSupprimer}>
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function CompanyDetail({
  node,
  company,
  bus,
  onModifier,
  onSupprimer,
  onOpenFiche,
}: {
  node: TreeNode;
  company?: { name: string; siret?: string; address?: string };
  bus: BusinessUnit[];
  onModifier: () => void;
  onSupprimer: () => void;
  onOpenFiche: () => void;
}) {
  if (node.type !== "company") return null;
  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <dt className="text-muted-foreground">Nom</dt>
        <dd className="font-medium">{company?.name ?? node.name}</dd>
        {company?.siret && (
          <>
            <dt className="text-muted-foreground">SIRET</dt>
            <dd>{company.siret}</dd>
          </>
        )}
        {company?.address && (
          <>
            <dt className="text-muted-foreground">Adresse</dt>
            <dd className="whitespace-pre-wrap">{company.address}</dd>
          </>
        )}
      </dl>
      {bus.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Business Units ({bus.length})
          </p>
          <ul className="space-y-1">
            {bus.map((b) => (
              <li key={b.id} className="text-sm">
                {b.name} {b.code && `— ${b.code}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onModifier}>
          Modifier
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenFiche}>
          Fiche entreprise
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={onSupprimer}>
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function BUDetail({
  node,
  bus,
}: {
  node: TreeNode;
  bus: BusinessUnit[];
}) {
  if (node.type !== "bu") return null;
  const bu = bus.find((b) => b.id === node.id);
  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <dt className="text-muted-foreground">Nom</dt>
        <dd className="font-medium">{bu?.name ?? node.name}</dd>
        {(bu?.code ?? node.code) && (
          <>
            <dt className="text-muted-foreground">Code</dt>
            <dd>{bu?.code ?? node.code}</dd>
          </>
        )}
        {bu?.siret && (
          <>
            <dt className="text-muted-foreground">SIRET</dt>
            <dd>{bu.siret}</dd>
          </>
        )}
        {bu?.activity && (
          <>
            <dt className="text-muted-foreground">Activité</dt>
            <dd>{bu.activity}</dd>
          </>
        )}
      </dl>
      <Link href={`/structure/${node.companyId}`}>
        <span className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted/60">
          Voir la fiche entreprise
        </span>
      </Link>
    </div>
  );
}
