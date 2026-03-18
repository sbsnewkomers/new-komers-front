"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import {
  fetchStructureTree,
  type StructureTree,
  type TreeCompany,
  type TreeGroup,
} from "@/lib/structureApi";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { usePermissions } from "@/permissions/usePermissions";
import { CRUD_ACTION } from "@/permissions/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SiretInput, validateSiret } from "@/components/ui/SiretInput";
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
import {
  Folder,
  Building2,
  Package,
  MoreHorizontal,
  Plus,
  Upload,
  Play,
  Building,
  Briefcase,
  Layers,
  Star,
} from "lucide-react";
import {
  CompanyCreateWizard,
  type CompanyWizardForm,
} from "@/components/structure/CompanyCreateWizard";
import {
  fetchShareholdersByCompany,
  createShareholder,
  type ShareholderDto,
  ownerTypeLabel,
} from "@/lib/shareholdersApi";
import { fetchUsers, type UserItem } from "@/lib/usersApi";
import {
  ShareholderFormDialog,
  type ShareholderFormValues,
} from "@/components/shareholders/ShareholderFormDialog";
import { Select } from "@/components/ui/Select";

type BusinessUnit = {
  id: string;
  name: string;
  code: string;
  activity: string;
  siret: string;
  company_id?: string;
};

type GroupFull = {
  id: string;
  name: string;
  siret: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  mainActivity?: string;
};

type CompanyFull = {
  id: string;
  name: string;
  siret: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  address?: string;
  ape_code?: string;
  main_activity?: string;
  size?: string;
  model?: string;
  group_id: string;
};

type NodeUsersByRole = Record<
  string,
  {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }[]
>;

type TreeNode =
  | { type: "group"; id: string; name: string }
  | {
      type: "company";
      id: string;
      name: string;
      groupId: string | null;
      completionPercentage: number;
    }
  | { type: "bu"; id: string; name: string; companyId: string; code: string }
  | { type: "section-header"; id: string; name: string };

