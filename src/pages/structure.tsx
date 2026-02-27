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
import { Folder, Building2, Package, MoreHorizontal, Plus, Upload, Play } from "lucide-react";
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
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addCompanyGroupId, setAddCompanyGroupId] = useState<string | null>(null);
  const [addCompanyForm, setAddCompanyForm] = useState({ name: "", siret: "", fiscal_year_start: "", fiscal_year_end: "" });
  const [addCompanyLoading, setAddCompanyLoading] = useState(false);

  const [addBUOpen, setAddBUOpen] = useState(false);
  const [addBUCompanyId, setAddBUCompanyId] = useState<string | null>(null);
  const [addBUForm, setAddBUForm] = useState({ name: "", code: "", activity: "", siret: "" });
  const [addBULoading, setAddBULoading] = useState(false);

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

  const handleAddCompanyToGroup = async () => {
    if (!addCompanyGroupId || !addCompanyForm.name.trim()) return;
    setAddCompanyLoading(true);
    try {
      await companies.create({
        groupId: addCompanyGroupId!,
        name: addCompanyForm.name,
        siret: addCompanyForm.siret,
        fiscal_year_start: addCompanyForm.fiscal_year_start,
        fiscal_year_end: addCompanyForm.fiscal_year_end,
      });
      companies.fetchList();
      setAddCompanyOpen(false);
      setAddCompanyForm({ name: "", siret: "", fiscal_year_start: "", fiscal_year_end: "" });
    } catch { /* snackbar handles */ } finally {
      setAddCompanyLoading(false);
    }
  };

  const handleAddBUToCompany = async () => {
    if (!addBUCompanyId || !addBUForm.name.trim()) return;
    setAddBULoading(true);
    try {
      await apiFetch(`/companies/${addBUCompanyId}/business-units`, {
        method: "POST",
        body: JSON.stringify(addBUForm),
        snackbar: { showSuccess: true, successMessage: "Business unit cr\u00e9\u00e9e" },
      });
      loadBUsForCompany(addBUCompanyId);
      setExpandedCompanyIds((prev) => new Set(prev).add(addBUCompanyId!));
      setAddBUOpen(false);
      setAddBUForm({ name: "", code: "", activity: "", siret: "" });
    } catch { /* snackbar handles */ } finally {
      setAddBULoading(false);
    }
  };

  const toggleExpand = (companyId: string) => {
    setExpandedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
        if (!busByCompany[companyId]) {
          loadBUsForCompany(companyId);
        }
      }
      return next;
    });
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
        if (expandedCompanyIds.has(c.id)) {
          (busByCompany[c.id] ?? []).forEach((b) => {
            treeRows.push({ type: "bu", id: b.id, name: b.name, companyId: c.id, code: b.code });
          });
        }
      });
  });

  const typeLabel = selectedNode?.type === "group" ? "Groupe" : selectedNode?.type === "company" ? "Entreprise" : "Business Unit";

  return (
    <AppLayout title="Structure" companies={companyList} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head><title>Structure de l&apos;organisation</title></Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-primary">Organisation</h2>
            <p className="text-sm text-slate-500">Gérez la structure hiérarchique de vos entités.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/structure/import/upload"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-primary"
            >
              <Upload className="h-4 w-4" />
              Importer
            </Link>
            <Button onClick={() => setWizardOpen(true)} className="h-9 gap-2 bg-primary text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Nouvelle Entreprise
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {groups.error && <p className="p-4 text-sm text-red-600">{groups.error}</p>}
          {companies.error && <p className="p-4 text-sm text-red-600">{companies.error}</p>}
          {groups.loading && !groupList.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>
            </div>
          ) : (
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-[1fr_120px_60px] gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div>Nom</div>
                <div>Type</div>
                <div className="text-right">Actions</div>
              </div>
              
              <ul className="divide-y divide-slate-100">
                {treeRows.map((node) => {
                  const indent = node.type === "group" ? 0 : node.type === "company" ? 1 : 2;
                  const Icon = node.type === "group" ? Folder : node.type === "company" ? Building2 : Package;
                  const iconColor = node.type === "group" ? "text-blue-500" : node.type === "company" ? "text-slate-700" : "text-slate-400";
                  const typeText = node.type === "group" ? "Groupe" : node.type === "company" ? "Entreprise" : "BU";
                  const typeBadgeColor = node.type === "group" 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : node.type === "company" 
                      ? "bg-slate-100 text-slate-700 border-slate-200" 
                      : "bg-slate-50 text-slate-500 border-slate-100";

                  return (
                    <li key={`${node.type}-${node.id}`} className="group/row transition-colors hover:bg-slate-50/50">
                      <div
                        className="grid cursor-pointer grid-cols-[1fr_120px_60px] items-center gap-4 px-6 py-3"
                        onClick={() => openDetail(node)}
                      >
                        <div className="flex items-center gap-3" style={{ paddingLeft: indent * 24 }}>
                          {node.type === "company" && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                              }}
                              className="cursor-pointer p-0.5 hover:bg-slate-200 rounded transition-colors mr-1"
                            >
                              <Play
                                className={`h-3 w-3 text-slate-400 fill-slate-500 transition-transform ${
                                  expandedCompanyIds.has(node.id) ? "rotate-90" : ""
                                }`}
                              />
                            </div>
                          )}
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                          <span className={`truncate font-medium ${node.type === "group" ? "text-primary" : "text-slate-700"}`}>
                            {node.name}
                          </span>
                        </div>
                        
                        <div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${typeBadgeColor}`}>
                            {typeText}
                          </span>
                        </div>

                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                type="button" 
                                onClick={(e) => e.stopPropagation()} 
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white hover:text-primary hover:shadow-sm group-hover/row:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(node); }}>
                                Voir / Modifier
                              </DropdownMenuItem>
                              {node.type === "group" && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setAddCompanyGroupId(node.id);
                                  setAddCompanyForm({ name: "", siret: "", fiscal_year_start: "", fiscal_year_end: "" });
                                  setAddCompanyOpen(true);
                                }}>
                                  <Plus className="mr-2 h-4 w-4" /> Ajouter une entreprise
                                </DropdownMenuItem>
                              )}
                              {node.type === "company" && (
                                <>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setFicheCompanyId(node.id); loadBUsForCompany(node.id); setFicheTab("informations"); setFicheOpen(true); }}>
                                    Fiche entreprise
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setAddBUCompanyId(node.id);
                                    setAddBUForm({ name: "", code: "", activity: "", siret: "" });
                                    setAddBUOpen(true);
                                  }}>
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter une BU
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setConfirmDeleteOpen(true); }}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {treeRows.length === 0 && !groups.loading && (
                  <li className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                      <Building2 className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-medium text-primary">Aucune structure</h3>
                    <p className="mt-1 text-sm text-slate-500">Commencez par créer votre première entreprise.</p>
                  </li>
                )}
              </ul>
            </div>
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
                      <dd className="text-primary font-medium">{company.siret || "—"}</dd>
                      <dt className="text-slate-500">Début d&apos;exercice</dt>
                      <dd className="text-primary font-medium">{company.fiscal_year_start || "—"}</dd>
                      <dt className="text-slate-500">Fin d&apos;exercice</dt>
                      <dd className="text-primary font-medium">{company.fiscal_year_end || "—"}</dd>
                      {company.address && (
                        <>
                          <dt className="text-slate-500">Adresse</dt>
                          <dd className="whitespace-pre-wrap text-primary font-medium">{company.address}</dd>
                        </>
                      )}
                      {company.ape_code && (
                        <>
                          <dt className="text-slate-500">Code APE</dt>
                          <dd className="text-primary font-medium">{company.ape_code}</dd>
                        </>
                      )}
                      {company.main_activity && (
                        <>
                          <dt className="text-slate-500">Activité principale</dt>
                          <dd className="text-primary font-medium">{company.main_activity}</dd>
                        </>
                      )}
                      {company.size && (
                        <>
                          <dt className="text-slate-500">Taille</dt>
                          <dd className="text-primary font-medium">{company.size}</dd>
                        </>
                      )}
                      {company.model && (
                        <>
                          <dt className="text-slate-500">Modèle</dt>
                          <dd className="text-primary font-medium">{company.model}</dd>
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
                          <span className="font-medium text-primary">{b.name}</span>
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

      {/* Add Company to Group Modal */}
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700" />
              Ajouter une entreprise
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Dans le groupe : <strong>{groupList.find((g) => g.id === addCompanyGroupId)?.name}</strong>
          </p>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nom *</label>
              <Input value={addCompanyForm.name} onChange={(e) => setAddCompanyForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom de l&apos;entreprise" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">SIRET</label>
              <Input value={addCompanyForm.siret} onChange={(e) => setAddCompanyForm((f) => ({ ...f, siret: e.target.value }))} placeholder="123 456 789 00012" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">D&eacute;but exercice</label>
                <Input type="date" value={addCompanyForm.fiscal_year_start} onChange={(e) => setAddCompanyForm((f) => ({ ...f, fiscal_year_start: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Fin exercice</label>
                <Input type="date" value={addCompanyForm.fiscal_year_end} onChange={(e) => setAddCompanyForm((f) => ({ ...f, fiscal_year_end: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>Annuler</Button>
            <Button onClick={handleAddCompanyToGroup} disabled={addCompanyLoading || !addCompanyForm.name.trim()}>
              {addCompanyLoading ? "Cr\u00e9ation..." : "Cr\u00e9er"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add BU to Company Modal */}
      <Dialog open={addBUOpen} onOpenChange={setAddBUOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-500" />
              Ajouter une Business Unit
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Dans l&apos;entreprise : <strong>{companyList.find((c) => c.id === addBUCompanyId)?.name}</strong>
          </p>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nom *</label>
              <Input value={addBUForm.name} onChange={(e) => setAddBUForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom de la BU" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Code</label>
              <Input value={addBUForm.code} onChange={(e) => setAddBUForm((f) => ({ ...f, code: e.target.value }))} placeholder="BU-001" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Activit&eacute;</label>
              <Input value={addBUForm.activity} onChange={(e) => setAddBUForm((f) => ({ ...f, activity: e.target.value }))} placeholder="Activit&eacute; principale" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">SIRET</label>
              <Input value={addBUForm.siret} onChange={(e) => setAddBUForm((f) => ({ ...f, siret: e.target.value }))} placeholder="123 456 789 00012" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBUOpen(false)}>Annuler</Button>
            <Button onClick={handleAddBUToCompany} disabled={addBULoading || !addBUForm.name.trim()}>
              {addBULoading ? "Cr\u00e9ation..." : "Cr\u00e9er"}
            </Button>
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
        <p className="text-sm font-medium text-primary">{value || "—"}</p>
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
        <p className="whitespace-pre-wrap text-sm font-medium text-primary">{value || "—"}</p>
      )}
    </div>
  );
}
