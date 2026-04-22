"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  fetchShareholders,
  createShareholder,
  updateShareholder,
  deleteShareholder,
  type ShareholderDto,
  ownerTypeLabel,
} from "@/lib/shareholdersApi";
import { fetchUsers, type UserItem } from "@/lib/usersApi";
import { useCompanies } from "@/hooks";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import {
  ShareholderFormDialog,
  type ShareholderFormValues,
} from "@/components/shareholders/ShareholderFormDialog";
import { Users, Building2, Plus, Pencil, Trash2, Search } from "lucide-react";

export default function ShareholdersPage() {
  const { user } = usePermissionsContext();
  const [shareholders, setShareholders] = useState<ShareholderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<UserItem[]>([]);
  const companiesHook = useCompanies();

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<ShareholderFormValues> | undefined>();
  const [formSaving, setFormSaving] = useState(false);

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

  const userOptionsForDialog = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        secondary: u.email,
      })),
    [users],
  );

  const findUserLabel = (id: string): string => {
    const u = userOptionsForDialog.find((x) => x.id === id);
    if (!u) return id;
    return `${u.label} (${u.secondary})`;
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
    setFormInitial(undefined);
    setFormOpen(true);
  };

  const openEdit = (s: ShareholderDto) => {
    setFormInitial({
      id: s.id,
      ownerType: s.ownerType,
      ownerId: s.ownerId,
      percentage: s.percentage,
      companyIds: (s.companies ?? []).map((c) => c.id),
    });
    setFormOpen(true);
  };

  const handleSubmitForm = async (values: ShareholderFormValues) => {
    setFormSaving(true);
    try {
      if (values.id) {
        const updated = await updateShareholder(values.id, {
          ownerType: values.ownerType,
          ownerId: values.ownerId,
          percentage: values.percentage,
          companyIds: values.companyIds,
        });
        setShareholders((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createShareholder({
          ownerType: values.ownerType,
          ownerId: values.ownerId,
          percentage: values.percentage,
          companyIds: values.companyIds,
        });
        setShareholders((prev) => [created, ...prev]);
      }
      setFormOpen(false);
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
    <AppLayout title="Actionnaires" companies={[]} selectedCompanyId="" onCompanyChange={() => { }}>
      <Head>
        <title>Actionnaires</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users h-5 w-5 text-primary" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Actionnaires</h2>
              <p className="text-sm text-slate-500">Gérez les actionnaires (personnes ou entreprises) et leur pourcentage de détention.</p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher par nom, email ou entreprise..."
              className="h-9 w-full rounded-lg border-slate-200 pl-9 text-sm sm:w-[260px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManageShareholders && (
            <Button
              type="button"
              onClick={openCreate}
              className="w-full bg-primary text-white hover:bg-slate-800 sm:w-auto"
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

      <ShareholderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmitForm}
        saving={formSaving}
        initial={formInitial}
        userOptions={userOptionsForDialog}
        companyOptions={companyOptions}
      />

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !deleteLoading && !open && setDeleteTarget(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;actionnaire</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer cet actionnaire ? Cette action est irréversible.
            </p>
          </DialogBody>
          <DialogFooter>
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
    </AppLayout>
  );
}