export default function StructurePage() {
  const { user, isAuthReady } = usePermissionsContext();
  const { can } = usePermissions();
  const canImportStructure =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";
  const canCreateCompany = can("companies", CRUD_ACTION.CREATE);
  const [tree, setTree] = useState<StructureTree | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [busByCompany, setBusByCompany] = useState<
    Record<string, BusinessUnit[]>
  >({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ficheOpen, setFicheOpen] = useState(false);
  const [ficheCompanyId, setFicheCompanyId] = useState<string | null>(null);
  const [ficheCompany, setFicheCompany] = useState<CompanyFull | null>(null);
  const [ficheTab, setFicheTab] = useState("informations");
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(
    new Set(),
  );

  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addCompanyGroupId, setAddCompanyGroupId] = useState<string | null>(
    null,
  );
  const [addCompanyForm, setAddCompanyForm] = useState({
    name: "",
    siret: "",
    fiscal_year_start: "",
    fiscal_year_end: "",
  });
  const [addCompanyLoading, setAddCompanyLoading] = useState(false);

  const [addBUOpen, setAddBUOpen] = useState(false);
  const [addBUCompanyId, setAddBUCompanyId] = useState<string | null>(null);
  const [addBUForm, setAddBUForm] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
  });
  const [addBULoading, setAddBULoading] = useState(false);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupForm, setAddGroupForm] = useState({
    name: "",
    siret: "",
    fiscal_year_start: "",
    fiscal_year_end: "",
    mainActivity: "",
  });
  const [addGroupLoading, setAddGroupLoading] = useState(false);

  const [addBUStandaloneOpen, setAddBUStandaloneOpen] = useState(false);
  const [addBUStandaloneForm, setAddBUStandaloneForm] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
    companyId: "",
  });
  const [addBUStandaloneLoading, setAddBUStandaloneLoading] = useState(false);

  const [editGroup, setEditGroup] = useState({
    name: "",
    siret: "",
    fiscal_year_start: "",
    fiscal_year_end: "",
    mainActivity: "",
  });
  const [editCompany, setEditCompany] = useState({
    name: "",
    siret: "",
    address: "",
    ape_code: "",
    main_activity: "",
  });
  const [editBU, setEditBU] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
  });
  const [nodeUsers, setNodeUsers] = useState<NodeUsersByRole | null>(null);
  const [nodeUsersOpen, setNodeUsersOpen] = useState(false);
  const [ficheShareholders, setFicheShareholders] = useState<ShareholderDto[]>(
    [],
  );
  const [ficheShareholdersLoading, setFicheShareholdersLoading] =
    useState(false);
  const [ficheShareholderFormOpen, setFicheShareholderFormOpen] =
    useState(false);
  const [ficheShareholderSaving, setFicheShareholderSaving] = useState(false);
  const [ficheShareholderUsers, setFicheShareholderUsers] = useState<
    UserItem[]
  >([]);

  const ficheShareholderUserOptions = useMemo(
    () =>
      ficheShareholderUsers.map((u) => ({
        id: u.id,
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        secondary: u.email,
      })),
    [ficheShareholderUsers],
  );

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const data = await fetchStructureTree();
      setTree(data);
    } catch (e) {
      if (e instanceof Error) {
        try {
          const parsed = JSON.parse(e.message) as
            | { message?: string | string[] }
            | undefined;
          const m = parsed?.message;
          const msg = Array.isArray(m) ? m.join(", ") : m;
          setTreeError(msg || e.message || "Erreur");
        } catch {
          setTreeError(e.message || "Erreur");
        }
      } else {
        setTreeError("Erreur");
      }
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // Only load the structure tree once auth bootstrap is done and we have a user.
  useEffect(() => {
    if (!isAuthReady || !user) return;
    void loadTree();
  }, [isAuthReady, user, loadTree]);

  // Keep structure in sync when returning to the tab/page (e.g. after imports or other changes).
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void loadTree();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isAuthReady, user, loadTree]);

  const loadBUsForCompany = useCallback(async (companyId: string) => {
    try {
      const data = await apiFetch<BusinessUnit[]>(
        `/companies/${companyId}/business-units`,
        { snackbar: { showSuccess: false, showError: true } },
      );
      setBusByCompany((prev) => ({ ...prev, [companyId]: data }));
      return data;
    } catch {
      setBusByCompany((prev) => ({ ...prev, [companyId]: [] }));
      return [];
    }
  }, []);

  const groupList = useMemo(() => tree?.groups ?? [], [tree]);

  const allTreeCompanies = useMemo<
    (TreeCompany & { groupId: string | null })[]
  >(
    () => [
      ...(tree?.groups ?? []).flatMap((g) =>
        g.companies.map((c) => ({ ...c, groupId: g.id as string | null })),
      ),
      ...(tree?.standaloneCompanies ?? []).map((c) => ({
        ...c,
        groupId: null as string | null,
      })),
    ],
    [tree],
  );

  const companyListForLayout = useMemo(
    () => allTreeCompanies.map((c) => ({ id: c.id, name: c.name })),
    [allTreeCompanies],
  );

  const companiesWithBus = useMemo(() => {
    const ids = new Set<string>();
    (tree?.groups ?? []).forEach((g) => {
      g.companies.forEach((c) => {
        if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
      });
    });
    (tree?.standaloneCompanies ?? []).forEach((c) => {
      if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
    });
    return ids;
  }, [tree]);

  const totalBusinessUnits = useMemo(() => {
    let count = 0;
    (tree?.groups ?? []).forEach((g) => {
      g.companies.forEach((c) => {
        count += (c.businessUnits ?? []).length;
      });
    });
    (tree?.standaloneCompanies ?? []).forEach((c) => {
      count += (c.businessUnits ?? []).length;
    });
    return count;
  }, [tree]);

  // Fonction de filtrage pour la recherche
  const filteredTreeData = useMemo(() => {
    if (!searchQuery.trim()) return tree;

    const query = searchQuery.toLowerCase().trim();
    const filtered = {
      groups: [] as TreeGroup[],
      standaloneCompanies: [] as TreeCompany[],
    };

    // Filtrer les groupes et leurs entreprises
    (tree?.groups ?? []).forEach((group) => {
      const groupMatches = group.name.toLowerCase().includes(query);
      const filteredCompanies = group.companies.filter((company) => {
        const companyMatches =
          company.name.toLowerCase().includes(query) ||
          company.siret?.toLowerCase().includes(query);

        // Filtrer aussi les business units si l'entreprise correspond ou si une BU correspond
        const filteredBUs =
          company.businessUnits?.filter(
            (bu) =>
              bu.name.toLowerCase().includes(query) ||
              bu.code.toLowerCase().includes(query),
          ) || [];

        return companyMatches || filteredBUs.length > 0;
      });

      // Inclure le groupe s'il correspond ou s'il a des entreprises qui correspondent
      if (groupMatches || filteredCompanies.length > 0) {
        filtered.groups.push({
          ...group,
          companies:
            filteredCompanies.length > 0 ? filteredCompanies : group.companies,
        });
      }
    });

    // Filtrer les entreprises indépendantes
    filtered.standaloneCompanies = (tree?.standaloneCompanies ?? []).filter(
      (company) => {
        const companyMatches =
          company.name.toLowerCase().includes(query) ||
          company.siret?.toLowerCase().includes(query);

        // Inclure aussi si une business unit correspond
        const filteredBUs =
          company.businessUnits?.filter(
            (bu) =>
              bu.name.toLowerCase().includes(query) ||
              bu.code.toLowerCase().includes(query),
          ) || [];

        return companyMatches || filteredBUs.length > 0;
      },
    );

    return filtered;
  }, [tree, searchQuery]);

  // Recalculer les données filtrées
  const filteredGroupList = useMemo(
    () => filteredTreeData?.groups ?? [],
    [filteredTreeData],
  );
  const filteredAllTreeCompanies = useMemo<
    (TreeCompany & { groupId: string | null })[]
  >(
    () => [
      ...(filteredTreeData?.groups ?? []).flatMap((g) =>
        g.companies.map((c) => ({ ...c, groupId: g.id as string | null })),
      ),
      ...(filteredTreeData?.standaloneCompanies ?? []).map((c) => ({
        ...c,
        groupId: null as string | null,
      })),
    ],
    [filteredTreeData],
  );

  const treeRows = useMemo(() => {
    const rows: TreeNode[] = [];

    // Ajouter les groupes et leurs entreprises (filtrés)
    (filteredTreeData?.groups ?? []).forEach((g) => {
      rows.push({ type: "group", id: g.id, name: g.name });
      g.companies.forEach((c) => {
        rows.push({
          type: "company",
          id: c.id,
          name: c.name,
          groupId: g.id,
          completionPercentage: c.completionPercentage,
        });
        if (expandedCompanyIds.has(c.id)) {
          c.businessUnits.forEach((bu) => {
            rows.push({
              type: "bu",
              id: bu.id,
              name: bu.name,
              companyId: c.id,
              code: bu.code,
            });
          });
        }
      });
    });

    // Ajouter les entreprises indépendantes avec un en-tête de section (filtrées)
    const standaloneCompanies = filteredTreeData?.standaloneCompanies ?? [];
    if (standaloneCompanies.length > 0) {
      rows.push({
        type: "section-header",
        id: "standalone-header",
        name: "Entreprises indépendantes",
      });
      standaloneCompanies.forEach((c) => {
        rows.push({
          type: "company",
          id: c.id,
          name: c.name,
          groupId: null,
          completionPercentage: c.completionPercentage,
        });
        if (expandedCompanyIds.has(c.id)) {
          c.businessUnits.forEach((bu) => {
            rows.push({
              type: "bu",
              id: bu.id,
              name: bu.name,
              companyId: c.id,
              code: bu.code,
            });
          });
        }
      });
    }

    return rows;
  }, [filteredTreeData, expandedCompanyIds]);

  const openDetail = useCallback(
    async (node: TreeNode) => {
      setSelectedNode(node);
      setEditing(false);
      setNodeUsers(null);

      if (node.type === "group") {
        try {
          const g = await apiFetch<GroupFull>(`/groups/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditGroup({
            name: g.name,
            siret: g.siret ?? "",
            fiscal_year_start: g.fiscal_year_start ?? "",
            fiscal_year_end: g.fiscal_year_end ?? "",
            mainActivity: g.mainActivity ?? "",
          });
        } catch {
          setEditGroup({
            name: node.name,
            siret: "",
            fiscal_year_start: "",
            fiscal_year_end: "",
            mainActivity: "",
          });
        }
      } else if (node.type === "company") {
        try {
          const c = await apiFetch<CompanyFull>(`/companies/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditCompany({
            name: c.name,
            siret: c.siret ?? "",
            address: c.address ?? "",
            ape_code: c.ape_code ?? "",
            main_activity: c.main_activity ?? "",
          });
        } catch {
          setEditCompany({
            name: node.name,
            siret: "",
            address: "",
            ape_code: "",
            main_activity: "",
          });
        }
        loadBUsForCompany(node.id);
      } else if (node.type === "bu") {
        const cached = busByCompany[node.companyId]?.find(
          (b) => b.id === node.id,
        );
        if (cached) {
          setEditBU({
            name: cached.name,
            code: cached.code,
            activity: cached.activity,
            siret: cached.siret,
          });
        } else {
          setEditBU({
            name: node.name,
            code: node.code,
            activity: "",
            siret: "",
          });
          const freshBUs = await loadBUsForCompany(node.companyId);
          const bu = freshBUs.find((b) => b.id === node.id);
          if (bu) {
            setEditBU({
              name: bu.name,
              code: bu.code,
              activity: bu.activity,
              siret: bu.siret,
            });
          }
        }
      }

      // Load managers & users linked to this node
      const nodeTypeParam =
        node.type === "group"
          ? "GROUP"
          : node.type === "company"
            ? "COMPANY"
            : "BUSINESS_UNIT";
      if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
        try {
          const users = await apiFetch<NodeUsersByRole>(
            `/structure/nodes/${nodeTypeParam}/${node.id}/users`,
            { snackbar: { showSuccess: false, showError: false } },
          );
          setNodeUsers(users);
        } catch {
          setNodeUsers(null);
        }
      }

      setDetailOpen(true);
    },
    [busByCompany, loadBUsForCompany, user?.role],
  );

  const handleSave = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "group") {
      await apiFetch(`/groups/${selectedNode.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editGroup.name,
          siret: editGroup.siret,
          fiscal_year_start: editGroup.fiscal_year_start,
          fiscal_year_end: editGroup.fiscal_year_end,
          mainActivity: editGroup.mainActivity || undefined,
        }),
        snackbar: { showSuccess: true, successMessage: "Groupe mis à jour" },
      });
    } else if (selectedNode.type === "company") {
      await apiFetch(`/companies/${selectedNode.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editCompany.name,
          siret: editCompany.siret,
          address: editCompany.address || undefined,
          ape_code: editCompany.ape_code || undefined,
          main_activity: editCompany.main_activity || undefined,
        }),
        snackbar: {
          showSuccess: true,
          successMessage: "Entreprise mise à jour",
        },
      });
    } else if (selectedNode.type === "bu") {
      await apiFetch(
        `/companies/${selectedNode.companyId}/business-units/${selectedNode.id}`,
        {
          method: "PUT",
          body: JSON.stringify(editBU),
          snackbar: {
            showSuccess: true,
            successMessage: "Business unit mise à jour",
          },
        },
      );
    }
    setEditing(false);
    setDetailOpen(false);
    await loadTree();
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "group") {
      await apiFetch(`/groups/${selectedNode.id}`, {
        method: "DELETE",
        snackbar: { showSuccess: true, successMessage: "Groupe supprimé" },
      });
    } else if (selectedNode.type === "company") {
      await apiFetch(`/companies/${selectedNode.id}`, {
        method: "DELETE",
        snackbar: { showSuccess: true, successMessage: "Entreprise supprimée" },
      });
    } else if (selectedNode.type === "bu") {
      await apiFetch(
        `/companies/${selectedNode.companyId}/business-units/${selectedNode.id}`,
        {
          method: "DELETE",
          snackbar: {
            showSuccess: true,
            successMessage: "Business unit supprimée",
          },
        },
      );
    }
    setConfirmDeleteOpen(false);
    setDetailOpen(false);
    await loadTree();
  };

  const handleCreateCompany = useCallback(
    async (form: CompanyWizardForm) => {
      const size =
        form.size === "MEDIUM_ETI"
          ? "MEDIUM"
          : (form.size as "SMALL" | "MEDIUM" | "LARGE");
      const model =
        form.model === "INDEPENDANT"
          ? "SUBSIDIARY"
          : (form.model as "HOLDING" | "SUBSIDIARY");
      await apiFetch("/companies", {
        method: "POST",
        body: JSON.stringify({
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
        }),
        snackbar: { showSuccess: true, successMessage: "Entreprise créée" },
      });
      await loadTree();
    },
    [loadTree],
  );

  const handleAddCompanyToGroup = async () => {
    if (!addCompanyGroupId || !addCompanyForm.name.trim()) return;
    setAddCompanyLoading(true);
    try {
      await apiFetch("/companies", {
        method: "POST",
        body: JSON.stringify({
          groupId: addCompanyGroupId,
          name: addCompanyForm.name,
          siret: addCompanyForm.siret,
          fiscal_year_start: addCompanyForm.fiscal_year_start,
          fiscal_year_end: addCompanyForm.fiscal_year_end,
        }),
        snackbar: { showSuccess: true, successMessage: "Entreprise créée" },
      });
      await loadTree();
      setAddCompanyOpen(false);
      setAddCompanyForm({
        name: "",
        siret: "",
        fiscal_year_start: "",
        fiscal_year_end: "",
      });
    } catch {
      /* snackbar handles */
    } finally {
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
        snackbar: { showSuccess: true, successMessage: "Business unit créée" },
      });
      await loadTree();
      setExpandedCompanyIds((prev) => new Set(prev).add(addBUCompanyId!));
      setAddBUOpen(false);
      setAddBUForm({ name: "", code: "", activity: "", siret: "" });
    } catch {
      /* snackbar handles */
    } finally {
      setAddBULoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!addGroupForm.name.trim()) return;
    setAddGroupLoading(true);
    try {
      await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({
          name: addGroupForm.name,
          siret: addGroupForm.siret || undefined,
          fiscal_year_start: addGroupForm.fiscal_year_start || undefined,
          fiscal_year_end: addGroupForm.fiscal_year_end || undefined,
          mainActivity: addGroupForm.mainActivity || undefined,
        }),
        snackbar: { showSuccess: true, successMessage: "Groupe créé" },
      });
      await loadTree();
      setAddGroupOpen(false);
      setAddGroupForm({
        name: "",
        siret: "",
        fiscal_year_start: "",
        fiscal_year_end: "",
        mainActivity: "",
      });
    } catch {
      /* snackbar handles */
    } finally {
      setAddGroupLoading(false);
    }
  };

  const handleCreateBUStandalone = async () => {
    if (!addBUStandaloneForm.name.trim() || !addBUStandaloneForm.companyId)
      return;
    setAddBUStandaloneLoading(true);
    try {
      await apiFetch(
        `/companies/${addBUStandaloneForm.companyId}/business-units`,
        {
          method: "POST",
          body: JSON.stringify({
            name: addBUStandaloneForm.name,
            code: addBUStandaloneForm.code,
            activity: addBUStandaloneForm.activity,
            siret: addBUStandaloneForm.siret,
          }),
          snackbar: {
            showSuccess: true,
            successMessage: "Business unit créée",
          },
        },
      );
      await loadTree();
      setExpandedCompanyIds((prev) =>
        new Set(prev).add(addBUStandaloneForm.companyId),
      );
      setAddBUStandaloneOpen(false);
      setAddBUStandaloneForm({
        name: "",
        code: "",
        activity: "",
        siret: "",
        companyId: "",
      });
    } catch {
      /* snackbar handles */
    } finally {
      setAddBUStandaloneLoading(false);
    }
  };

  const toggleExpand = (companyId: string) => {
    setExpandedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const openFiche = async (companyId: string) => {
    setFicheCompanyId(companyId);
    setFicheTab("informations");
    setFicheOpen(true);
    setFicheCompany(null);
    setFicheShareholders([]);
    try {
      const c = await apiFetch<CompanyFull>(`/companies/${companyId}`, {
        snackbar: { showSuccess: false, showError: true },
      });
      setFicheCompany(c);
    } catch {
      /* snackbar handles */
    }
    loadBUsForCompany(companyId);
    // Load shareholders for this company (for Actionnaires tab)
    setFicheShareholdersLoading(true);
    try {
      const sh = await fetchShareholdersByCompany(companyId);
      setFicheShareholders(sh);
      // Load users so we can resolve shareholder user labels
      const us = await fetchUsers();
      setFicheShareholderUsers(us);
    } catch {
      setFicheShareholders([]);
    } finally {
      setFicheShareholdersLoading(false);
    }
  };

  const typeLabel =
    selectedNode?.type === "group"
      ? "Groupe"
      : selectedNode?.type === "company"
        ? "Entreprise"
        : "Business Unit";

  return (
    <AppLayout
      title="Structure"
      companies={companyListForLayout}
      selectedCompanyId=""
      onCompanyChange={() => {}}
    >
      <Head>
        <title>Structure de l&apos;organisation</title>
      </Head>
      <div className="space-y-8">
        {/* Header section */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between w-full">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  Structure Organisationnelle
                </h1>
                <p className="text-slate-500 max-w-2xl">
                  Gérez la structure hiérarchique de vos entités : groupes,
                  entreprises et business units.
                </p>
              </div>

              {/* Barre de recherche */}
              <div className="relative max-w-md">
                <div className="absolute top-1/3 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Rechercher"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg transition-all duration-200 ${
                    isSearchFocused
                      ? "border-primary ring-2 ring-primary/20 bg-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  } focus:outline-none placeholder:text-slate-400`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 justify-between w-full!">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {searchQuery.trim()
                      ? filteredGroupList.length
                      : groupList.length}{" "}
                    groupes
                    {searchQuery.trim() && ` sur ${groupList.length}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Building className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-700">
                    {searchQuery.trim()
                      ? filteredAllTreeCompanies.length
                      : allTreeCompanies.length}{" "}
                    entreprises
                    {searchQuery.trim() && ` sur ${allTreeCompanies.length}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">
                    {searchQuery.trim()
                      ? treeRows.filter((r) => r.type === "bu").length
                      : totalBusinessUnits}{" "}
                    business units
                    {searchQuery.trim() && ` sur ${totalBusinessUnits}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {canImportStructure && (
                  <Link
                    href="/structure/import/upload"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
                  >
                    <Upload className="h-4 w-4" />
                    Importer
                  </Link>
                )}
                {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
                  <Button
                    onClick={() => setAddGroupOpen(true)}
                    className="h-10 gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm transition-all hover:shadow-md"
                    disabled={!canCreateCompany}
                  >
                    <Plus className="h-4 w-4" />
                    Groupe
                  </Button>
                )}
                {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
                  <Button
                    onClick={() => setWizardOpen(true)}
                    className="h-10 gap-2 bg-primary text-white hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm transition-all hover:shadow-md"
                    disabled={!canCreateCompany}
                  >
                    <Plus className="h-4 w-4" />
                    Entreprise
                  </Button>
                )}
                {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
                  <Button
                    onClick={() => setAddBUStandaloneOpen(true)}
                    className="h-10 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm transition-all hover:shadow-md"
                    disabled={!canCreateCompany}
                  >
                    <Plus className="h-4 w-4" />
                    Business Unit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {treeError && (
            <div className="m-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              {treeError}
            </div>
          )}
          {treeLoading && !treeRows.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-slate-200 border-t-primary mb-4"></div>
              <p className="text-slate-500 font-medium">
                Chargement de la structure...
              </p>
            </div>
          ) : treeRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                {searchQuery.trim() ? (
                  <svg
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                ) : (
                  <Folder className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery.trim()
                  ? "Aucun résultat trouvé"
                  : "Aucune structure trouvée"}
              </h3>
              <p className="text-slate-500 text-center max-w-md mb-6">
                {searchQuery.trim()
                  ? `Aucun groupe, entreprise ou business unit ne correspond à "${searchQuery}". Essayez avec d'autres termes.`
                  : "Commencez par créer un groupe ou une entreprise pour organiser votre structure."}
              </p>
              {searchQuery.trim() ? (
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="h-10 gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Effacer la recherche
                </Button>
              ) : canCreateCompany ? (
                <div className="flex gap-3">
                  {(user?.role === "SUPER_ADMIN" ||
                    user?.role === "MANAGER") && (
                    <Button
                      onClick={() => setAddGroupOpen(true)}
                      className="h-10 gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Créer un groupe
                    </Button>
                  )}
                  {(user?.role === "SUPER_ADMIN" ||
                    user?.role === "MANAGER") && (
                    <Button
                      onClick={() => setWizardOpen(true)}
                      className="h-10 gap-2 bg-primary text-white hover:bg-slate-800 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Créer une entreprise
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="min-w-full">
              {/* Indicateur de recherche active */}
              {searchQuery.trim() && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-2 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <span className="font-medium">
                      Recherche : &quot;{searchQuery}&quot; -{" "}
                      {
                        treeRows.filter((r) => r.type !== "section-header")
                          .length
                      }{" "}
                      résultat
                      {treeRows.filter((r) => r.type !== "section-header")
                        .length > 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                  <Button
                    onClick={() => setSearchQuery("")}
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 h-8 px-3"
                  >
                    Effacer
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-[1fr_120px_100px_60px] gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Nom
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Type
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  Complétion
                </div>
                <div className="text-right">Actions</div>
              </div>

              <ul className="divide-y divide-slate-100">
                {treeRows.map((node) => {
                  // Gérer l'en-tête de section pour les entreprises indépendantes
                  if (node.type === "section-header") {
                    return (
                      <li
                        key={node.id}
                        className="bg-slate-50/80 border-y border-slate-100"
                      >
                        <div className="px-6 py-3 flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200" />
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                              {node.name}
                            </span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                      </li>
                    );
                  }

                  const indent =
                    node.type === "group" ? 0 : node.type === "company" ? 1 : 2;
                  const Icon =
                    node.type === "group"
                      ? Layers
                      : node.type === "company"
                        ? Building
                        : Briefcase;
                  const iconColor =
                    node.type === "group"
                      ? "text-blue-600"
                      : node.type === "company"
                        ? "text-slate-700"
                        : "text-emerald-600";
                  const typeText =
                    node.type === "group"
                      ? "Groupe"
                      : node.type === "company"
                        ? "Entreprise"
                        : "BU";
                  const typeBadgeColor =
                    node.type === "group"
                      ? "bg-blue-50 text-blue-700 border-blue-100"
                      : node.type === "company"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-slate-50 text-slate-500 border-slate-100";
                  const completion =
                    node.type === "company" ? node.completionPercentage : null;
                  const canExpand =
                    node.type === "company" && companiesWithBus.has(node.id);

                  return (
                    <li
                      key={`${node.type}-${node.id}`}
                      className="group/row transition-all duration-200 hover:bg-slate-50/50 hover:shadow-sm"
                    >
                      <div
                        className="grid cursor-pointer grid-cols-[1fr_120px_100px_60px] items-center gap-4 px-6 py-3"
                        onClick={() => openDetail(node)}
                      >
                        <div
                          className="flex items-center gap-3"
                          style={{ paddingLeft: indent * 24 }}
                        >
                          {canExpand ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                              }}
                              className="cursor-pointer rounded p-0.5 transition-colors hover:bg-slate-200 mr-1"
                            >
                              <Play
                                className={`h-3 w-3 fill-slate-500 text-slate-400 transition-transform ${
                                  expandedCompanyIds.has(node.id)
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </div>
                          ) : (
                            node.type === "company" && (
                              <div className="w-5 fill-slate-500 text-slate-400" />
                            )
                          )}
                          <Icon
                            className={`h-5 w-5 ${iconColor} transition-colors group-hover/row:scale-110`}
                          />
                          <span
                            className={`truncate font-medium transition-colors ${
                              node.type === "group"
                                ? "text-primary font-semibold"
                                : "text-slate-700"
                            }`}
                          >
                            {node.name}
                          </span>
                          {node.type === "company" && node.groupId === null && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-medium">
                              Indépendante
                            </span>
                          )}
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${typeBadgeColor}`}
                          >
                            {typeText}
                          </span>
                        </div>

                        <div>
                          {completion !== null && (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    completion === 100
                                      ? "bg-green-500"
                                      : completion >= 50
                                        ? "bg-amber-400"
                                        : "bg-slate-300"
                                  }`}
                                  style={{ width: `${completion}%` }}
                                />
                              </div>
                              <span className="text-[10px] tabular-nums text-slate-400 font-medium">
                                {completion}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          {user?.role === "SUPER_ADMIN" ||
                          user?.role === "MANAGER" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white hover:text-primary hover:shadow-md group-hover/row:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetail(node);
                                  }}
                                >
                                  Voir / Modifier
                                </DropdownMenuItem>
                                {node.type === "group" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddCompanyGroupId(node.id);
                                      setAddCompanyForm({
                                        name: "",
                                        siret: "",
                                        fiscal_year_start: "",
                                        fiscal_year_end: "",
                                      });
                                      setAddCompanyOpen(true);
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                                    une entreprise
                                  </DropdownMenuItem>
                                )}
                                {node.type === "company" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFiche(node.id);
                                      }}
                                    >
                                      Fiche entreprise
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddBUCompanyId(node.id);
                                        setAddBUForm({
                                          name: "",
                                          code: "",
                                          activity: "",
                                          siret: "",
                                        });
                                        setAddBUOpen(true);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" /> Ajouter
                                      une BU
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNode(node);
                                    setConfirmDeleteOpen(true);
                                  }}
                                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
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
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetail(node);
                                  }}
                                >
                                  Voir les détails
                                </DropdownMenuItem>
                                {node.type === "company" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFiche(node.id);
                                    }}
                                  >
                                    Fiche entreprise
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {treeRows.length === 0 && !treeLoading && (
                  <li className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                      <Building2 className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-medium text-primary">
                      Aucune structure
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Commencez par créer votre première entreprise.
                    </p>
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
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">
                {selectedNode?.type === "group"
                  ? "📁"
                  : selectedNode?.type === "company"
                    ? "🏢"
                    : "📦"}
              </span>
              {editing ? `Modifier ${typeLabel}` : typeLabel}
            </DialogTitle>
            {nodeUsers &&
              (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                <Button
                  variant="outline"
                  onClick={() => setNodeUsersOpen(true)}
                >
                  Voir les utilisateurs liés
                </Button>
              )}
          </DialogHeader>

          {selectedNode?.type === "group" && (
            <div className="space-y-4 py-2">
              <Field
                label="Nom"
                value={editGroup.name}
                editing={editing}
                onChange={(v) => setEditGroup((f) => ({ ...f, name: v }))}
              />
              <Field
                label="SIRET"
                value={editGroup.siret}
                editing={editing}
                validate={validateSiret}
                onChange={(v) => setEditGroup((f) => ({ ...f, siret: v }))}
              />
              <Field
                label="SIREN"
                value={editGroup.siret ? editGroup.siret.substring(0, 9) : ""}
                editing={false} // SIREN est calculé automatiquement, non modifiable
                onChange={() => {}} // Non modifiable
              />
              <Field
                label="Début d'exercice"
                value={editGroup.fiscal_year_start}
                editing={editing}
                type="date"
                onChange={(v) =>
                  setEditGroup((f) => ({ ...f, fiscal_year_start: v }))
                }
              />
              <Field
                label="Fin d'exercice"
                value={editGroup.fiscal_year_end}
                editing={editing}
                type="date"
                onChange={(v) =>
                  setEditGroup((f) => ({ ...f, fiscal_year_end: v }))
                }
              />
              <Field
                label="Activité principale"
                value={editGroup.mainActivity}
                editing={editing}
                onChange={(v) =>
                  setEditGroup((f) => ({ ...f, mainActivity: v }))
                }
              />
            </div>
          )}

          {selectedNode?.type === "company" && (
            <div className="space-y-4 py-2">
              <Field
                label="Nom"
                value={editCompany.name}
                editing={editing}
                onChange={(v) => setEditCompany((f) => ({ ...f, name: v }))}
              />
              <Field
                label="SIRET"
                value={editCompany.siret}
                editing={editing}
                validate={validateSiret}
                onChange={(v) => setEditCompany((f) => ({ ...f, siret: v }))}
              />
              <Field
                label="SIREN"
                value={
                  editCompany.siret ? editCompany.siret.substring(0, 9) : ""
                }
                editing={false} // SIREN est calculé automatiquement, non modifiable
                onChange={() => {}} // Non modifiable
              />
              <FieldTextarea
                label="Adresse"
                value={editCompany.address}
                editing={editing}
                onChange={(v) => setEditCompany((f) => ({ ...f, address: v }))}
              />
              <Field
                label="Code APE"
                value={editCompany.ape_code}
                editing={editing}
                onChange={(v) => setEditCompany((f) => ({ ...f, ape_code: v }))}
              />
              <Field
                label="Activité principale"
                value={editCompany.main_activity}
                editing={editing}
                onChange={(v) =>
                  setEditCompany((f) => ({ ...f, main_activity: v }))
                }
              />

              {!editing && (busByCompany[selectedNode.id] ?? []).length > 0 && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 w-fit">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Business Units (
                    {(busByCompany[selectedNode.id] ?? []).length})
                  </p>
                  <ul className="space-y-1">
                    {(busByCompany[selectedNode.id] ?? []).map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between text-sm text-slate-700"
                      >
                        <span>{b.name}</span>
                        {b.code && (
                          <span className="text-xs text-slate-400">
                            {b.code}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedNode?.type === "bu" && (
            <div className="space-y-4 py-2">
              <Field
                label="Nom"
                value={editBU.name}
                editing={editing}
                onChange={(v) => setEditBU((f) => ({ ...f, name: v }))}
              />
              <Field
                label="Code"
                value={editBU.code}
                editing={editing}
                onChange={(v) => setEditBU((f) => ({ ...f, code: v }))}
              />
              <Field
                label="Activité"
                value={editBU.activity}
                editing={editing}
                onChange={(v) => setEditBU((f) => ({ ...f, activity: v }))}
              />
              <Field
                label="SIRET"
                value={editBU.siret}
                editing={editing}
                validate={validateSiret}
                onChange={(v) => setEditBU((f) => ({ ...f, siret: v }))}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            {!editing ? (
              <>
                {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    Supprimer
                  </Button>
                )}
                <div className="flex-1" />
                {selectedNode?.type === "company" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailOpen(false);
                      openFiche(selectedNode.id);
                    }}
                  >
                    Fiche
                  </Button>
                )}
                {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Modifier
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
                <div className="flex-1" />
                <Button onClick={handleSave}>Enregistrer</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node users modal (admins only) */}
      <Dialog open={nodeUsersOpen} onOpenChange={setNodeUsersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Utilisateurs liés à ce nœud
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {nodeUsers && Object.keys(nodeUsers).length > 0 ? (
              Object.entries(nodeUsers)
                .sort(([roleA], [roleB]) => roleA.localeCompare(roleB))
                .map(([role, users]) => {
                  const sortedUsers = [...users].sort((a, b) => {
                    const nameA =
                      `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() ||
                      a.email;
                    const nameB =
                      `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() ||
                      b.email;
                    return nameA.localeCompare(nameB);
                  });
                  const roleLabel =
                    role === "SUPER_ADMIN"
                      ? "Super admin"
                      : role === "ADMIN"
                        ? "Admin"
                        : role === "MANAGER"
                          ? "Manager"
                          : role === "END_USER"
                            ? "Utilisateur"
                            : role;
                  return (
                    <div key={role}>
                      <p className="pl-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {roleLabel}{" "}
                        <span className="font-normal text-slate-400">
                          ({users.length}):
                        </span>
                      </p>
                      <ul className="mt-2 space-y-0.5 text-xs text-slate-700">
                        {sortedUsers.map((u) => {
                          const fullName =
                            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                          return (
                            <li
                              key={u.id}
                              className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1 border border-slate-300"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {fullName || u.email}
                                </span>
                                {fullName && (
                                  <span className="text-[11px] text-slate-400">
                                    {u.email}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-slate-400">
                Aucun utilisateur lié à ce nœud.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeUsersOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareholderFormDialog
        open={ficheShareholderFormOpen}
        onOpenChange={setFicheShareholderFormOpen}
        onSubmit={async (values: ShareholderFormValues) => {
          if (!ficheCompanyId) return;
          setFicheShareholderSaving(true);
          try {
            const created = await createShareholder({
              ownerType: values.ownerType,
              ownerId: values.ownerId,
              percentage: values.percentage,
              companyIds: [ficheCompanyId],
            });
            setFicheShareholders((prev) => [created, ...prev]);
            setFicheShareholderFormOpen(false);
          } finally {
            setFicheShareholderSaving(false);
          }
        }}
        saving={ficheShareholderSaving}
        userOptions={ficheShareholderUserOptions}
        companyOptions={companyListForLayout}
        lockedCompanyId={ficheCompanyId ?? undefined}
        title="Ajouter un actionnaire"
      />

      {/* Confirm Delete Modal */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>{selectedNode?.name}</strong> ? Cette action est
            irréversible.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiche Entreprise Modal */}
      <Dialog open={ficheOpen} onOpenChange={setFicheOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto gap-2!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              {ficheCompany?.name ??
                allTreeCompanies.find((x) => x.id === ficheCompanyId)?.name ??
                "Fiche entreprise"}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            if (!ficheCompany) {
              return (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                </div>
              );
            }
            const bus = busByCompany[ficheCompany.id] ?? [];
            return (
              <Tabs value={ficheTab} onValueChange={setFicheTab}>
                <TabsList className="gap-4">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="business-units">
                    Business Units
                  </TabsTrigger>
                  <TabsTrigger value="actionnaires">Actionnaires</TabsTrigger>
                </TabsList>
                <TabsContent value="informations" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 pt-0">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <dt className="text-slate-500">SIRET</dt>
                      <dd className="font-medium text-primary">
                        {ficheCompany.siret || "—"}
                      </dd>
                      <dt className="text-slate-500">SIREN</dt>
                      <dd className="font-medium text-primary">
                        {ficheCompany.siret
                          ? ficheCompany.siret.substring(0, 9)
                          : "—"}
                      </dd>
                      <dt className="text-slate-500">Début d&apos;exercice</dt>
                      <dd className="font-medium text-primary">
                        {ficheCompany.fiscal_year_start || "—"}
                      </dd>
                      <dt className="text-slate-500">Fin d&apos;exercice</dt>
                      <dd className="font-medium text-primary">
                        {ficheCompany.fiscal_year_end || "—"}
                      </dd>
                      {ficheCompany.address && (
                        <>
                          <dt className="text-slate-500">Adresse</dt>
                          <dd className="whitespace-pre-wrap font-medium text-primary">
                            {ficheCompany.address}
                          </dd>
                        </>
                      )}
                      {ficheCompany.ape_code && (
                        <>
                          <dt className="text-slate-500">Code APE</dt>
                          <dd className="font-medium text-primary">
                            {ficheCompany.ape_code}
                          </dd>
                        </>
                      )}
                      {ficheCompany.main_activity && (
                        <>
                          <dt className="text-slate-500">
                            Activité principale
                          </dt>
                          <dd className="font-medium text-primary">
                            {ficheCompany.main_activity}
                          </dd>
                        </>
                      )}
                      {ficheCompany.size && (
                        <>
                          <dt className="text-slate-500">Taille</dt>
                          <dd className="font-medium text-primary">
                            {ficheCompany.size}
                          </dd>
                        </>
                      )}
                      {ficheCompany.model && (
                        <>
                          <dt className="text-slate-500">Modèle</dt>
                          <dd className="font-medium text-primary">
                            {ficheCompany.model}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </TabsContent>
                <TabsContent value="business-units" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-1">
                    <ul className="space-y-2">
                      {bus.map((b) => (
                        <li
                          key={b.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                          onClick={() => {
                            setFicheOpen(false);
                            openDetail({
                              type: "bu",
                              id: b.id,
                              name: b.name,
                              companyId: ficheCompany.id,
                              code: b.code,
                            });
                          }}
                        >
                          <span className="font-medium text-primary">
                            {b.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {b.code}
                              {b.code && b.siret ? " — " : ""}
                              {b.siret}
                            </span>
                            <span className="text-slate-400">›</span>
                          </div>
                        </li>
                      ))}
                      {bus.length === 0 && (
                        <li className="py-4 text-center text-slate-400">
                          Aucune business unit.
                        </li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="actionnaires" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-1 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Actionnaires de cette entreprise
                      </p>
                      {(user?.role === "SUPER_ADMIN" ||
                        user?.role === "ADMIN" ||
                        user?.role === "MANAGER") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setFicheOpen(false);
                            setFicheShareholderFormOpen(true);
                            if (!ficheShareholderUsers.length) {
                              try {
                                const us = await fetchUsers();
                                setFicheShareholderUsers(us);
                              } catch {
                                /* handled globally */
                              }
                            }
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter un actionnaire
                        </Button>
                      )}
                    </div>
                    {ficheShareholdersLoading ? (
                      <p className="text-xs text-slate-400">
                        Chargement des actionnaires...
                      </p>
                    ) : ficheShareholders.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Aucun actionnaire lié à cette entreprise.
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {ficheShareholders.map((s) => {
                          const ownerLabel =
                            s.ownerType === "USER"
                              ? (() => {
                                  const u = ficheShareholderUsers.find(
                                    (x) => x.id === s.ownerId,
                                  );
                                  if (!u) return s.ownerId;
                                  const fullName = `${u.firstName ?? ""} ${
                                    u.lastName ?? ""
                                  }`.trim();
                                  return fullName || u.email;
                                })()
                              : (() => {
                                  const c = allTreeCompanies.find(
                                    (x) => x.id === s.ownerId,
                                  );
                                  return c?.name ?? s.ownerId;
                                })();
                          return (
                            <li
                              key={s.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">
                                  {ownerLabel}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {ownerTypeLabel(s.ownerType)}
                                </span>
                              </div>
                              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <span>{s.percentage}%</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Modal */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-500" />
              Nouveau Groupe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nom *
              </label>
              <Input
                value={addGroupForm.name}
                onChange={(e) =>
                  setAddGroupForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom du groupe"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET
              </label>
              <SiretInput
                value={addGroupForm.siret}
                onChange={(value) =>
                  setAddGroupForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité principale
              </label>
              <Input
                value={addGroupForm.mainActivity}
                onChange={(e) =>
                  setAddGroupForm((f) => ({
                    ...f,
                    mainActivity: e.target.value,
                  }))
                }
                placeholder="Activité principale"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Début exercice
                </label>
                <Input
                  type="date"
                  value={addGroupForm.fiscal_year_start}
                  onChange={(e) =>
                    setAddGroupForm((f) => ({
                      ...f,
                      fiscal_year_start: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fin exercice
                </label>
                <Input
                  type="date"
                  value={addGroupForm.fiscal_year_end}
                  onChange={(e) =>
                    setAddGroupForm((f) => ({
                      ...f,
                      fiscal_year_end: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={addGroupLoading || !addGroupForm.name.trim()}
            >
              {addGroupLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add BU Standalone Modal */}
      <Dialog open={addBUStandaloneOpen} onOpenChange={setAddBUStandaloneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-500" />
              Nouvelle Business Unit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Entreprise *
              </label>
              <Select
                value={addBUStandaloneForm.companyId}
                onValueChange={(value) =>
                  setAddBUStandaloneForm((f) => ({ ...f, companyId: value }))
                }
              >
                <option value="">Sélectionner une entreprise</option>
                {allTreeCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nom *
              </label>
              <Input
                value={addBUStandaloneForm.name}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))
                }
                placeholder="Nom de la BU"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code
              </label>
              <Input
                value={addBUStandaloneForm.code}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    code: e.target.value,
                  }))
                }
                placeholder="BU-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité
              </label>
              <Input
                value={addBUStandaloneForm.activity}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    activity: e.target.value,
                  }))
                }
                placeholder="Activité principale"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET
              </label>
              <SiretInput
                value={addBUStandaloneForm.siret}
                onChange={(value) =>
                  setAddBUStandaloneForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddBUStandaloneOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateBUStandalone}
              disabled={
                addBUStandaloneLoading ||
                !addBUStandaloneForm.name.trim() ||
                !addBUStandaloneForm.companyId.trim()
              }
            >
              {addBUStandaloneLoading ? "Création..." : "Créer"}
            </Button>
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
            Dans le groupe :{" "}
            <strong>
              {groupList.find((g) => g.id === addCompanyGroupId)?.name}
            </strong>
          </p>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nom *
              </label>
              <Input
                value={addCompanyForm.name}
                onChange={(e) =>
                  setAddCompanyForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET
              </label>
              <SiretInput
                value={addCompanyForm.siret}
                onChange={(value) =>
                  setAddCompanyForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Début exercice
                </label>
                <Input
                  type="date"
                  value={addCompanyForm.fiscal_year_start}
                  onChange={(e) =>
                    setAddCompanyForm((f) => ({
                      ...f,
                      fiscal_year_start: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fin exercice
                </label>
                <Input
                  type="date"
                  value={addCompanyForm.fiscal_year_end}
                  onChange={(e) =>
                    setAddCompanyForm((f) => ({
                      ...f,
                      fiscal_year_end: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddCompanyToGroup}
              disabled={addCompanyLoading || !addCompanyForm.name.trim()}
            >
              {addCompanyLoading ? "Création..." : "Créer"}
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
            Dans l&apos;entreprise :{" "}
            <strong>
              {allTreeCompanies.find((c) => c.id === addBUCompanyId)?.name}
            </strong>
          </p>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nom *
              </label>
              <Input
                value={addBUForm.name}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom de la BU"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code
              </label>
              <Input
                value={addBUForm.code}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="BU-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité
              </label>
              <Input
                value={addBUForm.activity}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, activity: e.target.value }))
                }
                placeholder="Activité principale"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET
              </label>
              <SiretInput
                value={addBUForm.siret}
                onChange={(value) =>
                  setAddBUForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBUOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddBUToCompany}
              disabled={
                addBULoading ||
                !addBUForm.name.trim() ||
                !can("business-units", CRUD_ACTION.CREATE)
              }
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addBULoading ? "Création..." : "Créer"}
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
  validate,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (v: string) => void;
  validate?: (v: string) => boolean;
}) {
  const [error, setError] = useState<string>("");

  const handleChange = (newValue: string) => {
    if (validate) {
      if (!validate(newValue)) {
        setError("Le SIRET doit contenir exactement 14 chiffres");
      } else {
        setError("");
      }
    }
    onChange(newValue);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {editing ? (
        <div>
          <Input
            type={type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
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
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm font-medium text-primary">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
