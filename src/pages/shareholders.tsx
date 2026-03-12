"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  fetchShareholders,
  createShareholder,
  updateShareholder,
  deleteShareholder,
  type ShareholderDto,
  type ShareholderOwnerType,
  ownerTypeLabel,
} from "@/lib/shareholdersApi";
import { fetchUsers, type UserItem } from "@/lib/usersApi";
import { useCompanies } from "@/hooks";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { Users, Building2, Percent, Plus, Pencil, Trash2, Search } from "lucide-react";

type FormState = {
  id?: string;
  ownerType: ShareholderOwnerType;
  ownerId: string;
  percentage: string;
  companyIds: string[];
};

const EMPTY_FORM: FormState = {
  ownerType: "USER",
  ownerId: "",
  percentage: "",
  companyIds: [],
};

const ALLOWED_SHAREHOLDER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

export default function ShareholdersPage() {
  const { user } = usePermissionsContext();
  const [shareholders, setShareholders] = useState<ShareholderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<UserItem[]>([]);
  const companiesHook = useCompanies();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  // Local search inside selects
  const [userSelectSearch, setUserSelectSearch] = useState("");
  const [companySelectSearch, setCompanySelectSearch] = useState("");
  const [linkedCompaniesSearch, setLinkedCompaniesSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ShareholderDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canManageShareholders =
    user?.role && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sh, us] = await Promise.all([fetchShareholders(), fetchUsers()]);
      setShareholders(sh);
      setUsers(us);
      await companiesHook.fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les actionnaires.");
    } finally {
      setLoading(false);
    }
  }, [companiesHook.fetchList]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const companyOptions = useMemo(
    () => (companiesHook.list ?? []).map((c) => ({ id: c.id, name: c.name })),
    [companiesHook.list],
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        email: u.email,
      })),
    [users],
  );

  const filteredUserSelectOptions = useMemo(() => {
    const q = userSelectSearch.toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter(
      (u) => u.label.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [userOptions, userSelectSearch]);

  const filteredCompanySelectOptions = useMemo(() => {
    const q = companySelectSearch.toLowerCase();
    if (!q) return companyOptions;
    return companyOptions.filter((c) => c.name.toLowerCase().includes(q));
  }, [companyOptions, companySelectSearch]);

  const filteredLinkedCompanyOptions = useMemo(() => {
    const q = linkedCompaniesSearch.toLowerCase();
    if (!q) return companyOptions;
    return companyOptions.filter((c) => c.name.toLowerCase().includes(q));
  }, [companyOptions, linkedCompaniesSearch]);

  const findUserLabel = (id: string): string => {
    const u = userOptions.find((x) => x.id === id);
    if (!u) return id;
    return `${u.label} (${u.email})`;
  };

  const findCompanyName = (id: string): string => {
    const c = companyOptions.find((x) => x.id === id);
    return c?.name ?? id;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return shareholders;
    return shareholders.filter((s) => {
      const ownerLabel =
        s.ownerType === "USER" ? findUserLabel(s.ownerId).toLowerCase() : findCompanyName(s.ownerId).toLowerCase();
      const companiesNames = (s.companies ?? [])
        .map((c) => c.name ?? "")
        .join(", ")
        .toLowerCase();
      return ownerLabel.includes(q) || companiesNames.includes(q);
    });
  }, [shareholders, search]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEdit = (s: ShareholderDto) => {
    setForm({
      id: s.id,
      ownerType: s.ownerType,
      ownerId: s.ownerId,
      percentage: s.percentage.toString(),
      companyIds: (s.companies ?? []).map((c) => c.id),
    });
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!form.ownerId || !form.percentage) return;
    const percentage = Number(form.percentage);
    if (Number.isNaN(percentage)) return;

    setFormSaving(true);
    try {
      if (form.id) {
        const updated = await updateShareholder(form.id, {
          ownerType: form.ownerType,
          ownerId: form.ownerId,
          percentage,
          companyIds: form.companyIds,
        });
        setShareholders((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createShareholder({
          ownerType: form.ownerType,
          ownerId: form.ownerId,
          percentage,
          companyIds: form.companyIds,
        });
        setShareholders((prev) => [created, ...prev]);
      }
      setFormOpen(false);
      setForm({ ...EMPTY_FORM });
    } finally {
      setFormSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteShareholder(deleteTarget.id);
      setShareholders((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout title="Actionnaires" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head>
        <title>Actionnaires</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900">Actionnaires</h2>
              <p className="text-sm text-slate-500">
                Gérez les actionnaires (personnes ou entreprises) et leur pourcentage de détention.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom, email ou entreprise..."
                className="h-9 w-[260px] rounded-lg border-slate-200 pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canManageShareholders && (
              <Button
                type="button"
                onClick={openCreate}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Nouvel actionnaire
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {error && <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && !shareholders.length ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              Chargement des actionnaires...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actionnaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pourcentage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Entreprises liées
                    </th>
                    {canManageShareholders && (
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const ownerLabel =
                      s.ownerType === "USER" ? findUserLabel(s.ownerId) : findCompanyName(s.ownerId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-slate-700">
                              {s.ownerType === "USER" ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{ownerLabel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                            {ownerTypeLabel(s.ownerType)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {/* <Percent className="h-3 w-3" /> */}
                            <span>{s.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(s.companies ?? []).length === 0 && (
                              <span className="text-xs text-slate-400">Aucune entreprise liée</span>
                            )}
                            {(s.companies ?? []).map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                {c.name ?? c.id}
                              </span>
                            ))}
                          </div>
                        </td>
                        {canManageShareholders && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                onClick={() => openEdit(s)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => setDeleteTarget(s)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {!loading && !filtered.length && (
                    <tr>
                      <td colSpan={canManageShareholders ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-500">
                        Aucun actionnaire trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit dialog */}
        <Dialog open={formOpen} onOpenChange={(open) => !formSaving && setFormOpen(open)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "Modifier l'actionnaire" : "Nouvel actionnaire"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Type d&apos;actionnaire</label>
                <Select
                  value={form.ownerType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      ownerType: value as ShareholderOwnerType,
                      ownerId: "",
                    }))
                  }
                >
                  <option value="USER">Personne (utilisateur)</option>
                  <option value="COMPANY">Entreprise</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {form.ownerType === "USER" ? "Utilisateur" : "Entreprise actionnaire"}
                </label>
                {form.ownerType === "USER" ? (
                  <div className="space-y-1.5">
                    <Input
                      type="search"
                      placeholder="Rechercher un utilisateur..."
                      className="h-9 text-sm"
                      value={userSelectSearch}
                      onChange={(e) => setUserSelectSearch(e.target.value)}
                    />
                    <Select
                      value={form.ownerId}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, ownerId: value }))}
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {filteredUserSelectOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label} ({u.email})
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      type="search"
                      placeholder="Rechercher une entreprise..."
                      className="h-9 text-sm"
                      value={companySelectSearch}
                      onChange={(e) => setCompanySelectSearch(e.target.value)}
                    />
                    <Select
                      value={form.ownerId}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, ownerId: value }))}
                    >
                      <option value="">Sélectionner une entreprise</option>
                      {filteredCompanySelectOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Pourcentage de détention</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.percentage}
                  onChange={(e) => setForm((prev) => ({ ...prev, percentage: e.target.value }))}
                  className="w-32"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Entreprises liées</label>
                <Input
                  type="search"
                  placeholder="Rechercher dans les entreprises..."
                  className="h-9 text-sm"
                  value={linkedCompaniesSearch}
                  onChange={(e) => setLinkedCompaniesSearch(e.target.value)}
                />
                <select
                  multiple
                  className="mt-1 flex h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  value={form.companyIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm((prev) => ({ ...prev, companyIds: selected }));
                  }}
                >
                  {filteredLinkedCompanyOptions.length === 0 && (
                    <option value="" disabled>
                      Aucune entreprise disponible pour le moment.
                    </option>
                  )}
                  {filteredLinkedCompanyOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !formSaving && setFormOpen(false)}
                className="mr-2"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSubmitForm}
                disabled={formSaving || !form.ownerId || !form.percentage}
              >
                {formSaving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !deleteLoading && !open && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Supprimer l&apos;actionnaire</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer cet actionnaire ? Cette action est irréversible.
            </p>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !deleteLoading && setDeleteTarget(null)}
                className="mr-2"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="default"
                className="bg-red-500 hover:bg-red-600"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

