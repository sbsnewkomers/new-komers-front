import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { useGroups, useCompanies, useBusinessUnits } from "@/hooks";
import {
  fetchAdminUsers,
  fetchUserPermissionDetail,
  addOrUpdateNodeAccess,
  setNodeAccessActions,
  removeNodeAccess,
  grantEntityPermission,
  revokeEntityPermission,
  type UserListItem,
  type UserPermissionDetail,
  type NodeAccessDetail,
  type EntityPermissionDetail,
  type PermissionAction,
  type NodeType,
  ALL_ACTIONS,
  NODE_TYPES,
  actionLabel,
  nodeTypeLabel,
} from "@/lib/permissionsAdminApi";

export default function PermissionsAssignPage() {
  const router = useRouter();
  const { user: currentUser } = usePermissionsContext();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [detail, setDetail] = useState<UserPermissionDetail | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const groups = useGroups();
  const companies = useCompanies();
  const [companyIdForBU, setCompanyIdForBU] = useState<string>("");
  const businessUnits = useBusinessUnits(companyIdForBU || null);

  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (userId: string) => {
      setLoadingDetail(true);
      try {
        const d = await fetchUserPermissionDetail(userId);
        setDetail(d);
      } catch {
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!currentUser) return;
    if (!isAdmin) {
      router.replace("/403");
      return;
    }
    loadUsers();
  }, [currentUser, isAdmin, router, loadUsers]);

  useEffect(() => {
    if (!selectedUserId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedUserId);
  }, [selectedUserId, loadDetail]);

  useEffect(() => {
    groups.fetchList();
  }, []);
  useEffect(() => {
    companies.fetchList();
  }, []);
  useEffect(() => {
    if (companyIdForBU) businessUnits.fetchList();
  }, [companyIdForBU]);

  const refreshDetail = useCallback(() => {
    if (selectedUserId) loadDetail(selectedUserId);
  }, [selectedUserId, loadDetail]);

  const handleGrantEntity = async (nodeType: NodeType, action: PermissionAction) => {
    if (!selectedUserId) return;
    await grantEntityPermission(selectedUserId, nodeType, action);
    refreshDetail();
  };

  const handleRevokeEntity = async (nodeType: NodeType, action: PermissionAction) => {
    if (!selectedUserId) return;
    await revokeEntityPermission(selectedUserId, nodeType, action);
    refreshDetail();
  };

  const handleAddNodeAccess = async (
    nodeType: NodeType,
    nodeId: string,
    actions: PermissionAction[]
  ) => {
    if (!selectedUserId || actions.length === 0) return;
    await addOrUpdateNodeAccess(selectedUserId, nodeType, nodeId, actions);
    refreshDetail();
  };

  const handleSetNodeActions = async (accessId: string, actions: PermissionAction[]) => {
    if (!selectedUserId) return;
    await setNodeAccessActions(selectedUserId, accessId, actions);
    refreshDetail();
  };

  const handleRemoveNodeAccess = async (accessId: string) => {
    if (!selectedUserId || !confirm("Supprimer cet accès nœud ?")) return;
    await removeNodeAccess(selectedUserId, accessId);
    refreshDetail();
  };

  const hasEntityPerm = (nodeType: NodeType, action: PermissionAction) =>
    detail?.entityPermissions?.some(
      (p) => p.nodeType === nodeType && p.action === action
    ) ?? false;

  if (!currentUser) return null;
  if (!isAdmin) return null;

  return (
    <>
      <Head>
        <title>Attribution des permissions</title>
      </Head>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Attribution des permissions
            </h1>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Accueil
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-6 p-6">
          {/* User selector */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Utilisateur
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadUsers}
                disabled={loadingUsers}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Charger les utilisateurs
              </button>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="min-w-[220px] rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">— Choisir un utilisateur —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </section>

          {loadingDetail && (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Chargement…
            </p>
          )}

          {selectedUserId && detail && !loadingDetail && (
            <>
              {/* Entity-level permissions */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Permissions par entité (tous les éléments)
                </h2>
                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Accorder une action sur toute l&apos;entité (tous les groupes, toutes les entreprises, etc.)
                </p>
                <div className="space-y-4">
                  {NODE_TYPES.map((nodeType) => (
                    <div
                      key={nodeType}
                      className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-600 dark:bg-zinc-900/50"
                    >
                      <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {nodeTypeLabel(nodeType)}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ACTIONS.map((action) => {
                          const granted = hasEntityPerm(nodeType, action);
                          return (
                            <span
                              key={action}
                              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs dark:border-zinc-600"
                            >
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {actionLabel(action)}
                              </span>
                              {granted ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeEntity(nodeType, action)}
                                  className="rounded bg-red-100 px-1.5 py-0.5 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                                >
                                  Retirer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGrantEntity(nodeType, action)}
                                  className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
                                >
                                  Accorder
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Node-level accesses */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Accès par nœud (élément précis)
                </h2>
                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Accès à un groupe, une entreprise ou une unité d&apos;affaires en particulier.
                </p>

                <NodeAccessList
                  accesses={detail.nodeAccesses}
                  groups={groups.list ?? []}
                  companies={companies.list ?? []}
                  businessUnits={businessUnits.list ?? []}
                  companyIdForBU={companyIdForBU}
                  setCompanyIdForBU={setCompanyIdForBU}
                  onSetActions={handleSetNodeActions}
                  onRemove={handleRemoveNodeAccess}
                  onAddNodeAccess={handleAddNodeAccess}
                />
              </section>
            </>
          )}

          {selectedUserId && !detail && !loadingDetail && (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Impossible de charger les permissions.
            </p>
          )}
        </main>
      </div>
    </>
  );
}

type NodeAccessListProps = {
  accesses: NodeAccessDetail[];
  groups: { id: string; name: string }[];
  companies: { id: string; name: string; group_id?: string }[];
  businessUnits: { id: string; name: string; company_id?: string }[];
  companyIdForBU: string;
  setCompanyIdForBU: (id: string) => void;
  onSetActions: (accessId: string, actions: PermissionAction[]) => Promise<void>;
  onRemove: (accessId: string) => Promise<void>;
  onAddNodeAccess: (
    nodeType: NodeType,
    nodeId: string,
    actions: PermissionAction[]
  ) => Promise<void>;
};

function NodeAccessList({
  accesses,
  groups,
  companies,
  businessUnits,
  companyIdForBU,
  setCompanyIdForBU,
  onSetActions,
  onRemove,
  onAddNodeAccess,
}: NodeAccessListProps) {
  const [addNodeType, setAddNodeType] = useState<NodeType>("GROUP");
  const [addNodeId, setAddNodeId] = useState("");
  const [addActions, setAddActions] = useState<PermissionAction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActions, setEditActions] = useState<PermissionAction[]>([]);

  const nodeOptions =
    addNodeType === "GROUP"
      ? groups
      : addNodeType === "COMPANY"
        ? companies
        : businessUnits;

  const nodeLabel = (na: NodeAccessDetail) => {
    if (na.nodeType === "GROUP")
      return groups.find((g) => g.id === na.nodeId)?.name ?? na.nodeId.slice(0, 8);
    if (na.nodeType === "COMPANY")
      return companies.find((c) => c.id === na.nodeId)?.name ?? na.nodeId.slice(0, 8);
    return businessUnits.find((b) => b.id === na.nodeId)?.name ?? na.nodeId.slice(0, 8);
  };

  const whenNodeTypeChange = (newType: NodeType) => {
    setAddNodeType(newType);
    setAddNodeId("");
    if (newType !== "BUSINESS_UNIT") setCompanyIdForBU("");
  };

  const toggleAddAction = (a: PermissionAction) => {
    setAddActions((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const toggleEditAction = (a: PermissionAction) => {
    setEditActions((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const startEdit = (access: NodeAccessDetail) => {
    setEditingId(access.id);
    setEditActions([...access.actions]);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onSetActions(editingId, editActions);
    setEditingId(null);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNodeId || addActions.length === 0) return;
    await onAddNodeAccess(addNodeType, addNodeId, addActions);
    setAddNodeId("");
    setAddActions([]);
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {accesses.map((na) => (
          <li
            key={na.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 py-2 px-3 dark:border-zinc-600"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {nodeTypeLabel(na.nodeType)}: {nodeLabel(na)}
            </span>
            {editingId === na.id ? (
              <div className="flex flex-wrap items-center gap-2">
                {ALL_ACTIONS.map((a) => (
                  <label key={a} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={editActions.includes(a)}
                      onChange={() => toggleEditAction(a)}
                    />
                    {actionLabel(a)}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded border border-zinc-400 px-2 py-1 text-xs dark:border-zinc-500"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {na.actions.map(actionLabel).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(na)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(na.id)}
                  className="rounded border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400"
                >
                  Supprimer
                </button>
              </div>
            )}
          </li>
        ))}
        {accesses.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucun accès nœud. Ajoutez-en ci-dessous.
          </li>
        )}
      </ul>

      <form onSubmit={submitAdd} className="rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
        <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ajouter un accès nœud
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Type
            </label>
            <select
              value={addNodeType}
              onChange={(e) => whenNodeTypeChange(e.target.value as NodeType)}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              {NODE_TYPES.map((n) => (
                <option key={n} value={n}>
                  {nodeTypeLabel(n)}
                </option>
              ))}
            </select>
          </div>
          {addNodeType === "BUSINESS_UNIT" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                Entreprise
              </label>
              <select
                value={companyIdForBU}
                onChange={(e) => {
                  setCompanyIdForBU(e.target.value);
                  setAddNodeId("");
                }}
                className="min-w-[180px] rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">— Choisir une entreprise —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
              {addNodeType === "BUSINESS_UNIT" ? "Unité d'affaires" : "Élément"}
            </label>
            <select
              value={addNodeId}
              onChange={(e) => setAddNodeId(e.target.value)}
              disabled={addNodeType === "BUSINESS_UNIT" && !companyIdForBU}
              className="min-w-[180px] rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 disabled:opacity-50"
            >
              <option value="">
                {addNodeType === "BUSINESS_UNIT" && !companyIdForBU
                  ? "Choisir d'abord une entreprise"
                  : "— Choisir —"}
              </option>
              {nodeOptions.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Actions
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_ACTIONS.map((a) => (
                <label key={a} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={addActions.includes(a)}
                    onChange={() => toggleAddAction(a)}
                  />
                  {actionLabel(a)}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!addNodeId || addActions.length === 0}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Ajouter l&apos;accès
          </button>
        </div>
      </form>
    </div>
  );
}
