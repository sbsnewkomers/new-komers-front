"use client";

import { useEffect, useState, useCallback } from "react";
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
  fetchUsers,
  inviteUser,
  updateUser,
  deleteUser,
  roleLabel,
  statusLabel,
  ALL_ROLES,
  ALL_STATUSES,
  type UserItem,
  type UserRole,
  type UserStatus,
} from "@/lib/usersApi";
import {
  fetchUserPermissionDetail,
  addOrUpdateNodeAccess,
  setNodeAccessActions,
  removeNodeAccess,
  grantEntityPermission,
  revokeEntityPermission,
  type UserPermissionDetail,
  type PermissionAction,
  type NodeType,
  ALL_ACTIONS,
  NODE_TYPES,
  actionLabel,
  nodeTypeLabel,
} from "@/lib/permissionsAdminApi";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { useGroups, useCompanies, useBusinessUnits } from "@/hooks";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  UserX,
  Pencil,
  Trash2,
  Users,
  KeyRound,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";

const roleBadgeColor: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusBadgeColor: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
};

export default function UsersPage() {
  const { user: currentUser } = usePermissionsContext();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", role: "END_USER" as UserRole });
  const [inviteLoading, setInviteLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", role: "" as UserRole, status: "" as UserStatus });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [permOpen, setPermOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserItem | null>(null);
  const [permDetail, setPermDetail] = useState<UserPermissionDetail | null>(null);
  const [permLoading, setPermLoading] = useState(false);

  const [addNodeType, setAddNodeType] = useState<NodeType>("GROUP");
  const [addNodeId, setAddNodeId] = useState("");
  const [addActions, setAddActions] = useState<PermissionAction[]>([]);
  const [companyIdForBU, setCompanyIdForBU] = useState("");

  const groupsHook = useGroups();
  const companiesHook = useCompanies();
  const busHook = useBusinessUnits(companyIdForBU || null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch { /* snackbar handles */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (companyIdForBU && permOpen) busHook.fetchList();
  }, [companyIdForBU, permOpen]);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      await inviteUser({
        email: inviteForm.email,
        role: inviteForm.role,
        firstName: inviteForm.firstName || undefined,
        lastName: inviteForm.lastName || undefined,
      });
      setInviteOpen(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "END_USER" });
      loadUsers();
    } catch { /* snackbar handles */ } finally {
      setInviteLoading(false);
    }
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setEditForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      role: u.role,
      status: u.status,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await updateUser(editUser.id, {
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
        role: editForm.role,
        status: editForm.status,
      });
      setEditOpen(false);
      loadUsers();
    } catch { /* snackbar handles */ } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      loadUsers();
    } catch { /* snackbar handles */ } finally {
      setDeleteLoading(false);
    }
  };

  const openPermissions = async (u: UserItem) => {
    setPermUser(u);
    setPermOpen(true);
    setPermLoading(true);
    setAddNodeType("GROUP");
    setAddNodeId("");
    setAddActions([]);
    setCompanyIdForBU("");
    groupsHook.fetchList();
    companiesHook.fetchList();
    try {
      const d = await fetchUserPermissionDetail(u.id);
      setPermDetail(d);
    } catch { setPermDetail(null); }
    finally { setPermLoading(false); }
  };

  const refreshPerm = async () => {
    if (!permUser) return;
    try {
      const d = await fetchUserPermissionDetail(permUser.id);
      setPermDetail(d);
    } catch { setPermDetail(null); }
  };

  const handleGrantEntity = async (nodeType: NodeType, action: PermissionAction) => {
    if (!permUser) return;
    await grantEntityPermission(permUser.id, nodeType, action);
    refreshPerm();
  };

  const handleRevokeEntity = async (nodeType: NodeType, action: PermissionAction) => {
    if (!permUser) return;
    await revokeEntityPermission(permUser.id, nodeType, action);
    refreshPerm();
  };

  const handleAddNodeAccess = async () => {
    if (!permUser || !addNodeId || addActions.length === 0) return;
    await addOrUpdateNodeAccess(permUser.id, addNodeType, addNodeId, addActions);
    setAddNodeId("");
    setAddActions([]);
    refreshPerm();
  };

  const handleRemoveNode = async (accessId: string) => {
    if (!permUser) return;
    await removeNodeAccess(permUser.id, accessId);
    refreshPerm();
  };

  const hasEntityPerm = (nodeType: NodeType, action: PermissionAction) =>
    permDetail?.entityPermissions?.some(
      (p) => p.nodeType === nodeType && p.action === action
    ) ?? false;

  const nodeOptions =
    addNodeType === "GROUP"
      ? (groupsHook.list ?? [])
      : addNodeType === "COMPANY"
        ? (companiesHook.list ?? [])
        : (busHook.list ?? []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      u.email.toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.lastName || "").toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    pending: users.filter((u) => u.status === "PENDING").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
  };

  return (
    <AppLayout title="User Management" companies={[]} selectedCompanyId="" onCompanyChange={() => {}}>
      <Head><title>Gestion des utilisateurs</title></Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Utilisateurs</h2>
            <p className="text-sm text-slate-500">G&eacute;rez les utilisateurs et leurs r&ocirc;les.</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="h-9 gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            Inviter un utilisateur
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-slate-50" },
            { label: "Actifs", value: stats.active, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "En attente", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Suspendus", value: stats.suspended, color: "text-red-600", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-200 p-4 ${s.bg}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-10 border-slate-200 bg-white"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter} className="h-9 w-[160px] border-slate-200 bg-white text-sm">
            <option value="">Tous les r&ocirc;les</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter} className="h-9 w-[160px] border-slate-200 bg-white text-sm">
            <option value="">Tous les statuts</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">Aucun utilisateur trouv&eacute;</h3>
              <p className="mt-1 text-sm text-slate-500">
                {search || roleFilter || statusFilter ? "Essayez de modifier vos filtres." : "Invitez votre premier utilisateur."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cr&eacute;&eacute; le</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleBadgeColor[u.role]}`}>
                          <Shield className="h-3 w-3" />
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusBadgeColor[u.status]}`}>
                          {statusLabel(u.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEdit(u)}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPermissions(u)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Permissions
                              </DropdownMenuItem>
                              {u.status === "ACTIVE" && (
                                <DropdownMenuItem onClick={async () => { await updateUser(u.id, { status: "SUSPENDED" }); loadUsers(); }}>
                                  <UserX className="mr-2 h-4 w-4" /> Suspendre
                                </DropdownMenuItem>
                              )}
                              {u.status === "SUSPENDED" && (
                                <DropdownMenuItem onClick={async () => { await updateUser(u.id, { status: "ACTIVE" }); loadUsers(); }}>
                                  <Mail className="mr-2 h-4 w-4" /> R&eacute;activer
                                </DropdownMenuItem>
                              )}
                              {u.id !== currentUser?.id && (
                                <DropdownMenuItem
                                  onClick={() => { setDeleteTarget(u); setDeleteOpen(true); }}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Pr&eacute;nom</label>
                <Input value={inviteForm.firstName} onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="John" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</label>
                <Input value={inviteForm.lastName} onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email *</label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@exemple.com" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le *</label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v as UserRole }))}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteForm.email}>
              {inviteLoading ? "Envoi..." : "Envoyer l\u2019invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Pr&eacute;nom</label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le</label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as UserRole }))}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as UserStatus }))}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-slate-600">
            Supprimer <strong>{deleteTarget?.email}</strong> ? Cette action est irr&eacute;versible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Permissions Modal */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-slate-700" />
              Permissions &mdash; {permUser?.email}
            </DialogTitle>
          </DialogHeader>

          {permLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            </div>
          ) : !permDetail ? (
            <p className="py-6 text-center text-sm text-slate-400">Impossible de charger les permissions.</p>
          ) : (
            <div className="space-y-6 py-2">
              {/* Entity-level permissions */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Permissions par entit&eacute;</h3>
                <p className="mb-4 text-xs text-slate-500">Accorder des droits sur tous les &eacute;l&eacute;ments d&apos;un type.</p>
                <div className="space-y-3">
                  {NODE_TYPES.map((nodeType) => (
                    <div key={nodeType} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {nodeTypeLabel(nodeType)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ACTIONS.map((action) => {
                          const granted = hasEntityPerm(nodeType, action);
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => granted ? handleRevokeEntity(nodeType, action) : handleGrantEntity(nodeType, action)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                                granted
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                  : "border-slate-200 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                              }`}
                            >
                              {granted && <span className="text-emerald-500">&#10003;</span>}
                              {actionLabel(action)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Node-level accesses */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Acc&egrave;s par n&oelig;ud</h3>
                <p className="mb-4 text-xs text-slate-500">Acc&egrave;s &agrave; un groupe, une entreprise ou une BU sp&eacute;cifique.</p>

                {(permDetail.nodeAccesses?.length ?? 0) > 0 ? (
                  <ul className="mb-4 space-y-2">
                    {permDetail.nodeAccesses.map((na) => {
                      const nodeName =
                        na.nodeType === "GROUP"
                          ? (groupsHook.list ?? []).find((g) => g.id === na.nodeId)?.name
                          : na.nodeType === "COMPANY"
                            ? (companiesHook.list ?? []).find((c) => c.id === na.nodeId)?.name
                            : (busHook.list ?? []).find((b) => b.id === na.nodeId)?.name;
                      return (
                        <li key={na.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div>
                            <span className="text-xs font-semibold uppercase text-slate-500">{nodeTypeLabel(na.nodeType)}</span>
                            <span className="mx-1.5 text-slate-300">|</span>
                            <span className="text-sm font-medium text-slate-900">{nodeName ?? na.nodeId.slice(0, 8)}</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {na.actions.map((a) => (
                                <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  {actionLabel(a)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNode(na.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mb-4 rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                    Aucun acc&egrave;s n&oelig;ud configur&eacute;.
                  </p>
                )}

                {/* Add node access form */}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ajouter un acc&egrave;s</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Type</label>
                      <select
                        value={addNodeType}
                        onChange={(e) => { setAddNodeType(e.target.value as NodeType); setAddNodeId(""); if (e.target.value !== "BUSINESS_UNIT") setCompanyIdForBU(""); }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                      >
                        {NODE_TYPES.map((n) => <option key={n} value={n}>{nodeTypeLabel(n)}</option>)}
                      </select>
                    </div>
                    {addNodeType === "BUSINESS_UNIT" && (
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Entreprise</label>
                        <select
                          value={companyIdForBU}
                          onChange={(e) => { setCompanyIdForBU(e.target.value); setAddNodeId(""); }}
                          className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                        >
                          <option value="">Choisir&hellip;</option>
                          {(companiesHook.list ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">&Eacute;l&eacute;ment</label>
                      <select
                        value={addNodeId}
                        onChange={(e) => setAddNodeId(e.target.value)}
                        disabled={addNodeType === "BUSINESS_UNIT" && !companyIdForBU}
                        className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-50"
                      >
                        <option value="">Choisir&hellip;</option>
                        {nodeOptions.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Actions</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ACTIONS.map((a) => (
                          <label key={a} className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 has-checked:border-blue-300 has-checked:bg-blue-50 has-checked:text-blue-700">
                            <input
                              type="checkbox"
                              checked={addActions.includes(a)}
                              onChange={() => setAddActions((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])}
                              className="sr-only"
                            />
                            {actionLabel(a)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleAddNodeAccess}
                      disabled={!addNodeId || addActions.length === 0}
                      className="h-9"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
