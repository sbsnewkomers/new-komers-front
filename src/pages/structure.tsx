"use client";

import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useGroups, useCompanies } from "@/hooks";
import { apiFetch } from "@/lib/apiClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ficheOpen, setFicheOpen] = useState(false);
  const [ficheCompanyId, setFicheCompanyId] = useState<string | null>(null);
  const [ficheTab, setFicheTab] = useState("informations");

  // Editable form state
  const [editGroup, setEditGroup] = useState({ name: "", siret: "", fiscal_year_start: "", fiscal_year_end: "", mainActivity: "" });
  const [editCompany, setEditCompany] = useState({ name: "", siret: "", address: "", ape_code: "", main_activity: "" });
  const [editBU, setEditBU] = useState({ name: "", code: "", activity: "", siret: "" });

  useEffect(() => { groups.fetchList(); }, []);
  useEffect(() => { companies.fetchList(); }, []);

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

  const openDetail = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setEditing(false);

    if (node.type === "group") {
      const g = groups.list?.find((x) => x.id === node.id);
      setEditGroup({
        name: g?.name ?? node.name,
        siret: g?.siret ?? "",
        fiscal_year_start: g?.fiscal_year_start ?? "",
        fiscal_year_end: g?.fiscal_year_end ?? "",
        mainActivity: g?.mainActivity ?? "",
      });
    } else if (node.type === "company") {
      const c = companies.list?.find((x) => x.id === node.id);
      setEditCompany({
        name: c?.name ?? node.name,
        siret: c?.siret ?? "",
        address: c?.address ?? "",
        ape_code: c?.ape_code ?? "",
        main_activity: c?.main_activity ?? "",
      });
      loadBUsForCompany(node.id);
    } else if (node.type === "bu") {
      const bus = busByCompany[node.companyId] ?? [];
      const bu = bus.find((b) => b.id === node.id);
      setEditBU({
        name: bu?.name ?? node.name,
        code: bu?.code ?? node.code ?? "",
        activity: bu?.activity ?? "",
        siret: bu?.siret ?? "",
      });
    }

    setDetailOpen(true);
  }, [groups.list, companies.list, busByCompany, loadBUsForCompany]);

  const handleSave = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "group") {
      await groups.update(selectedNode.id, {
        name: editGroup.name,
        siret: editGroup.siret,
        fiscal_year_start: editGroup.fiscal_year_start,
        fiscal_year_end: editGroup.fiscal_year_end,
        mainActivity: editGroup.mainActivity || undefined,
      });
    } else if (selectedNode.type === "company") {
      await companies.update(selectedNode.id, {
        name: editCompany.name,
        siret: editCompany.siret,
        address: editCompany.address || undefined,
        ape_code: editCompany.ape_code || undefined,
        main_activity: editCompany.main_activity || undefined,
      });
    } else if (selectedNode.type === "bu") {
      await apiFetch(`/companies/${selectedNode.companyId}/business-units/${selectedNode.id}`, {
        method: "PUT",
        body: JSON.stringify(editBU),
        snackbar: { showSuccess: true, successMessage: "Business unit mise à jour" },
      });
      loadBUsForCompany(selectedNode.companyId);
    }
    setEditing(false);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "group") {
      await groups.remove(selectedNode.id);
    } else if (selectedNode.type === "company") {
      await companies.remove(selectedNode.id);
    } else if (selectedNode.type === "bu") {
      await apiFetch(`/companies/${selectedNode.companyId}/business-units/${selectedNode.id}`, {
        method: "DELETE",
        snackbar: { showSuccess: true, successMessage: "Business unit supprimée" },
      });
      loadBUsForCompany(selectedNode.companyId);
    }
    setConfirmDeleteOpen(false);
    setDetailOpen(false);
  };

  const handleCreateCompany = useCallback(
    async (form: CompanyWizardForm) => {
      const size = form.size === "MEDIUM_ETI" ? "MEDIUM" : (form.size as "SMALL" | "MEDIUM" | "LARGE");
      const model = form.model === "INDEPENDANT" ? "SUBSIDIARY" : (form.model as "HOLDING" | "SUBSIDIARY");
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
          treeRows.push({ type: "bu", id: b.id, name: b.name, companyId: c.id, code: b.code });
        });
      });
  });

  const typeLabel = selectedNode?.type === "group" ? "Groupe" : selectedNode?.type === "company" ? "Entreprise" : "Business Unit";

  return (
    <AppLayout title="Structure" companies={companyList} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head><title>Structure de l'organisation</title></Head>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-900">Structure de l'organisation</h1>
          <div className="flex gap-2">
            <Link
              href="/structure/import/upload"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Importer
            </Link>
            <Button onClick={() => setWizardOpen(true)}>Nouvelle Entreprise</Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {groups.error && <p className="mb-2 text-sm text-red-600">{groups.error}</p>}
          {companies.error && <p className="mb-2 text-sm text-red-600">{companies.error}</p>}
          {groups.loading && !groupList.length ? (
            <p className="py-8 text-center text-slate-400">Chargement…</p>
          ) : (
            <ul className="space-y-0">
              {treeRows.map((node) => {
                const indent = node.type === "group" ? 0 : node.type === "company" ? 1 : 2;
                const icon = node.type === "group" ? "📁" : node.type === "company" ? "🏢" : "📦";
                return (
                  <li key={`${node.type}-${node.id}`} className="list-none">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-xl py-2.5 px-3 hover:bg-slate-50 transition-colors"
                      style={{ paddingLeft: 12 + indent * 24 }}
                      onClick={() => openDetail(node)}
                    >
                      <span className="text-lg" aria-hidden>{icon}</span>
                      <span className="flex-1 truncate font-medium text-slate-900">{node.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {node.type === "group" ? "Groupe" : node.type === "company" ? "Entreprise" : "BU"}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="rounded p-1 hover:bg-slate-100">
                          <button type="button" onClick={(e) => e.stopPropagation()} className="text-slate-400" aria-label="Menu">⋮</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(node); }}>
                            Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setConfirmDeleteOpen(true); }}
                            className="text-red-600"
                          >
                            Supprimer
                          </DropdownMenuItem>
                          {node.type === "company" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setFicheCompanyId(node.id); loadBUsForCompany(node.id); setFicheTab("informations"); setFicheOpen(true); }}>
                              Fiche entreprise
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
              {treeRows.length === 0 && !groups.loading && (
                <li className="py-12 text-center text-slate-400">
                  Aucun groupe. Créez une entreprise pour commencer.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">
                {selectedNode?.type === "group" ? "📁" : selectedNode?.type === "company" ? "🏢" : "📦"}
              </span>
              {editing ? `Modifier ${typeLabel}` : typeLabel}
            </DialogTitle>
          </DialogHeader>

          {selectedNode?.type === "group" && (
            <div className="space-y-4 py-2">
              <Field label="Nom" value={editGroup.name} editing={editing} onChange={(v) => setEditGroup((f) => ({ ...f, name: v }))} />
              <Field label="SIRET" value={editGroup.siret} editing={editing} onChange={(v) => setEditGroup((f) => ({ ...f, siret: v }))} />
              <Field label="Début d'exercice" value={editGroup.fiscal_year_start} editing={editing} type="date" onChange={(v) => setEditGroup((f) => ({ ...f, fiscal_year_start: v }))} />
              <Field label="Fin d'exercice" value={editGroup.fiscal_year_end} editing={editing} type="date" onChange={(v) => setEditGroup((f) => ({ ...f, fiscal_year_end: v }))} />
              <Field label="Activité principale" value={editGroup.mainActivity} editing={editing} onChange={(v) => setEditGroup((f) => ({ ...f, mainActivity: v }))} />
            </div>
          )}

          {selectedNode?.type === "company" && (
            <div className="space-y-4 py-2">
              <Field label="Nom" value={editCompany.name} editing={editing} onChange={(v) => setEditCompany((f) => ({ ...f, name: v }))} />
              <Field label="SIRET" value={editCompany.siret} editing={editing} onChange={(v) => setEditCompany((f) => ({ ...f, siret: v }))} />
              <FieldTextarea label="Adresse" value={editCompany.address} editing={editing} onChange={(v) => setEditCompany((f) => ({ ...f, address: v }))} />
              <Field label="Code APE" value={editCompany.ape_code} editing={editing} onChange={(v) => setEditCompany((f) => ({ ...f, ape_code: v }))} />
              <Field label="Activité principale" value={editCompany.main_activity} editing={editing} onChange={(v) => setEditCompany((f) => ({ ...f, main_activity: v }))} />

              {!editing && (busByCompany[selectedNode.id] ?? []).length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Business Units ({(busByCompany[selectedNode.id] ?? []).length})
                  </p>
                  <ul className="space-y-1">
                    {(busByCompany[selectedNode.id] ?? []).map((b) => (
                      <li key={b.id} className="flex items-center justify-between text-sm text-slate-700">
                        <span>{b.name}</span>
                        {b.code && <span className="text-xs text-slate-400">{b.code}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedNode?.type === "bu" && (
            <div className="space-y-4 py-2">
              <Field label="Nom" value={editBU.name} editing={editing} onChange={(v) => setEditBU((f) => ({ ...f, name: v }))} />
              <Field label="Code" value={editBU.code} editing={editing} onChange={(v) => setEditBU((f) => ({ ...f, code: v }))} />
              <Field label="Activité" value={editBU.activity} editing={editing} onChange={(v) => setEditBU((f) => ({ ...f, activity: v }))} />
              <Field label="SIRET" value={editBU.siret} editing={editing} onChange={(v) => setEditBU((f) => ({ ...f, siret: v }))} />
            </div>
          )}

          <DialogFooter className="gap-2">
            {!editing ? (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Supprimer
                </Button>
                <div className="flex-1" />
                {selectedNode?.type === "company" && (
                  <Button variant="outline" onClick={() => { setDetailOpen(false); setFicheCompanyId(selectedNode.id); loadBUsForCompany(selectedNode.id); setFicheTab("informations"); setFicheOpen(true); }}>
                    Fiche
                  </Button>
                )}
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
                <div className="flex-1" />
                <Button onClick={handleSave}>Enregistrer</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer <strong>{selectedNode?.name}</strong> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiche Entreprise Modal */}
      <Dialog open={ficheOpen} onOpenChange={setFicheOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              {(() => { const c = companyList.find((x) => x.id === ficheCompanyId); return c?.name ?? "Fiche entreprise"; })()}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const company = companyList.find((x) => x.id === ficheCompanyId);
            if (!company) return <p className="py-4 text-center text-slate-400">Entreprise introuvable.</p>;
            const bus = busByCompany[company.id] ?? [];
            return (
              <Tabs value={ficheTab} onValueChange={setFicheTab}>
                <TabsList>
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="business-units">Business Units</TabsTrigger>
                  <TabsTrigger value="actionnaires">Actionnaires</TabsTrigger>
                </TabsList>
                <TabsContent value="informations" className="mt-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <dt className="text-slate-500">SIRET</dt>
                      <dd className="text-slate-900 font-medium">{company.siret || "—"}</dd>
                      <dt className="text-slate-500">Début d'exercice</dt>
                      <dd className="text-slate-900 font-medium">{company.fiscal_year_start || "—"}</dd>
                      <dt className="text-slate-500">Fin d'exercice</dt>
                      <dd className="text-slate-900 font-medium">{company.fiscal_year_end || "—"}</dd>
                      {company.address && (
                        <>
                          <dt className="text-slate-500">Adresse</dt>
                          <dd className="whitespace-pre-wrap text-slate-900 font-medium">{company.address}</dd>
                        </>
                      )}
                      {company.ape_code && (
                        <>
                          <dt className="text-slate-500">Code APE</dt>
                          <dd className="text-slate-900 font-medium">{company.ape_code}</dd>
                        </>
                      )}
                      {company.main_activity && (
                        <>
                          <dt className="text-slate-500">Activité principale</dt>
                          <dd className="text-slate-900 font-medium">{company.main_activity}</dd>
                        </>
                      )}
                      {company.size && (
                        <>
                          <dt className="text-slate-500">Taille</dt>
                          <dd className="text-slate-900 font-medium">{company.size}</dd>
                        </>
                      )}
                      {company.model && (
                        <>
                          <dt className="text-slate-500">Modèle</dt>
                          <dd className="text-slate-900 font-medium">{company.model}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </TabsContent>
                <TabsContent value="business-units" className="mt-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <ul className="space-y-2">
                      {bus.map((b) => (
                        <li
                          key={b.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white py-2 px-3 transition-colors hover:bg-slate-50"
                          onClick={() => {
                            setFicheOpen(false);
                            openDetail({ type: "bu", id: b.id, name: b.name, companyId: company.id, code: b.code });
                          }}
                        >
                          <span className="font-medium text-slate-900">{b.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">{b.code}{b.code && b.siret ? " — " : ""}{b.siret}</span>
                            <span className="text-slate-400">›</span>
                          </div>
                        </li>
                      ))}
                      {bus.length === 0 && (
                        <li className="py-4 text-center text-slate-400">Aucune business unit.</li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="actionnaires" className="mt-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-slate-400">Section Actionnaires à venir.</p>
                  </div>
                </TabsContent>
              </Tabs>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompanyCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        groups={groupList.map((g) => ({ id: g.id, name: g.name }))}
        onSubmit={handleCreateCompany}
      />
    </AppLayout>
  );
}

function Field({
  label,
  value,
  editing,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {editing ? (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="text-sm font-medium text-slate-900">{value || "—"}</p>
      )}
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {editing ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />
      ) : (
        <p className="whitespace-pre-wrap text-sm font-medium text-slate-900">{value || "—"}</p>
      )}
    </div>
  );
}
