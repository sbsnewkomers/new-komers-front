"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  sendInvitation,
  fetchAllInvitations,
  acceptInvitation,
  rejectInvitation,
  invitationStatusLabel,
  invitationStatusColor,
  allowedInviteRoles,
  INVITATION_STATUSES,
  type InvitationItem,
  type InvitationStatus,
  type DataPerimeterItem,
  type NodeType,
} from "@/lib/invitationsApi";
import {
  fetchUserPermissionDetail,
  addOrUpdateNodeAccess,
  removeNodeAccess,
  grantEntityPermission,
  revokeEntityPermission,
  type UserPermissionDetail,
  type PermissionAction,
  type NodeType as PermNodeType,
  ALL_ACTIONS,
  NODE_TYPES,
  actionLabel,
  nodeTypeLabel,
} from "@/lib/permissionsAdminApi";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { useGroups, useCompanies, useBusinessUnits, useWorkspaces } from "@/hooks";
import { fetchStructureTree, type StructureTree } from "@/lib/structureApi";
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
  Check,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";

// Validation d'email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const roleBadgeColor: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  HEAD_MANAGER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusBadgeColor: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
};

type ActiveTab = "users" | "invitations";

export default function UsersPage() {
  const { user: currentUser } = usePermissionsContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");

  // ── Users state ──
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", role: "" as UserRole, status: "" as UserStatus });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Permissions state ──
  const [permOpen, setPermOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserItem | null>(null);
  const [permDetail, setPermDetail] = useState<UserPermissionDetail | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [addNodeType, setAddNodeType] = useState<PermNodeType>("GROUP");
  const [addNodeId, setAddNodeId] = useState("");
  const [addActions, setAddActions] = useState<PermissionAction[]>([]);
  const [companyIdForBU, setCompanyIdForBU] = useState("");

  const groupsHook = useGroups();
  const companiesHook = useCompanies();
  const busHook = useBusinessUnits(companyIdForBU || null);
  const workspacesHook = useWorkspaces();
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);

  // ── Invitations state ──
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invStatusFilter, setInvStatusFilter] = useState<InvitationStatus | "">("");
  const [invSearch, setInvSearch] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteExistingUser, setInviteExistingUser] = useState<UserItem | null>(null);
  const [inviteConfirmOpen, setInviteConfirmOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "END_USER" as UserRole,
  });
  const [invitePerimeter, setInvitePerimeter] = useState<DataPerimeterItem[]>([]);
  const [perimNodeType, setPerimNodeType] = useState<NodeType>("GROUP");
  const [perimNodeId, setPerimNodeId] = useState("");
  const [perimCompanyId, setPerimCompanyId] = useState("");
  const perimBusHook = useBusinessUnits(perimCompanyId || null);

  // ── Data loading ──
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await fetchUsers()); } catch { /* snackbar */ } finally { setLoading(false); }
  }, []);

  const loadInvitations = useCallback(async () => {
    setInvLoading(true);
    try { setInvitations(await fetchAllInvitations()); } catch { /* snackbar */ } finally { setInvLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  // Load invitations once on mount so the tab counter is accurate,
  // and reload when switching to the invitations tab to ensure freshness.
  useEffect(() => { loadInvitations(); }, [loadInvitations]);
  useEffect(() => { if (activeTab === "invitations") loadInvitations(); }, [activeTab, loadInvitations]);
  useEffect(() => { if (companyIdForBU && permOpen) busHook.fetchList(); }, [companyIdForBU, permOpen, busHook]);
  useEffect(() => { if (perimCompanyId && inviteOpen) perimBusHook.fetchList(); }, [perimCompanyId, inviteOpen, perimBusHook]);
  useEffect(() => {
    if (inviteOpen) {
      // Load structure tree for workspaces and standalone companies
      fetchStructureTree().then(data => {
        console.log("Complete structure tree:", data);
        console.log("Structure tree workspaces:", data?.workspaces);
        console.log("Structure tree standalone companies:", data?.standaloneCompanies);
        console.log("Structure tree groups:", data?.groups);
        setStructureTree(data);
      });
    }
  }, [inviteOpen]);
  useEffect(() => {
    if (permOpen) {
      // Load structure tree for permissions modal
      fetchStructureTree().then(data => {
        console.log("Permissions structure tree:", data);
        console.log("Permissions workspaces:", data?.workspaces);
        setStructureTree(data);
      });
    }
  }, [permOpen]);

  // Reset perimeter type when role changes
  useEffect(() => {
    if (inviteForm.role === "HEAD_MANAGER") {
      setPerimNodeType("WORKSPACE");
    } else {
      setPerimNodeType("GROUP");
    }
    setPerimNodeId("");
    setPerimCompanyId("");
  }, [inviteForm.role]);

  // ── Role-based invite options ──
  const currentRole = currentUser?.role as UserRole | undefined;
  const invitableRoles = useMemo(
    () => (currentRole ? allowedInviteRoles(currentRole) : []),
    [currentRole],
  );
  const defaultInviteRole: UserRole = useMemo(() => {
    if (invitableRoles.includes("END_USER" as UserRole)) return "END_USER";
    return (invitableRoles[0] as UserRole | undefined) ?? ("END_USER" as UserRole);
  }, [invitableRoles]);

  // ── Invite handlers ──
  const openInviteModal = () => {
    setInviteForm({ email: "", firstName: "", lastName: "", role: defaultInviteRole });
    setInvitePerimeter([]);
    // Pour HEAD_MANAGER, le type par défaut est WORKSPACE
    const defaultNodeType = defaultInviteRole === "HEAD_MANAGER" ? "WORKSPACE" : "GROUP";
    setPerimNodeType(defaultNodeType);
    setPerimNodeId("");
    setPerimCompanyId("");
    groupsHook.fetchList();
    companiesHook.fetchList();
    setInviteOpen(true);
  };

  const addPerimeterItem = () => {
    if (!perimNodeId) return;
    if (invitePerimeter.some((p) => p.nodeType === perimNodeType && p.nodeId === perimNodeId)) return;
    setInvitePerimeter((prev) => [...prev, { nodeType: perimNodeType, nodeId: perimNodeId }]);
    setPerimNodeId("");
  };

  const removePerimeterItem = (idx: number) => {
    setInvitePerimeter((prev) => prev.filter((_, i) => i !== idx));
  };

  const perimNodeOptions = useMemo(() => {
    let options;
    if (perimNodeType === "GROUP") options = groupsHook.list ?? [];
    else if (perimNodeType === "COMPANY") {
      // Combine all company sources
      const hookCompanies = companiesHook.list ?? [];
      const orgStandaloneCompanies = structureTree?.workspaces?.flatMap(org => org.standaloneCompanies) ?? [];
      const groupCompanies = structureTree?.groups?.flatMap(g => g.companies) ?? [];
      const completelyStandaloneCompanies = structureTree?.standaloneCompanies ?? [];

      console.log("Hook companies:", hookCompanies);
      console.log("Org standalone companies:", orgStandaloneCompanies);
      console.log("Group companies:", groupCompanies);
      console.log("Completely standalone companies:", completelyStandaloneCompanies);

      options = [...hookCompanies, ...orgStandaloneCompanies, ...groupCompanies, ...completelyStandaloneCompanies];
    }
    else if (perimNodeType === "WORKSPACE") {
      // Try both sources: useworkspaces hook and structureTree
      const hookOrgs = workspacesHook.list ?? [];
      const treeOrgs = structureTree?.workspaces ?? [];
      console.log("Hook workspaces:", hookOrgs);
      console.log("Tree workspaces:", treeOrgs);
      options = hookOrgs.length > 0 ? hookOrgs : treeOrgs;
    }
    else options = perimBusHook.list ?? [];

    console.log(`perimNodeType: ${perimNodeType}, final options:`, options);
    return options;
  }, [perimNodeType, groupsHook.list, companiesHook.list, structureTree, perimBusHook.list, workspacesHook.list]);

  const perimNodeName = (item: DataPerimeterItem) => {
    if (item.nodeType === "GROUP") {
      const list = groupsHook.list ?? [];
      return list.find((n: { id: string; name: string }) => n.id === item.nodeId)?.name ?? item.nodeId.slice(0, 8);
    }
    if (item.nodeType === "COMPANY") {
      // Check all company sources
      const hookCompanies = companiesHook.list ?? [];
      const orgStandaloneCompanies = structureTree?.workspaces?.flatMap(org => org.standaloneCompanies) ?? [];
      const groupCompanies = structureTree?.groups?.flatMap(g => g.companies) ?? [];
      const completelyStandaloneCompanies = structureTree?.standaloneCompanies ?? [];
      const allCompanies = [...hookCompanies, ...orgStandaloneCompanies, ...groupCompanies, ...completelyStandaloneCompanies];
      return allCompanies.find((n: { id: string; name: string }) => n.id === item.nodeId)?.name ?? item.nodeId.slice(0, 8);
    }
    if (item.nodeType === "WORKSPACE") {
      const list = structureTree?.workspaces ?? [];
      return list.find((n: { id: string; name: string }) => n.id === item.nodeId)?.name ?? item.nodeId.slice(0, 8);
    }
    // BUSINESS_UNIT
    const list = perimBusHook.list ?? [];
    return list.find((n: { id: string; name: string }) => n.id === item.nodeId)?.name ?? item.nodeId.slice(0, 8);
  };

  const nodeTypeLabelFr = (t: NodeType) =>
    t === "GROUP" ? "Groupe" : t === "COMPANY" ? "Entreprise" : t === "WORKSPACE" ? "Workspace" : "Unité d'affaires";

  const sendInviteRequest = async () => {
    setInviteLoading(true);
    try {
      await sendInvitation({
        email: inviteForm.email,
        role: inviteForm.role,
        firstName: inviteForm.firstName || undefined,
        lastName: inviteForm.lastName || undefined,
        dataPerimeter: invitePerimeter.length > 0 ? invitePerimeter : undefined,
      });
      setInviteConfirmOpen(false);
      setInviteExistingUser(null);
      setInviteOpen(false);
      loadInvitations();
      loadUsers();
    } catch { /* snackbar */ } finally {
      setInviteLoading(false);
    }
  };

  const handleInvite = async () => {
    const email = inviteForm.email.trim().toLowerCase();
    if (!email) return;

    const existing = users.find(
      (u) => u.email.toLowerCase() === email && u.status === "ACTIVE",
    );

    if (existing) {
      setInviteExistingUser(existing);
      setInviteConfirmOpen(true);
      return;
    }

    await sendInviteRequest();
  };

  // ── Accept / Reject ──
  const handleAccept = async (inv: InvitationItem) => {
    try {
      await acceptInvitation(inv.token);
      loadInvitations();
      loadUsers();
    } catch { /* snackbar */ }
  };

  const handleReject = async (inv: InvitationItem) => {
    try {
      await rejectInvitation(inv.token);
      loadInvitations();
      loadUsers();
    } catch { /* snackbar */ }
  };

  // ── Edit / Delete users (unchanged logic) ──
  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", role: u.role, status: u.status });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await updateUser(editUser.id, { firstName: editForm.firstName || undefined, lastName: editForm.lastName || undefined, role: editForm.role, status: editForm.status });
      setEditOpen(false);
      loadUsers();
    } catch { /* snackbar */ } finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await deleteUser(deleteTarget.id); setDeleteOpen(false); setDeleteTarget(null); loadUsers(); } catch { /* snackbar */ } finally { setDeleteLoading(false); }
  };

  // ── Permissions handlers (unchanged) ──
  const openPermissions = async (u: UserItem) => {
    setPermUser(u); setPermOpen(true); setPermLoading(true);
    // Pour HEAD_MANAGER, le type par défaut est WORKSPACE
    const defaultNodeType = u.role === "HEAD_MANAGER" ? "WORKSPACE" : "GROUP";
    setAddNodeType(defaultNodeType); setAddNodeId(""); setAddActions([]); setCompanyIdForBU("");
    groupsHook.fetchList(); companiesHook.fetchList();
    try { setPermDetail(await fetchUserPermissionDetail(u.id)); } catch { setPermDetail(null); } finally { setPermLoading(false); }
  };

  const refreshPerm = async () => {
    if (!permUser) return;
    try { setPermDetail(await fetchUserPermissionDetail(permUser.id)); } catch { setPermDetail(null); }
  };

  const handleGrantEntity = async (nt: PermNodeType, a: PermissionAction) => { if (!permUser) return; await grantEntityPermission(permUser.id, nt, a); refreshPerm(); };
  const handleRevokeEntity = async (nt: PermNodeType, a: PermissionAction) => { if (!permUser) return; await revokeEntityPermission(permUser.id, nt, a); refreshPerm(); };
  const handleAddNodeAccess = async () => {
    if (!permUser || !addNodeId || addActions.length === 0) return;
    await addOrUpdateNodeAccess(permUser.id, addNodeType, addNodeId, addActions);
    setAddNodeId(""); setAddActions([]); refreshPerm();
  };
  const handleRemoveNode = async (accessId: string) => { if (!permUser) return; await removeNodeAccess(permUser.id, accessId); refreshPerm(); };
  const hasEntityPerm = (nt: PermNodeType, a: PermissionAction) => permDetail?.entityPermissions?.some((p) => p.nodeType === nt && p.action === a) ?? false;
  const permNodeOptions = useMemo(() => {
    // Pour les HEAD_MANAGER, n'afficher que les workspaces
    if (permUser?.role === "HEAD_MANAGER") {
      return structureTree?.workspaces ?? [];
    }

    // Pour les autres rôles, afficher toutes les options
    return addNodeType === "GROUP" ? (groupsHook.list ?? []) :
      addNodeType === "COMPANY" ? (companiesHook.list ?? []) :
        addNodeType === "WORKSPACE" ? (structureTree?.workspaces ?? []) :
          (busHook.list ?? []);
  }, [addNodeType, groupsHook.list, companiesHook.list, structureTree, busHook.list, permUser?.role]);

  // ── Filtered data ──
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.email.toLowerCase().includes(q) || (u.firstName || "").toLowerCase().includes(q) || (u.lastName || "").toLowerCase().includes(q);
    return matchesSearch && (!roleFilter || u.role === roleFilter) && (!statusFilter || u.status === statusFilter);
  });

  const filteredInv = invitations.filter((inv) => {
    const q = invSearch.toLowerCase();
    const matchesSearch = !q || inv.email.toLowerCase().includes(q);
    return matchesSearch && (!invStatusFilter || inv.status === invStatusFilter);
  });

  const pendingInv = filteredInv.filter((inv) => inv.status === "PENDING");
  const archivedInv = filteredInv.filter((inv) => inv.status !== "PENDING");

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    pending: users.filter((u) => u.status === "PENDING").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
  };

  const invStats = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === "PENDING").length,
    accepted: invitations.filter((i) => i.status === "ACCEPTED").length,
    rejected: invitations.filter((i) => i.status === "REJECTED").length,
  };

  const isExpired = (inv: InvitationItem) => new Date(inv.expiresAt) < new Date();

  return (
    <AppLayout title="User Management" companies={[]} selectedCompanyId="" onCompanyChange={() => { }}>
      <Head><title>Gestion des utilisateurs</title></Head>
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
              <h2 className="text-xl font-bold text-primary">Utilisateurs &amp; Invitations</h2>
              <p className="text-sm text-slate-500">G&eacute;rez les utilisateurs, invitations et permissions.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {invitableRoles.length > 0 && (
            <Button onClick={openInviteModal} className="h-9 gap-2 bg-slate-900 text-white hover:bg-slate-800">
              <Send className="h-4 w-4" />
              Inviter un utilisateur
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {([
            { key: "users" as ActiveTab, label: "Utilisateurs", count: stats.total },
            { key: "invitations" as ActiveTab, label: "Invitations", count: invStats.total },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
              <span className={`ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════ USERS TAB ═══════════════ */}
        {activeTab === "users" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {([
                { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-slate-50" },
                { label: "Actifs", value: stats.active, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "En attente", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50" },
                { label: "Suspendus", value: stats.suspended, color: "text-red-600", bg: "bg-red-50" },
              ]).map((s) => (
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
                <Input placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-10 border-slate-200 bg-white" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter} className="h-9 w-fit! border-slate-200 bg-white text-sm">
                <option value="">Tous les r&ocirc;les</option>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter} className="h-9 w-fit! border-slate-200 bg-white text-sm">
                <option value="">Tous les statuts</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50"><Users className="h-6 w-6 text-slate-300" /></div>
                  <h3 className="text-sm font-medium text-slate-900">Aucun utilisateur trouv&eacute;</h3>
                  <p className="mt-1 text-sm text-slate-500">{search || roleFilter || statusFilter ? "Essayez de modifier vos filtres." : "Invitez votre premier utilisateur."}</p>
                </div>
              ) : (
                <div className="overflow-x-visible">
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
                      {filtered.map((u) => {
                        const isProtectedSuperAdmin =
                          u.role === "SUPER_ADMIN" && currentUser?.role === "ADMIN";
                        return (
                          <tr key={u.id} className="group transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                                  {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "\u2014"}</p>
                                  <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleBadgeColor[u.role]}`}>
                                <Shield className="h-3 w-3" />{roleLabel(u.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusBadgeColor[u.status]}`}>
                                {statusLabel(u.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "\u2014"}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm group-hover:opacity-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52">
                                    {!isProtectedSuperAdmin && (
                                      <>
                                        <DropdownMenuItem onClick={() => openEdit(u)}>
                                          <Pencil className="mr-2 h-4 w-4" /> Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openPermissions(u)}>
                                          <KeyRound className="mr-2 h-4 w-4" /> Permissions
                                        </DropdownMenuItem>
                                        {u.status === "ACTIVE" && (
                                          <DropdownMenuItem
                                            onClick={async () => {
                                              await updateUser(u.id, { status: "SUSPENDED" });
                                              loadUsers();
                                            }}
                                          >
                                            <UserX className="mr-2 h-4 w-4" /> Suspendre
                                          </DropdownMenuItem>
                                        )}
                                        {u.status === "SUSPENDED" && (
                                          <DropdownMenuItem
                                            onClick={async () => {
                                              await updateUser(u.id, { status: "ACTIVE" });
                                              loadUsers();
                                            }}
                                          >
                                            <Mail className="mr-2 h-4 w-4" /> R&eacute;activer
                                          </DropdownMenuItem>
                                        )}
                                        {u.id !== currentUser?.id && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setDeleteTarget(u);
                                              setDeleteOpen(true);
                                            }}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                    {isProtectedSuperAdmin && (
                                      <DropdownMenuItem disabled>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Super-admin g&eacute;r&eacute; uniquement par un super-admin
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ INVITATIONS TAB ═══════════════ */}
        {activeTab === "invitations" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {([
                { label: "Total", value: invStats.total, color: "text-slate-900", bg: "bg-slate-50" },
                { label: "En attente", value: invStats.pending, color: "text-yellow-700", bg: "bg-yellow-50" },
                { label: "Accept\u00e9es", value: invStats.accepted, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Rejet\u00e9es", value: invStats.rejected, color: "text-red-600", bg: "bg-red-50" },
              ]).map((s) => (
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
                <Input placeholder="Rechercher par email..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="h-9 pl-10 border-slate-200 bg-white" />
              </div>
              <Select value={invStatusFilter} onValueChange={(v) => setInvStatusFilter(v as InvitationStatus | "")} className="h-9 w-fit! border-slate-200 bg-white text-sm">
                <option value="">Tous les statuts</option>
                {INVITATION_STATUSES.map((s) => <option key={s} value={s}>{invitationStatusLabel(s)}</option>)}
              </Select>
            </div>

            {/* Pending Invitations Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {invLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                </div>
              ) : pendingInv.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50"><Send className="h-6 w-6 text-slate-300" /></div>
                  <h3 className="text-sm font-medium text-slate-900">Aucune invitation en attente</h3>
                  <p className="mt-1 text-sm text-slate-500">{invSearch || invStatusFilter ? "Essayez de modifier vos filtres." : "Toutes les invitations ont \u00e9t\u00e9 trait\u00e9es."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">P&eacute;rim&egrave;tre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Expire le</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingInv.map((inv) => {
                        const invitedUser = users.find(
                          (u) => u.email.toLowerCase() === inv.email.toLowerCase(),
                        );
                        const canModerate =
                          invitedUser && invitedUser.status === "PENDING";

                        return (
                          <tr key={inv.id} className="group transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                              <p className="text-xs text-slate-400">Envoy&eacute; le {new Date(inv.createdAt).toLocaleDateString("fr-FR")}</p>
                            </td>
                            <td className="px-6 py-4">
                              {inv.role && (
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleBadgeColor[inv.role]}`}>
                                  <Shield className="h-3 w-3" />{roleLabel(inv.role)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${invitationStatusColor(inv.status)}`}>
                                {inv.status === "PENDING" && <Clock className="h-3 w-3" />}
                                {inv.status === "ACCEPTED" && <Check className="h-3 w-3" />}
                                {inv.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                                {invitationStatusLabel(inv.status)}
                              </span>
                              {inv.status === "PENDING" && isExpired(inv) && (
                                <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">Expir&eacute;e</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {inv.dataPerimeter && inv.dataPerimeter.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {inv.dataPerimeter.map((dp, i) => (
                                    <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                      {nodeTypeLabelFr(dp.nodeType)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">&mdash;</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {canModerate && !isExpired(inv) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAccept(inv)}
                                      className="flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Accepter
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReject(inv)}
                                      className="flex h-8 items-center gap-1 rounded-lg bg-red-50 px-3 text-xs font-medium text-red-600 transition hover:bg-red-100"
                                    >
                                      <XCircle className="h-3.5 w-3.5" /> Rejeter
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    {invitedUser
                                      ? `Utilisateur déjà ${statusLabel(invitedUser.status)}`
                                      : "L'utilisateur n'a pas encore utilis\u00e9 l'invitation"}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Archived Invitations (non-pending) */}
            {archivedInv.length > 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">Invitations archivées</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">Email</th>
                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le</th>
                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                        <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">Expire le</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archivedInv.map((inv) => (
                        <tr key={inv.id} className="bg-white/60">
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                            <p className="text-[11px] text-slate-400">Envoy\u00e9 le {new Date(inv.createdAt).toLocaleDateString("fr-FR")}</p>
                          </td>
                          <td className="px-4 py-2">
                            {inv.role && (
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleBadgeColor[inv.role]}`}>
                                <Shield className="h-3 w-3" />{roleLabel(inv.role)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${invitationStatusColor(inv.status)}`}>
                              {inv.status === "ACCEPTED" && <Check className="h-3 w-3" />}
                              {inv.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                              {invitationStatusLabel(inv.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-500">
                            {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════ INVITE MODAL ═══════════════ */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-slate-700" /> Inviter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Pr&eacute;nom</label>
                <Input value={inviteForm.firstName} onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="John" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</label>
                <Input value={inviteForm.lastName} onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
              </div>
            </div> */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email <span className="text-red-500">*</span></label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@exemple.com" required />
              {inviteForm.email && !isValidEmail(inviteForm.email) && (
                <p className="mt-1 text-xs text-red-500">Veuillez entrer une adresse email valide</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">R&ocirc;le <span className="text-red-500">*</span></label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => {
                  const role = v as UserRole;
                  setInviteForm((f) => ({ ...f, role }));
                  if (role === "ADMIN") {
                    setInvitePerimeter([]);
                  }
                }}
              >
                {invitableRoles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </Select>
            </div>

            {/* Data Perimeter */}
            {inviteForm.role !== "ADMIN" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">P&eacute;rim&egrave;tre d&rsquo;acc&egrave;s <span className="text-red-500">*</span></label>
                <p className="mb-3 text-xs text-slate-400">
                  {inviteForm.role === "HEAD_MANAGER"
                    ? "Définir l'workspace accessible (obligatoire). L'héritage hiérarchique s'applique automatiquement."
                    : "Définir les groupes, entreprises ou BU accessibles. L'héritage hiérarchique s'applique automatiquement."
                  }
                </p>

                {invitePerimeter.length > 0 && inviteForm.role !== "HEAD_MANAGER" && (
                  <ul className="mb-3 space-y-1.5">
                    {invitePerimeter.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{nodeTypeLabelFr(item.nodeType)}</span>
                          <span className="text-sm text-slate-700">{perimNodeName(item)}</span>
                        </div>
                        <button type="button" onClick={() => removePerimeterItem(idx)} className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {inviteForm.role === "HEAD_MANAGER" ? (
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Workspace</label>
                    <select
                      value={invitePerimeter.length > 0 ? invitePerimeter[0].nodeId : ""}
                      onChange={(e) => {
                        const workspaceId = e.target.value;
                        if (workspaceId) {
                          const selectedWorkspace = perimNodeOptions.find(n => n.id === workspaceId);
                          if (selectedWorkspace) {
                            setInvitePerimeter([{
                              nodeId: selectedWorkspace.id,
                              nodeType: "WORKSPACE"
                            }]);
                          }
                        } else {
                          setInvitePerimeter([]);
                        }
                      }}
                      className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-700"
                    >
                      <option value="">Choisir un workspace&hellip;</option>
                      {perimNodeOptions.map((n: { id: string; name: string }) => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Type</label>
                        <select
                          value={perimNodeType}
                          onChange={(e) => { setPerimNodeType(e.target.value as NodeType); setPerimNodeId(""); if (e.target.value !== "BUSINESS_UNIT") setPerimCompanyId(""); }}
                          className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700"
                        >
                          <>
                            <option value="GROUP">Groupe</option>
                            <option value="COMPANY">Entreprise</option>
                            <option value="WORKSPACE">Workspace</option>
                            <option value="BUSINESS_UNIT">Unit&eacute; d&rsquo;affaires</option>
                          </>
                        </select>
                      </div>
                      {perimNodeType === "BUSINESS_UNIT" && (
                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Entreprise</label>
                          <select
                            value={perimCompanyId}
                            onChange={(e) => { setPerimCompanyId(e.target.value); setPerimNodeId(""); }}
                            className="h-8 min-w-[140px] rounded border border-slate-200 bg-white px-2 text-xs text-slate-700"
                          >
                            <option value="">Choisir&hellip;</option>
                            {(companiesHook.list ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">&Eacute;l&eacute;ment</label>
                        <select
                          value={perimNodeId}
                          onChange={(e) => setPerimNodeId(e.target.value)}
                          disabled={perimNodeType === "BUSINESS_UNIT" && !perimCompanyId}
                          className="h-8 min-w-[140px] rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 disabled:opacity-50"
                        >
                          <option value="">Choisir&hellip;</option>
                          {perimNodeOptions.map((n: { id: string; name: string }) => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <Button onClick={addPerimeterItem} disabled={!perimNodeId} className="h-8 px-3 text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Ajouter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button
              onClick={handleInvite}
              disabled={
                inviteLoading ||
                !inviteForm.email ||
                !isValidEmail(inviteForm.email) ||
                (inviteForm.role === "END_USER" && invitePerimeter.length === 0) ||
                (inviteForm.role === "MANAGER" && invitePerimeter.length === 0) ||
                (inviteForm.role === "HEAD_MANAGER" && invitePerimeter.length === 0)
              }
            >
              {inviteLoading ? "Envoi\u2026" : "Envoyer l\u2019invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing user confirmation dialog */}
      <Dialog open={inviteConfirmOpen} onOpenChange={setInviteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Utilisateur déjà existant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-700">
            <p>Un utilisateur avec cet email existe déjà dans l’application :</p>
            {inviteExistingUser && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="font-medium text-slate-900">
                  {(inviteExistingUser.firstName ?? "")} {(inviteExistingUser.lastName ?? "")}
                </div>
                <div className="text-xs text-slate-500">{inviteExistingUser.email}</div>
              </div>
            )}
            <p>
              Confirmez-vous vouloir lui attribuer ce nouveau périmètre d’accès
              et lui envoyer l’email d’information&nbsp;?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setInviteConfirmOpen(false);
                setInviteExistingUser(null);
              }}
              disabled={inviteLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={sendInviteRequest}
              disabled={inviteLoading}
            >
              {inviteLoading ? "Envoi..." : "Confirmer l’invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ EDIT MODAL ═══════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier l&apos;utilisateur</DialogTitle></DialogHeader>
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
            <Button onClick={handleEdit} disabled={editLoading}>{editLoading ? "Enregistrement\u2026" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ DELETE MODAL ═══════════════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="py-2 text-sm text-slate-600">Supprimer <strong>{deleteTarget?.email}</strong> ? Cette action est irr&eacute;versible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Suppression\u2026" : "Supprimer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ PERMISSIONS MODAL ═══════════════ */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-slate-700" /> Permissions &mdash; {permUser?.email}</DialogTitle>
          </DialogHeader>
          {permLoading ? (
            <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" /></div>
          ) : !permDetail ? (
            <p className="py-6 text-center text-sm text-slate-400">Impossible de charger les permissions.</p>
          ) : (
            <div className="space-y-6 py-2">
              {/* Entity-level */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Permissions par entit&eacute;</h3>
                <p className="mb-4 text-xs text-slate-500">Accorder des droits sur tous les &eacute;l&eacute;ments d&apos;un type.</p>
                <div className="space-y-3">
                  {NODE_TYPES.map((nt) => (
                    <div key={nt} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{nodeTypeLabel(nt)}</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ACTIONS.map((action) => {
                          const granted = hasEntityPerm(nt, action);
                          return (
                            <button key={action} type="button" onClick={() => granted ? handleRevokeEntity(nt, action) : handleGrantEntity(nt, action)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors ${granted ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "border-slate-200 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}>
                              {granted && <span className="text-emerald-500">&#10003;</span>}{actionLabel(action)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Node-level */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Acc&egrave;s par n&oelig;ud</h3>
                <p className="mb-4 text-xs text-slate-500">Acc&egrave;s &agrave; un workspace, un groupe, une entreprise, ou une BU sp&eacute;cifique.</p>
                {(permDetail.nodeAccesses?.length ?? 0) > 0 ? (
                  <ul className="mb-4 space-y-2">
                    {permDetail.nodeAccesses.map((na) => {
                      const nodeName = na.nodeType === "GROUP" ? (groupsHook.list ?? []).find((g) => g.id === na.nodeId)?.name : na.nodeType === "COMPANY" ? (companiesHook.list ?? []).find((c) => c.id === na.nodeId)?.name : na.nodeType === "WORKSPACE" ? (structureTree?.workspaces ?? []).find((w) => w.id === na.nodeId)?.name : (busHook.list ?? []).find((b) => b.id === na.nodeId)?.name;
                      return (
                        <li key={na.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div>
                            <span className="text-xs font-semibold uppercase text-slate-500">{nodeTypeLabel(na.nodeType)}</span>
                            <span className="mx-1.5 text-slate-300">|</span>
                            <span className="text-sm font-medium text-slate-900">{nodeName ?? na.nodeId.slice(0, 8)}</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {na.actions.map((a) => (<span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{actionLabel(a)}</span>))}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveNode(na.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mb-4 rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">Aucun acc&egrave;s n&oelig;ud configur&eacute;.</p>
                )}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ajouter un acc&egrave;s</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Type</label>
                      {permUser?.role === "HEAD_MANAGER" ? (
                        <div className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                          Workspace uniquement
                        </div>
                      ) : (
                        <select value={addNodeType} onChange={(e) => { setAddNodeType(e.target.value as PermNodeType); setAddNodeId(""); if (e.target.value !== "BUSINESS_UNIT") setCompanyIdForBU(""); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                          {NODE_TYPES.map((n) => <option key={n} value={n}>{nodeTypeLabel(n)}</option>)}
                        </select>
                      )}
                    </div>
                    {addNodeType === "BUSINESS_UNIT" && (
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Entreprise</label>
                        <select value={companyIdForBU} onChange={(e) => { setCompanyIdForBU(e.target.value); setAddNodeId(""); }} className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                          <option value="">Choisir&hellip;</option>
                          {(companiesHook.list ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">&Eacute;l&eacute;ment</label>
                      <select value={addNodeId} onChange={(e) => setAddNodeId(e.target.value)} disabled={addNodeType === "BUSINESS_UNIT" && !companyIdForBU} className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-50">
                        <option value="">Choisir&hellip;</option>
                        {permNodeOptions.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-slate-400">Actions</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ACTIONS.map((a) => (
                          <label key={a} className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 has-checked:border-blue-300 has-checked:bg-blue-50 has-checked:text-blue-700">
                            <input type="checkbox" checked={addActions.includes(a)} onChange={() => setAddActions((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])} className="sr-only" />
                            {actionLabel(a)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddNodeAccess} disabled={!addNodeId || addActions.length === 0} className="h-9">Ajouter</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setPermOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
