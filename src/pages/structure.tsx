/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import Head from "next/head";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import {
  fetchStructureTree,
  type StructureTree,
  type TreeCompany,
  type TreeGroup,
  type Treeworkspace,
} from "@/lib/structureApi";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { usePermissions } from "@/permissions/usePermissions";
import { CRUD_ACTION } from "@/permissions/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SiretInput, validateSiret } from "@/components/ui/SiretInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { ApeCodeSelect } from "@/components/structure/ApeCodeSelect";
import { CountrySelect } from "@/components/structure/CountrySelect";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
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
  Search,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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
import Image from "next/image";

type Emprunt = {
  id: string;
  amount: number;
  description?: string;
  date: string;
  interest_rate?: number;
  duration_months?: number;
};

type BusinessUnit = {
  id: string;
  name: string;
  code: string;
  activity: string;
  siret: string;
  country: string;
  logo?: string;
  company_id?: string;
};

type GroupFull = {
  id: string;
  name: string;
  siret: string;
  ape_code?: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  mainActivity?: string;
  country?: string;
  logo?: string;
};

type workspaceFull = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  manager_id?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
};

type CompanyFull = {
  id: string;
  name: string;
  siret: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  address?: string;
  country: string;
  ape_code?: string;
  main_activity?: string;
  size?: string;
  model?: string;
  logo?: string;
  completionPercentage?: number;
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
  | { type: "workspace"; id: string; name: string }
  | { type: "group"; id: string; name: string }
  | {
    type: "company";
    id: string;
    name: string;
    groupId: string | null;
    workspaceId?: string;
    completionPercentage: number;
  }
  | { type: "bu"; id: string; name: string; companyId: string; code: string }
  | { type: "section-header"; id: string; name: string };

const MONTH_DAY_REGEX = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])$/;
const LEGACY_MONTH_DAY_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const toMonthDay = (value: string | null | undefined): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (MONTH_DAY_REGEX.test(trimmed)) return trimmed;

  // Backward compatibility for legacy YYYY-MM-DD values.
  const legacy = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (legacy) return `${legacy[3]}-${legacy[2]}`;

  // Backward compatibility for previous MM-DD storage.
  if (LEGACY_MONTH_DAY_REGEX.test(trimmed)) {
    const [legacyMonth, legacyDay] = trimmed.split("-");
    return `${legacyDay}-${legacyMonth}`;
  }

  return trimmed;
};

const isValidMonthDay = (value: string): boolean => {
  if (!MONTH_DAY_REGEX.test(value)) return false;
  const [dayPart, monthPart] = value.split("-");
  const day = Number(dayPart);
  const month = Number(monthPart);
  const probe = new Date(Date.UTC(2000, month - 1, day));
  return probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
};

const normalizeMonthDayInput = (value: string): string => {
  const cleaned = value.replace(/[./\s]/g, "-").replace(/[^\d-]/g, "");
  return cleaned.slice(0, 5);
};

const formatMonthDayForDisplay = (value: string | null | undefined): string => {
  const monthDay = toMonthDay(value);
  if (!isValidMonthDay(monthDay)) return value ?? "—";
  const [day, month] = monthDay.split("-");
  return `${day}/${month}`;
};

export default function StructurePage() {
  const { user, isAuthReady } = usePermissionsContext();
  const router = useRouter();
  const { can } = usePermissions();
  const canImportStructure =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "HEAD_MANAGER" ||
    user?.role === "MANAGER";
  const canCreateCompany = can("companies", CRUD_ACTION.CREATE);

  useEffect(() => {
    if (!isAuthReady || user) return;

    const returnTo = router.asPath || "/structure";
    try {
      window.localStorage.setItem("nk-return-to", returnTo);
    } catch {
      // ignore storage write errors
    }

    void router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [isAuthReady, user, router]);

  if (!isAuthReady || !user) {
    return null;
  }

  const [tree, setTree] = useState<StructureTree | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [isTreeLoaded, setIsTreeLoaded] = useState(false);
  const [busByCompany, setBusByCompany] = useState<
    Record<string, BusinessUnit[]>
  >({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ficheOpen, setFicheOpen] = useState(false);
  const [ficheCompanyId, setFicheCompanyId] = useState<string | null>(null);
  const [ficheCompany, setFicheCompany] = useState<CompanyFull | null>(null);
  const [ficheTab, setFicheTab] = useState("informations");
  const [ficheCompanyEmprunts, setFicheCompanyEmprunts] = useState<Emprunt[]>([]);
  const [ficheCompanyDataLoading, setFicheCompanyDataLoading] = useState(false);

  // Fiche Group states
  const [ficheGroupOpen, setFicheGroupOpen] = useState(false);
  const [ficheGroupId, setFicheGroupId] = useState<string | null>(null);
  const [ficheGroup, setFicheGroup] = useState<GroupFull | null>(null);
  const [ficheGroupTab, setFicheGroupTab] = useState("informations");
  const [ficheGroupEmprunts, setFicheGroupEmprunts] = useState<Emprunt[]>([]);
  const [ficheGroupDataLoading, setFicheGroupDataLoading] = useState(false);

  // Fiche BU states
  const [ficheBUOpen, setFicheBUOpen] = useState(false);
  const [ficheBUId, setFicheBUId] = useState<string | null>(null);
  const [ficheBU, setFicheBU] = useState<BusinessUnit | null>(null);
  const [ficheBUTab, setFicheBUTab] = useState("informations");
  const [ficheBUEmprunts, setFicheBUEmprunts] = useState<Emprunt[]>([]);
  const [ficheBUDataLoading, setFicheBUDataLoading] = useState(false);

  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(
    new Set(),
  );

  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // État pour créer une workspace
  const [addworkspaceOpen, setAddworkspaceOpen] = useState(false);
  const [addworkspaceForm, setAddworkspaceForm] = useState({
    name: "",
    description: "",
    logo: undefined as string | undefined,
    address: "",
    contact_email: "",
    contact_phone: "",
    manager_id: "",
  });
  const [addworkspaceLoading, setAddworkspaceLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [workspaceErrors, setWorkspaceErrors] = useState({
    contact_email: "",
    contact_phone: "",
  });
  const [editWorkspaceErrors, setEditWorkspaceErrors] = useState({
    contact_email: "",
    contact_phone: "",
  });

  // Gérer le changement de fichier logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setLogoFile(file);
      setAddworkspaceForm(prev => ({ ...prev, logo: file.name }));

      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonctions de validation
  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Champ optionnel
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true; // Champ optionnel
    return isValidPhoneNumber(phone);
  };

  const handleEmailChange = (value: string) => {
    setAddworkspaceForm((f) => ({ ...f, contact_email: value }));
    if (!validateEmail(value)) {
      setWorkspaceErrors((prev) => ({
        ...prev,
        contact_email: "Veuillez entrer un email valide",
      }));
    } else {
      setWorkspaceErrors((prev) => ({ ...prev, contact_email: "" }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setAddworkspaceForm((f) => ({ ...f, contact_phone: value }));

    if (!validatePhone(value)) {
      setWorkspaceErrors((prev) => ({
        ...prev,
        contact_phone: "Veuillez entrer un numéro de téléphone valide",
      }));
    } else {
      setWorkspaceErrors((prev) => ({ ...prev, contact_phone: "" }));
    }
  };

  // Fonctions de validation pour l'édition
  const handleEditEmailChange = (value: string) => {
    setEditworkspace((f) => ({ ...f, contact_email: value }));
    if (!validateEmail(value)) {
      setEditWorkspaceErrors((prev) => ({
        ...prev,
        contact_email: "Veuillez entrer un email valide",
      }));
    } else {
      setEditWorkspaceErrors((prev) => ({ ...prev, contact_email: "" }));
    }
  };

  const handleEditPhoneChange = (value: string) => {
    setEditworkspace((f) => ({ ...f, contact_phone: value }));

    if (!validatePhone(value)) {
      setEditWorkspaceErrors((prev) => ({
        ...prev,
        contact_phone: "Veuillez entrer un numéro de téléphone valide",
      }));
    } else {
      setEditWorkspaceErrors((prev) => ({ ...prev, contact_phone: "" }));
    }
  };

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addCompanyGroupId, setAddCompanyGroupId] = useState<string | null>(
    null,
  );
  const [addCompanyForm, setAddCompanyForm] = useState({
    name: "",
    siret: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",
    address: "",
    country: "",
    ape_code: "",
    main_activity: "",
    size: "SMALL",
    model: "SUBSIDIARY",
    groupId: "",
    workspaceId: "",
    logo: undefined as string | undefined,
  });
  const [addCompanyLoading, setAddCompanyLoading] = useState(false);
  const [addCompanyLogoFile, setAddCompanyLogoFile] = useState<File | null>(null);

  const [addBUOpen, setAddBUOpen] = useState(false);
  const [addBUCompanyId, setAddBUCompanyId] = useState<string | null>(null);
  const [addBUForm, setAddBUForm] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
    country: "",
    logo: undefined as string | undefined,
  });
  const [addBULoading, setAddBULoading] = useState(false);
  const [addBULogoFile, setAddBULogoFile] = useState<File | null>(null);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupForm, setAddGroupForm] = useState({
    name: "",
    siret: "",
    ape_code: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",
    mainActivity: "",
    country: "",
    workspaceId: "",
    logo: undefined as string | undefined,
  });
  const [addGroupLoading, setAddGroupLoading] = useState(false);

  const [addBUStandaloneOpen, setAddBUStandaloneOpen] = useState(false);
  const [addBUStandaloneForm, setAddBUStandaloneForm] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
    country: "",
    companyId: "",
  });
  const [addBUStandaloneLoading, setAddBUStandaloneLoading] = useState(false);

  const [editworkspace, setEditworkspace] = useState({
    name: "",
    description: "",
    logo: undefined as string | undefined,
    address: "",
    contact_email: "",
    contact_phone: "",
    manager_id: "",
  });
  const [editworkspaceLogoFile, setEditworkspaceLogoFile] = useState<File | null>(null);
  const [editGroupLogoFile, setEditGroupLogoFile] = useState<File | null>(null);
  const [addGroupLogoFile, setAddGroupLogoFile] = useState<File | null>(null);
  const [editCompanyLogoFile, setEditCompanyLogoFile] = useState<File | null>(null);
  const [editBULogoFile, setEditBULogoFile] = useState<File | null>(null);
  const [editGroup, setEditGroup] = useState({
    name: "",
    siret: "",
    ape_code: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",
    mainActivity: "",
    country: "",
    logo: undefined as string | undefined,
  });
  const [editCompany, setEditCompany] = useState({
    name: "",
    siret: "",
    address: "",
    country: "",
    ape_code: "",
    main_activity: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",
    size: "",
    model: "",
    logo: undefined as string | undefined,
    completionPercentage: 0,
  });
  const [editBU, setEditBU] = useState({
    name: "",
    code: "",
    activity: "",
    siret: "",
    country: "",
    logo: undefined as string | undefined,
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
    // Éviter les rechargements multiples
    if (treeLoading) return;

    setTreeLoading(true);
    setTreeError(null);
    try {
      const data = await fetchStructureTree();
      setTree(data);
      setIsTreeLoaded(true);
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
  }, [treeLoading]);

  // Only load the structure tree once auth bootstrap is done and we have a user.
  useEffect(() => {
    if (!isAuthReady || !user || isTreeLoaded) return;
    void loadTree();
  }, [isAuthReady, user, isTreeLoaded, loadTree]);

  // Keep structure in sync when returning to the tab/page (e.g. after imports or other changes).
  // useEffect(() => {
  //   if (!isAuthReady || !user) return;

  //   const refresh = () => {
  //     if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  //     void loadTree();
  //   };

  //   window.addEventListener("focus", refresh);
  //   document.addEventListener("visibilitychange", refresh);
  //   return () => {
  //     window.removeEventListener("focus", refresh);
  //     window.removeEventListener("visibilitychange", refresh);
  //   };
  // }, [isAuthReady, user, loadTree]);


  const loadBUsForCompany = useCallback(async (companyId: string) => {
    try {
      const data = await apiFetch<BusinessUnit[]>(
        `/companies/${companyId}/business-units`,
        { snackbar: { showSuccess: false, showError: true } },
      );
      console.log('Raw BU data from API:', data); // Debug log
      setBusByCompany((prev) => ({ ...prev, [companyId]: data }));
      return data;
    } catch {
      setBusByCompany((prev) => ({ ...prev, [companyId]: [] }));
      return [];
    }
  }, []);

  // Combine groups from workspaces and standalone groups
  const groupList = useMemo(() => {
    const orgGroups = (tree?.workspaces ?? []).flatMap((org) =>
      org.groups.map(group => ({ ...group, workspaceId: org.id }))
    );
    const standaloneGroups = (tree?.groups ?? []).map(group => ({ ...group, workspaceId: undefined }));
    return [...orgGroups, ...standaloneGroups];
  }, [tree]);

  const allTreeCompanies = useMemo<
    (TreeCompany & { groupId: string | null; workspaceId?: string })[]
  >(
    () => [
      // Companies from workspaces
      ...(tree?.workspaces ?? []).flatMap((org) =>
        org.groups.flatMap((g) =>
          g.companies.map((c) => ({ ...c, groupId: g.id, workspaceId: org.id })),
        ),
      ),
      // Standalone companies from workspaces
      ...(tree?.workspaces ?? []).flatMap((org) =>
        org.standaloneCompanies.map((c) => ({ ...c, groupId: null, workspaceId: org.id })),
      ),
      // Companies from standalone groups
      ...(tree?.groups ?? []).flatMap((g) =>
        g.companies.map((c) => ({ ...c, groupId: g.id, workspaceId: undefined })),
      ),
      // Completely standalone companies
      ...(tree?.standaloneCompanies ?? []).map((c) => ({
        ...c,
        groupId: null,
        workspaceId: undefined,
      })),
    ],
    [tree],
  );

  const companyListForLayout = useMemo(
    () => allTreeCompanies.map((c) => ({ id: c.id, name: c.name })),
    [allTreeCompanies],
  );

  // Pour les rôles non-admin, passer les workspaces au AppLayout
  const workspacesForLayout = useMemo(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      return []; // Les admins voient déjà toutes les workspaces dans la structure
    }
    return tree?.workspaces?.map((o) => ({ id: o.id, name: o.name })) || [];
  }, [tree?.workspaces, user?.role]);

  const companiesWithBus = useMemo(() => {
    const ids = new Set<string>();
    // Companies from workspace groups
    (tree?.workspaces ?? []).forEach((org) => {
      org.groups.forEach((g) => {
        g.companies.forEach((c) => {
          if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
        });
      });
      // Standalone companies from workspaces
      org.standaloneCompanies.forEach((c) => {
        if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
      });
    });
    // Companies from standalone groups
    (tree?.groups ?? []).forEach((g) => {
      g.companies.forEach((c) => {
        if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
      });
    });
    // Completely standalone companies
    (tree?.standaloneCompanies ?? []).forEach((c) => {
      if ((c.businessUnits ?? []).length > 0) ids.add(c.id);
    });
    return ids;
  }, [tree]);

  const totalBusinessUnits = useMemo(() => {
    let count = 0;
    // Business units from workspace groups
    (tree?.workspaces ?? []).forEach((org) => {
      org.groups.forEach((g) => {
        g.companies.forEach((c) => {
          count += (c.businessUnits ?? []).length;
        });
      });
      // Standalone companies from workspaces
      org.standaloneCompanies.forEach((c) => {
        count += (c.businessUnits ?? []).length;
      });
    });
    // Business units from standalone groups
    (tree?.groups ?? []).forEach((g) => {
      g.companies.forEach((c) => {
        count += (c.businessUnits ?? []).length;
      });
    });
    // Completely standalone companies
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
      workspaces: [] as Treeworkspace[],
      groups: [] as TreeGroup[],
      standaloneCompanies: [] as TreeCompany[],
    };

    // Filtrer les workspaces et leurs groupes/entreprises
    (tree?.workspaces ?? []).forEach((org) => {
      const orgMatches = org.name.toLowerCase().includes(query) ||
        org.description?.toLowerCase().includes(query);

      const filteredGroups = org.groups.map((group) => {
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

        if (groupMatches || filteredCompanies.length > 0) {
          return {
            ...group,
            companies: filteredCompanies.length > 0 ? filteredCompanies : group.companies,
          };
        }
        return null;
      }).filter((g): g is TreeGroup => g !== null);

      // Filtrer les entreprises indépendantes de l'workspace
      const filteredStandaloneCompanies = org.standaloneCompanies.filter((company) => {
        const companyMatches =
          company.name.toLowerCase().includes(query) ||
          company.siret?.toLowerCase().includes(query);

        const filteredBUs =
          company.businessUnits?.filter(
            (bu) =>
              bu.name.toLowerCase().includes(query) ||
              bu.code.toLowerCase().includes(query),
          ) || [];

        return companyMatches || filteredBUs.length > 0;
      });

      if (orgMatches || filteredGroups.length > 0 || filteredStandaloneCompanies.length > 0) {
        filtered.workspaces.push({
          ...org,
          groups: filteredGroups,
          standaloneCompanies: filteredStandaloneCompanies,
        });
      }
    });

    // Filtrer les groupes standalone et leurs entreprises
    (tree?.groups ?? []).forEach((group) => {
      const groupMatches = group.name.toLowerCase().includes(query);
      const filteredCompanies = group.companies.filter((company) => {
        const companyMatches =
          company.name.toLowerCase().includes(query) ||
          company.siret?.toLowerCase().includes(query);

        const filteredBUs =
          company.businessUnits?.filter(
            (bu) =>
              bu.name.toLowerCase().includes(query) ||
              bu.code.toLowerCase().includes(query),
          ) || [];

        return companyMatches || filteredBUs.length > 0;
      });

      if (groupMatches || filteredCompanies.length > 0) {
        filtered.groups.push({
          ...group,
          companies: filteredCompanies.length > 0 ? filteredCompanies : group.companies,
        });
      }
    });

    // Filtrer les entreprises complètement indépendantes
    filtered.standaloneCompanies = (tree?.standaloneCompanies ?? []).filter(
      (company) => {
        const companyMatches =
          company.name.toLowerCase().includes(query) ||
          company.siret?.toLowerCase().includes(query);

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
  const filteredGroupList = useMemo(() => {
    const orgGroups = (filteredTreeData?.workspaces ?? []).flatMap((org) =>
      org.groups.map(group => ({ ...group, workspaceId: org.id }))
    );
    const standaloneGroups = (filteredTreeData?.groups ?? []).map(group => ({ ...group, workspaceId: undefined }));
    return [...orgGroups, ...standaloneGroups];
  }, [filteredTreeData]);

  const filteredAllTreeCompanies = useMemo<
    (TreeCompany & { groupId: string | null; workspaceId?: string })[]
  >(
    () => [
      // Companies from workspaces
      ...(filteredTreeData?.workspaces ?? []).flatMap((org) =>
        org.groups.flatMap((g) =>
          g.companies.map((c) => ({ ...c, groupId: g.id, workspaceId: org.id })),
        ),
      ),
      // Standalone companies from workspaces
      ...(filteredTreeData?.workspaces ?? []).flatMap((org) =>
        org.standaloneCompanies.map((c) => ({ ...c, groupId: null, workspaceId: org.id })),
      ),
      // Companies from standalone groups
      ...(filteredTreeData?.groups ?? []).flatMap((g) =>
        g.companies.map((c) => ({ ...c, groupId: g.id, workspaceId: undefined })),
      ),
      // Completely standalone companies
      ...(filteredTreeData?.standaloneCompanies ?? []).map((c) => ({
        ...c,
        groupId: null,
        workspaceId: undefined,
      })),
    ],
    [filteredTreeData],
  );

  const treeRows = useMemo(() => {
    const rows: TreeNode[] = [];

    console.log('filteredTreeData workspaces:', filteredTreeData?.workspaces);

    // Ajouter les workspaces et leurs groupes/entreprises
    (filteredTreeData?.workspaces ?? []).forEach((org) => {
      // N'afficher les workspaces que pour SUPER_ADMIN et ADMIN
      if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
        rows.push({ type: "workspace", id: org.id, name: org.name });
        console.log(`Added workspace: ${org.name}`);
      }

      // Ajouter les groupes de l'workspace immédiatement après le workspace
      org.groups.forEach((g) => {
        rows.push({ type: "group", id: g.id, name: g.name });
        console.log(`Added group for workspace ${org.name}: ${g.name}`);
        g.companies.forEach((c) => {
          rows.push({
            type: "company",
            id: c.id,
            name: c.name,
            groupId: g.id,
            workspaceId: org.id,
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

      // Ajouter les entreprises indépendantes de l'workspace dans une section séparée
      if (org.standaloneCompanies.length > 0) {
        rows.push({
          type: "section-header",
          id: `org-${org.id}-standalone-header`,
          name: "ENTREPRISES INDÉPENDANTES",
        });
        org.standaloneCompanies.forEach((c) => {
          rows.push({
            type: "company",
            id: c.id,
            name: c.name,
            groupId: null,
            workspaceId: org.id,
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
    });

    // Ajouter les groupes standalone et leurs entreprises (seulement s'ils n'ont pas déjà été ajoutés via les workspaces)
    const workspaceGroupIds = new Set(
      (filteredTreeData?.workspaces ?? []).flatMap((org) =>
        org.groups.map((g) => g.id)
      )
    );

    (filteredTreeData?.groups ?? []).forEach((g) => {
      if (!workspaceGroupIds.has(g.id)) {
        rows.push({ type: "group", id: g.id, name: g.name });
        console.log(`Added standalone group: ${g.name}`);
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
      }
    });

    // Ajouter les entreprises complètement indépendantes avec un en-tête de section
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

    console.log('Final treeRows order:', rows.map(r => `${r.type}: ${r.name || 'Sans nom'}`));
    return rows;
  }, [filteredTreeData, expandedCompanyIds, user]);

  const openDetail = useCallback(
    async (node: TreeNode) => {
      console.log('=== OUVERTURE MODAL ===');
      console.log('Node clicked:', node);
      console.log('Current editBU before update:', editBU);

      setSelectedNode(node);
      setEditing(false);
      setNodeUsers(null);

      // Réinitialiser editBU avec des valeurs vides AVANT de charger les nouvelles données
      setEditBU({
        name: "",
        code: "",
        activity: "",
        siret: "",
        country: "",
        logo: undefined as string | undefined,
      });

      if (node.type === "workspace") {
        try {
          const org = await apiFetch<workspaceFull>(`/workspaces/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditworkspace({
            name: org.name,
            description: org.description ?? "",
            logo: org.logo ?? "",
            address: org.address ?? "",
            contact_email: org.contact_email ?? "",
            contact_phone: org.contact_phone ?? "",
            manager_id: org.manager_id ?? "",
          });
          setEditworkspaceLogoFile(null);
          setEditWorkspaceErrors({ contact_email: "", contact_phone: "" });
        } catch {
          setEditworkspace({
            name: node.name,
            description: "",
            logo: undefined as string | undefined,
            address: "",
            contact_email: "",
            contact_phone: "",
            manager_id: "",
          });
          setEditworkspaceLogoFile(null);
          setEditWorkspaceErrors({ contact_email: "", contact_phone: "" });
        }
      } else if (node.type === "group") {
        try {
          const g = await apiFetch<GroupFull>(`/groups/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditGroup({
            name: g.name,
            siret: g.siret ?? "",
            ape_code: g.ape_code ?? "",
            fiscal_year_start: toMonthDay(g.fiscal_year_start),
            last_closed_fiscal_year:
              g.last_closed_fiscal_year !== null &&
              g.last_closed_fiscal_year !== undefined
                ? String(g.last_closed_fiscal_year)
                : "",
            mainActivity: g.mainActivity ?? "",
            country: g.country ?? "",
            logo: g.logo ?? "",
          });
        } catch {
          setEditGroup({
            name: node.name,
            siret: "",
            ape_code: "",
            fiscal_year_start: "",
            last_closed_fiscal_year: "",
            mainActivity: "",
            country: "",
            logo: undefined as string | undefined,
          });
          setEditGroupLogoFile(null);
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
            country: c.country ?? "",
            ape_code: c.ape_code ?? "",
            main_activity: c.main_activity ?? "",
            fiscal_year_start: toMonthDay(c.fiscal_year_start),
            last_closed_fiscal_year:
              c.last_closed_fiscal_year !== null &&
              c.last_closed_fiscal_year !== undefined
                ? String(c.last_closed_fiscal_year)
                : "",
            size: c.size ?? "",
            model: c.model ?? "",
            logo: c.logo ?? "",
            completionPercentage: c.completionPercentage ?? 0,
          });
        } catch {
          setEditCompany({
            name: node.name,
            siret: "",
            address: "",
            country: "",
            ape_code: "",
            main_activity: "",
            fiscal_year_start: "",
            last_closed_fiscal_year: "",
            size: "",
            model: "",
            logo: undefined as string | undefined,
            completionPercentage: 0,
          });
        }
        loadBUsForCompany(node.id);
      } else if (node.type === "bu") {
        // Forcer toujours le rechargement depuis l'API pour avoir les données complètes
        const freshBUs = await loadBUsForCompany(node.companyId);
        console.log('All BUs from API:', freshBUs); // Debug log
        console.log('Looking for BU with ID:', node.id); // Debug log
        const bu = freshBUs.find((b) => b.id === node.id);
        console.log('Found BU:', bu); // Debug log

        if (bu) {
          const updatedEditBU = {
            name: bu.name,
            code: bu.code,
            activity: bu.activity || "",
            siret: bu.siret || "",
            country: bu.country || "",
            logo: bu.logo || "",
          };
          console.log('Setting editBU to:', updatedEditBU); // Debug log
          setEditBU(updatedEditBU);
        } else {
          // Valeurs par défaut seulement si la BU n'est pas trouvée
          setEditBU({
            name: node.name,
            code: node.code,
            activity: "",
            siret: "",
            country: "",
            logo: undefined as string | undefined,
          });
        }
        loadBUsForCompany(node.id);
      }

      // Load managers & users linked to this node
      const nodeTypeParam =
        node.type === "workspace"
          ? "WORKSPACE"
          : node.type === "group"
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
    if (selectedNode.type === "workspace") {
      // Valider l'email et le téléphone
      const emailValid = validateEmail(editworkspace.contact_email);
      const phoneValid = validatePhone(editworkspace.contact_phone);

      if (!emailValid || !phoneValid) {
        // Mettre à jour les erreurs
        setEditWorkspaceErrors({
          contact_email: emailValid ? "" : "Veuillez entrer un email valide",
          contact_phone: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', editworkspace.name);
      if (editworkspace.description) {
        formData.append('description', editworkspace.description);
      }
      if (editworkspace.address) {
        formData.append('address', editworkspace.address);
      }
      if (editworkspace.contact_email) {
        formData.append('contact_email', editworkspace.contact_email);
      }
      if (editworkspace.contact_phone) {
        formData.append('contact_phone', editworkspace.contact_phone);
      }
      if (editworkspace.manager_id) {
        formData.append('manager_id', editworkspace.manager_id);
      }
      if (editworkspaceLogoFile) {
        formData.append('logo', editworkspaceLogoFile);
      }

      const updatedOrg = await apiFetch<workspaceFull>(`/workspaces/${selectedNode.id}`, {
        method: "PUT",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Workspace mise à jour" },
      });
      setEditworkspaceLogoFile(null);
      setEditWorkspaceErrors({ contact_email: "", contact_phone: "" });
      // Mettre à jour l'état local avec le logo retourné par le serveur
      if (updatedOrg) {
        setEditworkspace(prev => ({
          ...prev,
          logo: updatedOrg.logo || ""
        }));
      }
    } else if (selectedNode.type === "group") {
      const formData = new FormData();
      formData.append('name', editGroup.name);
      if (editGroup.siret) {
        formData.append('siret', editGroup.siret);
      }
      if (editGroup.ape_code) {
        formData.append('ape_code', editGroup.ape_code);
      }
      const normalizedGroupFiscalYearStart = toMonthDay(editGroup.fiscal_year_start);
      if (normalizedGroupFiscalYearStart) {
        formData.append('fiscal_year_start', normalizedGroupFiscalYearStart);
      }
      if (editGroup.last_closed_fiscal_year.trim()) {
        formData.append('last_closed_fiscal_year', editGroup.last_closed_fiscal_year.trim());
      }
      if (editGroup.mainActivity) {
        formData.append('mainActivity', editGroup.mainActivity);
      }
      if (editGroup.country) {
        formData.append('country', editGroup.country);
      }
      if (editGroupLogoFile) {
        formData.append('logo', editGroupLogoFile);
      }

      const updatedGroup = await apiFetch<GroupFull>(`/groups/${selectedNode.id}`, {
        method: "PUT",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Groupe mis à jour" },
      });
      setEditGroupLogoFile(null);
      // Mettre à jour l'état local avec le logo retourné par le serveur
      if (updatedGroup) {
        setEditGroup(prev => ({
          ...prev,
          logo: updatedGroup.logo || ""
        }));
      }
    } else if (selectedNode.type === "company") {
      const formData = new FormData();
      formData.append('name', editCompany.name);
      if (editCompany.siret) {
        formData.append('siret', editCompany.siret);
      }
      if (editCompany.address) {
        formData.append('address', editCompany.address);
      }
      if (editCompany.country) {
        formData.append('country', editCompany.country);
      }
      if (editCompany.ape_code) {
        formData.append('ape_code', editCompany.ape_code);
      }
      if (editCompany.main_activity) {
        formData.append('main_activity', editCompany.main_activity);
      }
      const normalizedCompanyFiscalYearStart = toMonthDay(editCompany.fiscal_year_start);
      if (normalizedCompanyFiscalYearStart) {
        formData.append('fiscal_year_start', normalizedCompanyFiscalYearStart);
      }
      if (editCompany.last_closed_fiscal_year.trim()) {
        formData.append(
          'last_closed_fiscal_year',
          editCompany.last_closed_fiscal_year.trim(),
        );
      }
      if (editCompany.size) {
        formData.append('size', editCompany.size);
      }
      if (editCompany.model) {
        formData.append('model', editCompany.model);
      }
      if (editCompanyLogoFile) {
        formData.append('logo', editCompanyLogoFile);
      }
      formData.append('completionPercentage', String(editCompany.completionPercentage || 0));

      const updatedCompany = await apiFetch<CompanyFull>(`/companies/${selectedNode.id}`, {
        method: "PUT",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: {
          showSuccess: true,
          successMessage: "Entreprise mise à jour",
        },
      });
      setEditCompanyLogoFile(null);
      setEditBULogoFile(null);
      // Mettre à jour l'état local avec le logo retourné par le serveur
      if (updatedCompany) {
        setEditCompany(prev => ({
          ...prev,
          logo: updatedCompany.logo || ""
        }));
      }
    } else if (selectedNode.type === "bu") {
      const formData = new FormData();
      formData.append('name', editBU.name);
      if (editBU.code) {
        formData.append('code', editBU.code);
      }
      if (editBU.activity) {
        formData.append('activity', editBU.activity);
      }
      if (editBU.siret) {
        formData.append('siret', editBU.siret);
      }
      if (editBU.country) {
        formData.append('country', editBU.country);
      }
      if (editBULogoFile) {
        formData.append('logo', editBULogoFile);
      }

      const updatedBU = await apiFetch<BusinessUnit>(
        `/companies/${selectedNode.companyId}/business-units/${selectedNode.id}`,
        {
          method: "PUT",
          body: formData,
          snackbar: {
            showSuccess: true,
            successMessage: "Business unit mise à jour",
          },
        },
      );
      setEditBULogoFile(null);

      // Mettre à jour l'état local avec les données retournées par le serveur
      if (updatedBU) {
        setEditBU(prev => ({
          ...prev,
          name: updatedBU.name,
          code: updatedBU.code,
          activity: updatedBU.activity,
          siret: updatedBU.siret,
          logo: updatedBU.logo || ""
        }));

        // Recharger les BUs pour mettre à jour l'affichage dans l'arbre
        await loadBUsForCompany(selectedNode.companyId);
      }
    }
    setEditing(false);
    setDetailOpen(false);
    // Recharger l'arbre pour refléter les changements
    void loadTree();
  };

  const handleCreateworkspace = async () => {
    if (!addworkspaceForm.name.trim()) return;

    // Valider l'email et le téléphone
    const emailValid = validateEmail(addworkspaceForm.contact_email);
    const phoneValid = validatePhone(addworkspaceForm.contact_phone);

    if (!emailValid || !phoneValid) {
      // Mettre à jour les erreurs
      setWorkspaceErrors({
        contact_email: emailValid ? "" : "Veuillez entrer un email valide",
        contact_phone: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
      });
      return;
    }

    setAddworkspaceLoading(true);
    try {
      // Créer FormData pour l'upload du fichier
      const formData = new FormData();
      formData.append('name', addworkspaceForm.name.trim());
      formData.append('description', addworkspaceForm.description.trim() || '');
      formData.append('address', addworkspaceForm.address.trim() || '');
      formData.append('contact_email', addworkspaceForm.contact_email.trim() || '');
      formData.append('contact_phone', addworkspaceForm.contact_phone.trim() || '');

      // Ajouter le fichier logo s'il existe
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // Utiliser apiFetch pour avoir le snackbar de succès
      await apiFetch("/workspaces", {
        method: 'POST',
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Workspace créée avec succès" },
      });

      setAddworkspaceOpen(false);
      setAddworkspaceForm({
        name: "",
        description: "",
        logo: undefined as string | undefined,
        address: "",
        contact_email: "",
        contact_phone: "",
        manager_id: "",
      });
      setLogoFile(null);
      setLogoPreview("");
      setWorkspaceErrors({ contact_email: "", contact_phone: "" });
      void loadTree();
    } finally {
      setAddworkspaceLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "workspace") {
      await apiFetch(`/workspaces/${selectedNode.id}`, {
        method: "DELETE",
        snackbar: { showSuccess: true, successMessage: "Workspace supprimée" },
      });
    } else if (selectedNode.type === "group") {
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


  const handleAddCompanyToGroup = async () => {
    console.log('handleAddCompanyToGroup called with:', {
      addCompanyGroupId,
      addCompanyForm
    });

    // Déterminer le groupId et workspaceId finaux
    const finalGroupId = addCompanyGroupId || addCompanyForm.groupId;
    const finalWorkspaceId = addCompanyGroupId
      ? groupList.find(g => g.id === addCompanyGroupId)?.workspaceId
      : addCompanyForm.workspaceId;

    // Validation
    if (!addCompanyForm.name?.trim()) {
      console.error('Missing required fields:', {
        name: addCompanyForm.name
      });
      return;
    }

    // Valider le SIRET avant d'envoyer la requête
    if (addCompanyForm.siret && !validateSiret(addCompanyForm.siret)) {
      return;
    }

    // Validation pour le mode standalone : un groupe est requis
    if (!addCompanyGroupId && !finalGroupId) {
      console.error('Un groupe est requis');
      return;
    }

    // Validation supplémentaire
    const normalizedCompanyFiscalYearStart = toMonthDay(addCompanyForm.fiscal_year_start);
    if (!isValidMonthDay(normalizedCompanyFiscalYearStart)) {
      console.error("La date de début d'exercice est invalide (DD-MM)");
      return;
    }

    const targetName = addCompanyGroupId
      ? groupList.find(g => g.id === addCompanyGroupId)?.name
      : (finalGroupId ? groupList.find(g => g.id === finalGroupId)?.name : 'Workspace direct');

    console.log('Creating company:', targetName);
    setAddCompanyLoading(true);
    try {
      const formData = new FormData();

      // Ajouter groupId si présent
      if (finalGroupId) {
        formData.append('groupId', finalGroupId);
      }

      // Ajouter workspace_id si présent
      if (finalWorkspaceId) {
        formData.append('workspace_id', finalWorkspaceId);
      }

      formData.append('name', addCompanyForm.name);
      if (addCompanyForm.siret) {
        formData.append('siret', addCompanyForm.siret);
      }
      formData.append('fiscal_year_start', normalizedCompanyFiscalYearStart);
      if (addCompanyForm.last_closed_fiscal_year.trim()) {
        formData.append(
          'last_closed_fiscal_year',
          addCompanyForm.last_closed_fiscal_year.trim(),
        );
      }
      if (addCompanyForm.address) {
        formData.append('address', addCompanyForm.address);
      }
      if (addCompanyForm.ape_code) {
        formData.append('ape_code', addCompanyForm.ape_code);
      }
      if (addCompanyForm.main_activity) {
        formData.append('main_activity', addCompanyForm.main_activity);
      }
      if (addCompanyForm.country) {
        formData.append('country', addCompanyForm.country);
      }
      formData.append('size', addCompanyForm.size);
      formData.append('model', addCompanyForm.model);
      if (addCompanyLogoFile) {
        console.log('Adding logo file:', addCompanyLogoFile.name, addCompanyLogoFile.size, addCompanyLogoFile.type);
        formData.append('logo', addCompanyLogoFile, addCompanyLogoFile.name);
      }

      console.log('Sending FormData:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await apiFetch("/companies", {
        method: "POST",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Entreprise créée" },
      });

      console.log('Company created successfully:', response);
      await loadTree();
      setAddCompanyOpen(false);
      setAddCompanyForm({
        name: "",
        siret: "",
        fiscal_year_start: "",
        last_closed_fiscal_year: "",
        address: "",
        country: "",
        ape_code: "",
        main_activity: "",
        size: "SMALL",
        model: "SUBSIDIARY",
        groupId: "",
        workspaceId: "",
        logo: undefined as string | undefined,
      });
      setAddCompanyLogoFile(null);
    } catch (error) {
      console.error('Error creating company:', error);
      // Gestion d'erreur plus détaillée
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setAddCompanyLoading(false);
    }
  };

  const handleAddBUToCompany = async () => {
    if (!addBUCompanyId || !addBUForm.name.trim()) return;

    // Valider le SIRET avant d'envoyer la requête
    if (addBUForm.siret && !validateSiret(addBUForm.siret)) {
      return;
    }

    setAddBULoading(true);
    try {
      const formData = new FormData();
      formData.append('name', addBUForm.name);
      if (addBUForm.code) {
        formData.append('code', addBUForm.code);
      }
      if (addBUForm.activity) {
        formData.append('activity', addBUForm.activity);
      }
      if (addBUForm.siret) {
        formData.append('siret', addBUForm.siret);
      }
      if (addBUForm.country) {
        formData.append('country', addBUForm.country);
      }
      if (addBULogoFile) {
        formData.append('logo', addBULogoFile);
      }

      await apiFetch(`/companies/${addBUCompanyId}/business-units`, {
        method: "POST",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Business unit créée" },
      });
      await loadTree();
      setExpandedCompanyIds((prev) => new Set(prev).add(addBUCompanyId!));
      setAddBUOpen(false);
      setAddBUForm({ name: "", code: "", activity: "", siret: "", country: "", logo: undefined });
      setAddBULogoFile(null);
    } catch {
      /* snackbar handles */
    } finally {
      setAddBULoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!addGroupForm.name.trim()) return;
    const normalizedGroupFiscalYearStart = toMonthDay(addGroupForm.fiscal_year_start);
    if (!isValidMonthDay(normalizedGroupFiscalYearStart)) {
      console.error("La date de début d'exercice est invalide (DD-MM)");
      return;
    }

    // Valider le SIRET avant d'envoyer la requête
    if (addGroupForm.siret && !validateSiret(addGroupForm.siret)) {
      return;
    }

    setAddGroupLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', addGroupForm.name);
      if (addGroupForm.siret) {
        formData.append('siret', addGroupForm.siret);
      }
      if (addGroupForm.ape_code) {
        formData.append('ape_code', addGroupForm.ape_code);
      }
      if (normalizedGroupFiscalYearStart) {
        formData.append('fiscal_year_start', normalizedGroupFiscalYearStart);
      }
      if (addGroupForm.last_closed_fiscal_year.trim()) {
        formData.append(
          'last_closed_fiscal_year',
          addGroupForm.last_closed_fiscal_year.trim(),
        );
      }
      if (addGroupForm.mainActivity) {
        formData.append('mainActivity', addGroupForm.mainActivity);
      }
      if (addGroupForm.country) {
        formData.append('country', addGroupForm.country);
      }
      if (addGroupForm.workspaceId) {
        formData.append('workspace_id', addGroupForm.workspaceId);
      }
      if (addGroupLogoFile) {
        formData.append('logo', addGroupLogoFile);
      }

      await apiFetch("/groups", {
        method: "POST",
        body: formData,
        headers: {}, // Important: ne pas définir Content-Type pour FormData
        snackbar: { showSuccess: true, successMessage: "Groupe créé" },
      });
      await loadTree();
      setAddGroupOpen(false);
      setAddGroupForm({
        name: "",
        siret: "",
        ape_code: "",
        fiscal_year_start: "",
        last_closed_fiscal_year: "",
        mainActivity: "",
        country: "",
        workspaceId: "",
        logo: undefined as string | undefined,
      });
      setAddGroupLogoFile(null);
    } catch {
      /* snackbar handles */
    } finally {
      setAddGroupLoading(false);
    }
  };

  const handleCreateBUStandalone = async () => {
    if (!addBUStandaloneForm.name.trim() || !addBUStandaloneForm.companyId)
      return;

    // Valider le SIRET avant d'envoyer la requête
    if (addBUStandaloneForm.siret && !validateSiret(addBUStandaloneForm.siret)) {
      return;
    }

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
            country: addBUStandaloneForm.country,
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
        country: "",
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
    loadCompanyExtraData(companyId);
  };

  const openFicheGroup = async (groupId: string) => {
    setFicheGroupId(groupId);
    setFicheGroupTab("informations");
    setFicheGroupOpen(true);
    setFicheGroup(null);
    try {
      const g = await apiFetch<GroupFull>(`/groups/${groupId}`, {
        snackbar: { showSuccess: false, showError: true },
      });
      setFicheGroup(g);
    } catch {
      /* snackbar handles */
    }
    loadGroupExtraData(groupId);
  };

  const openFicheBU = async (buId: string, companyId?: string) => {
    setFicheBUId(buId);
    setFicheBUTab("informations");
    setFicheBUOpen(true);
    setFicheBU(null);

    try {
      // Si companyId est fourni, l'utiliser directement
      if (companyId) {
        const bu = await apiFetch<BusinessUnit>(
          `/companies/${companyId}/business-units/${buId}`,
          {
            snackbar: { showSuccess: false, showError: true },
          }
        );
        setFicheBU(bu);
      } else {
        // Sinon, chercher la BU dans toutes les entreprises pour trouver son companyId
        let foundBU: BusinessUnit | null = null;
        let foundCompanyId = "";

        // Parcourir toutes les entreprises pour trouver la BU
        for (const company of allTreeCompanies) {
          try {
            const bus = await apiFetch<BusinessUnit[]>(
              `/companies/${company.id}/business-units`,
              { snackbar: { showSuccess: false, showError: false } }
            );
            const bu = bus.find(b => b.id === buId);
            if (bu) {
              foundBU = bu;
              foundCompanyId = company.id;
              break;
            }
          } catch {
            // Ignorer les erreurs et continuer la recherche
            continue;
          }
        }

        if (foundBU) {
          setFicheBU(foundBU);
        } else {
          throw new Error("Business Unit non trouvée");
        }
      }
    } catch {
      /* snackbar handles */
    }
    loadBUExtraData(buId);
  };

  // Fonction pour gérer le clic sur un emprunt
  const handleLoanClick = (loanId: string) => {
    router.push({
      pathname: '/loans',
      query: {
        tab: 'details',
        loanId: loanId
      }
    });
  };

  // Fonctions pour charger les données extracomptables
  const loadGroupExtraData = async (groupId: string) => {
    setFicheGroupDataLoading(true);
    try {
      // Charger les emprunts du groupe
      const loansResponse = await apiFetch<{ loans: any[]; total: number }>(
        `/loans/by-entity/group/${groupId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );

      // Transformer les données des prêts en format Emprunt
      const emprunts = (loansResponse?.loans || []).map(loan => ({
        id: loan.id,
        amount: loan.principalAmount || 0,
        description: loan.name || loan.description,
        date: loan.createdAt || loan.firstInstallmentDate,
        interest_rate: loan.annualInterestRate,
        duration_months: loan.durationMonths
      }));

      setFicheGroupEmprunts(emprunts);
    } catch {
      setFicheGroupEmprunts([]);
    } finally {
      setFicheGroupDataLoading(false);
    }
  };

  const loadBUExtraData = async (buId: string) => {
    setFicheBUDataLoading(true);
    try {
      // Charger les emprunts de la BU
      const loansResponse = await apiFetch<{ loans: any[]; total: number }>(
        `/loans/by-entity/business unit/${buId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );

      // Transformer les données des prêts en format Emprunt
      const emprunts = (loansResponse?.loans || []).map(loan => ({
        id: loan.id,
        amount: loan.principalAmount || 0,
        description: loan.name || loan.description,
        date: loan.createdAt || loan.firstInstallmentDate,
        interest_rate: loan.annualInterestRate,
        duration_months: loan.durationMonths
      }));

      setFicheBUEmprunts(emprunts);
    } catch {
      setFicheBUEmprunts([]);
    } finally {
      setFicheBUDataLoading(false);
    }
  };

  const loadCompanyExtraData = async (companyId: string) => {
    setFicheCompanyDataLoading(true);
    try {
      // Charger les emprunts de l'entreprise
      const loansResponse = await apiFetch<{ loans: any[]; total: number }>(
        `/loans/by-entity/company/${companyId}`,
        { snackbar: { showSuccess: false, showError: false } }
      );

      // Transformer les données des prêts en format Emprunt
      const emprunts = (loansResponse?.loans || []).map(loan => ({
        id: loan.id,
        amount: loan.principalAmount || 0,
        description: loan.name || loan.description,
        date: loan.createdAt || loan.firstInstallmentDate,
        interest_rate: loan.annualInterestRate,
        duration_months: loan.durationMonths
      }));

      setFicheCompanyEmprunts(emprunts);
    } catch {
      setFicheCompanyEmprunts([]);
    } finally {
      setFicheCompanyDataLoading(false);
    }
  };

  const typeLabel =
    selectedNode?.type === "workspace"
      ? "Workspace"
      : selectedNode?.type === "group"
        ? "Groupe"
        : selectedNode?.type === "company"
          ? "Entreprise"
          : "Business Unit";

  return (
    <AppLayout
      title="Structure"
      companies={companyListForLayout}
      workspaces={workspacesForLayout}
      selectedCompanyId=""
      onCompanyChange={() => { }}
    >
      <Head>
        <title>Structure de l&apos;workspace</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-network h-5 w-5 text-primary" aria-hidden="true">
                <circle cx="12" cy="5" r="3"></circle>
                <circle cx="6" cy="19" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="8" x2="12" y2="9"></line>
                <line x1="9" y1="11" x2="6" y2="16"></line>
                <line x1="15" y1="11" x2="18" y2="16"></line>
                <line x1="12" y1="15" x2="12" y2="16"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">
                {user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
                  ? "Structure des workspaces"
                  : tree?.workspaces?.[0]?.name || "Structure des workspaces"}
              </h2>
              <p className="text-sm text-slate-500">Gérez la structure hiérarchique de votre workspace et pilotez l&apos;ensemble de vos entités.</p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="h-9 w-[260px] rounded-lg border-slate-200 pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 w-full">
            {canImportStructure && (
              <Link
                href="/structure/import/upload"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
              >
                <Upload className="size-4" />
                Importer
              </Link>
            )}
            {(user?.role === "SUPER_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "HEAD_MANAGER" ||
              user?.role === "MANAGER") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary text-white hover:bg-slate-800">
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                      <DropdownMenuItem
                        onClick={() => setAddworkspaceOpen(true)}
                        className="gap-2"
                      >
                        <Layers className="h-4 w-4 text-purple-600" />
                        Workspace
                      </DropdownMenuItem>
                    )}

                    {(user?.role === "SUPER_ADMIN" ||
                      user?.role === "ADMIN" ||
                      user?.role === "HEAD_MANAGER" ||
                      user?.role === "MANAGER") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setAddGroupOpen(true)}
                            disabled={
                              !canCreateCompany ||
                              !tree?.workspaces ||
                              tree.workspaces.length === 0
                            }
                            title={
                              !tree?.workspaces || tree.workspaces.length === 0
                                ? "Créez d'abord une workspace"
                                : ""
                            }
                            className="gap-2"
                          >
                            <Building2 className="h-4 w-4 text-blue-600" />
                            Groupe
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setAddCompanyGroupId(null);
                              setAddCompanyForm({
                                name: "",
                                siret: "",
                                fiscal_year_start: "",
                                last_closed_fiscal_year: "",
                                address: "",
                                country: "",
                                ape_code: "",
                                main_activity: "",
                                size: "SMALL",
                                model: "SUBSIDIARY",
                                groupId: "",
                                workspaceId: "",
                                logo: undefined as string | undefined,
                              });
                              setAddCompanyOpen(true);
                            }}
                            disabled={
                              !canCreateCompany ||
                              !tree?.workspaces ||
                              tree.workspaces.length === 0
                            }
                            title={
                              !tree?.workspaces || tree.workspaces.length === 0
                                ? "Créez d'abord une workspace"
                                : ""
                            }
                            className="gap-2"
                          >
                            <Building className="h-4 w-4 text-slate-700" />
                            Entreprise
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAddBUStandaloneOpen(true)}
                            disabled={
                              !canCreateCompany ||
                              !tree?.workspaces ||
                              tree.workspaces.length === 0
                            }
                            title={
                              !tree?.workspaces || tree.workspaces.length === 0
                                ? "Créez d'abord une workspace"
                                : ""
                            }
                            className="gap-2"
                          >
                            <Briefcase className="h-4 w-4 text-emerald-600" />
                            Business Unit
                          </DropdownMenuItem>
                        </>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
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
            <>
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
                ) : null}
              </div>
            </>
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

              {tree?.workspaces && tree.workspaces.length > 0 && (
                <div className="grid grid-cols-[1fr_120px_100px_60px] gap-4 border-b border-slate-200 bg-slate-100 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <div className="flex items-center">
                    Nom
                  </div>
                  <div className="flex items-center">
                    Type
                  </div>
                  <div className="flex items-center">
                    Complétion
                  </div>
                  <div className="text-right">Actions</div>
                </div>
              )}

              <ul className="divide-y divide-slate-100">
                {treeRows.map((node) => {
                  // Gérer l'en-tête de section pour les entreprises indépendantes
                  if (node.type === "section-header") {
                    const isPackageIcon = node.name === "ENTREPRISES INDÉPENDANTES";
                    return (
                      <li
                        key={node.id}
                        className="bg-slate-50/80 border-y border-slate-100"
                      >
                        <div className="px-6 py-3 flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200" />
                          <div className="flex items-center gap-2">
                            {isPackageIcon ? (
                              <Package className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Building className="h-4 w-4 text-amber-600" />
                            )}
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
                    node.type === "workspace" ? 0 :
                      node.type === "group" ? 1 :
                        node.type === "company" ? 2 : 3;
                  const Icon =
                    node.type === "workspace"
                      ? Building2
                      : node.type === "group"
                        ? Layers
                        : node.type === "company"
                          ? Building
                          : Briefcase;
                  const iconColor =
                    node.type === "workspace"
                      ? "text-purple-600"
                      : node.type === "group"
                        ? "text-blue-600"
                        : node.type === "company"
                          ? "text-slate-700"
                          : "text-emerald-600";
                  const typeText =
                    node.type === "workspace"
                      ? "Workspace"
                      : node.type === "group"
                        ? "Groupe"
                        : node.type === "company"
                          ? "Entreprise"
                          : "BU";
                  const typeBadgeColor =
                    node.type === "workspace"
                      ? "bg-purple-50 text-purple-700 border-purple-100"
                      : node.type === "group"
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
                                className={`h-3 w-3 fill-slate-500 text-slate-400 transition-transform ${expandedCompanyIds.has(node.id)
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
                            className={`truncate font-medium transition-colors ${node.type === "group"
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
                                  className={`h-1.5 rounded-full transition-all duration-500 ${completion === 100
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
                            user?.role === "ADMIN" ||
                            user?.role === "HEAD_MANAGER" ||
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
                                {node.type === "workspace" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddGroupForm({
                                        name: "",
                                        siret: "",
                                        ape_code: "",
                                        mainActivity: "",
                                        country: "",
                                        fiscal_year_start: "",
                                        last_closed_fiscal_year: "",
                                        workspaceId: node.id,
                                        logo: undefined as string | undefined,
                                      });
                                      setAddGroupLogoFile(null);
                                      setAddGroupOpen(true);
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                                    un groupe
                                  </DropdownMenuItem>
                                )}
                                {node.type === "group" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFicheGroup(node.id);
                                      }}
                                    >
                                      Fiche groupe
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!node.id) {
                                          console.error('Group node ID is undefined:', node);
                                          return;
                                        }
                                        console.log('Setting addCompanyGroupId to:', node.id);
                                        setAddCompanyGroupId(node.id);
                                        setAddCompanyForm({
                                          name: "",
                                          siret: "",
                                          fiscal_year_start: "",
                                          last_closed_fiscal_year: "",
                                          address: "",
                                          country: "",
                                          ape_code: "",
                                          main_activity: "",
                                          size: "SMALL",
                                          model: "SUBSIDIARY",
                                          groupId: "",
                                          workspaceId: "",
                                          logo: undefined as string | undefined,
                                        });
                                        setAddCompanyOpen(true);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" /> Ajouter
                                      une entreprise
                                    </DropdownMenuItem>
                                  </>
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
                                          country: "",
                                          logo: undefined as string | undefined,
                                        });
                                        setAddBULogoFile(null);
                                        setAddBUOpen(true);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" /> Ajouter
                                      une BU
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {node.type === "bu" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFicheBU(node.id, node.companyId);
                                    }}
                                  >
                                    Fiche BU
                                  </DropdownMenuItem>
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
                                {node.type === "group" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFicheGroup(node.id);
                                    }}
                                  >
                                    Fiche groupe
                                  </DropdownMenuItem>
                                )}
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
                                {node.type === "bu" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFicheBU(node.id, node.companyId);
                                    }}
                                  >
                                    Fiche BU
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
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="flex-row items-center justify-between sticky top-0 bg-white z-10 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedNode?.type === "workspace"
                ? "bg-linear-to-br from-purple-500 to-purple-600"
                : selectedNode?.type === "group"
                  ? "bg-linear-to-br from-blue-500 to-blue-600"
                  : selectedNode?.type === "company"
                    ? "bg-linear-to-br from-slate-600 to-slate-700"
                    : "bg-linear-to-br from-emerald-500 to-emerald-600"
                }`}>
                {selectedNode?.type === "workspace" && <Building2 className="h-5 w-5 text-white" />}
                {selectedNode?.type === "group" && <Layers className="h-5 w-5 text-white" />}
                {selectedNode?.type === "company" && <Building className="h-5 w-5 text-white" />}
                {selectedNode?.type === "bu" && <Briefcase className="h-5 w-5 text-white" />}
              </div>
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

          {selectedNode?.type === "workspace" && (
            <div className="space-y-4 py-2 p-5">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Informations sur l&apos;espace de travail</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                  <Field
                    label="Nom"
                    value={editworkspace.name}
                    editing={editing}
                    onChange={(v) => setEditworkspace((f) => ({ ...f, name: v }))}
                  />
                  <FieldTextarea
                    label="Description"
                    value={editworkspace.description}
                    editing={editing}
                    onChange={(v) => setEditworkspace((f) => ({ ...f, description: v }))}
                  />
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Logo
                    </label>
                    {editing ? (
                      <FileUpload
                        key={editworkspace.logo}
                        value={editworkspace.logo}
                        onChange={(file) => {
                          setEditworkspaceLogoFile(file);
                          if (file) {
                            setEditworkspace((f) => ({ ...f, logo: file.name }));
                          } else {
                            setEditworkspace((f) => ({ ...f, logo: undefined }));
                          }
                        }}
                        placeholder="Uploader une image de logo"
                        accept="image/*"
                      />
                    ) : (
                      <div className="space-y-2">
                        {editworkspace.logo ? (
                          <>
                            {console.log('Logo à afficher:', editworkspace.logo)}
                            {console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL)}
                            {editworkspace.logo.startsWith('http') ? (
                              <Image
                                src={editworkspace.logo}
                                alt="Logo de l'workspace"
                                width={64}
                                height={64}
                                className="object-cover rounded-lg border border-slate-200"
                                onError={(e) => {
                                  console.error('Erreur chargement image URL:', editworkspace.logo);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <>
                                {console.log('URL complète générée:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editworkspace.logo}`)}
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editworkspace.logo}`}
                                  alt="Logo de l'workspace"
                                  width={64}
                                  height={64}
                                  unoptimized={true}
                                  className="object-cover rounded-lg border border-slate-200"
                                  onError={(e) => {
                                    console.error('Erreur chargement image fichier:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editworkspace.logo}`);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </>
                            )}
                            <p className="text-xs text-slate-500">{editworkspace.logo}</p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-primary">—</p>
                        )}
                      </div>
                    )}
                  </div>
                  <FieldTextarea
                    label="Adresse"
                    value={editworkspace.address}
                    editing={editing}
                    onChange={(v) => setEditworkspace((f) => ({ ...f, address: v }))}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email de contact
                    </label>
                    {editing ? (
                      <div>
                        <Input
                          type="email"
                          value={editworkspace.contact_email}
                          onChange={(e) => handleEditEmailChange(e.target.value)}
                          placeholder="email@exemple.com"
                          className={editWorkspaceErrors.contact_email ? "border-red-500" : ""}
                        />
                        {editWorkspaceErrors.contact_email && (
                          <p className="mt-1 text-xs text-red-500">{editWorkspaceErrors.contact_email}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-primary">{editworkspace.contact_email || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Téléphone de contact
                    </label>
                    {editing ? (
                      <div>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="FR"
                          value={editworkspace.contact_phone}
                          onChange={(value) => handleEditPhoneChange(value || "")}
                          className={editWorkspaceErrors.contact_phone ? "border-red-500" : ""}
                          numberInputProps={{
                            className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${editWorkspaceErrors.contact_phone ? "border-red-500" : ""}`
                          }}
                        />
                        {editWorkspaceErrors.contact_phone && (
                          <p className="mt-1 text-xs text-red-500">{editWorkspaceErrors.contact_phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-primary">{editworkspace.contact_phone || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedNode?.type === "group" && (
            <div className="space-y-4 py-2 p-5">
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
                onChange={() => { }} // Non modifiable
              />
              <Field
                label="Code APE"
                value={editGroup.ape_code}
                editing={editing}
                onChange={(v) => setEditGroup((f) => ({ ...f, ape_code: v }))}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Début d&apos;exercice
                </label>
                <Input
                  type="text"
                  value={editGroup.fiscal_year_start}
                  onChange={(e) =>
                    setEditGroup((prev) => ({
                      ...prev,
                      fiscal_year_start: normalizeMonthDayInput(e.target.value),
                    }))
                  }
                  placeholder="DD-MM"
                  maxLength={5}
                  disabled={!editing}
                  className={!editing ? "bg-gray-50 cursor-not-allowed" : ""}
                />
              </div>
              <Field
                label="Dernier exercice clos"
                value={editGroup.last_closed_fiscal_year}
                editing={editing}
                type="number"
                onChange={(v) =>
                  setEditGroup((prev) => ({ ...prev, last_closed_fiscal_year: v }))
                }
              />
              <FieldCountry
                label="Pays"
                value={editGroup.country}
                editing={editing}
                onChange={(v) => setEditGroup((f) => ({ ...f, country: v }))}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Activité principale
                </label>
                <Input
                  value={editGroup.mainActivity}
                  readOnly={true}
                  className="bg-slate-50 cursor-not-allowed"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo
                </label>
                {editing ? (
                  <FileUpload
                    key={editGroup.logo}
                    value={editGroup.logo}
                    onChange={(file) => {
                      setEditGroupLogoFile(file);
                      if (file) {
                        setEditGroup((f) => ({ ...f, logo: file.name }));
                      } else {
                        setEditGroup((f) => ({ ...f, logo: undefined }));
                      }
                    }}
                    placeholder="Uploader une image de logo"
                    accept="image/*"
                  />
                ) : (
                  <div className="space-y-2">
                    {editGroup.logo ? (
                      <>
                        {editGroup.logo.startsWith('http') ? (
                          <Image
                            src={editGroup.logo}
                            alt="Logo du groupe"
                            width={64}
                            height={64}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image URL:', editGroup.logo);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editGroup.logo}`}
                            alt="Logo du groupe"
                            width={64}
                            height={64}
                            unoptimized={true}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image fichier:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editGroup.logo}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <p className="text-xs text-slate-500">{editGroup.logo}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-primary">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedNode?.type === "company" && (
            <div className="space-y-4 py-2 p-5">
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
                onChange={() => { }} // Non modifiable
              />
              <FieldTextarea
                label="Adresse"
                value={editCompany.address}
                editing={editing}
                onChange={(v) => setEditCompany((f) => ({ ...f, address: v }))}
              />
              <FieldCountry
                label="Pays"
                value={editCompany.country}
                editing={editing}
                onChange={(v) => setEditCompany((f) => ({ ...f, country: v }))}
              />
              <div className="space-y-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Code APE
                </label>
                {editing ? (
                  <ApeCodeSelect
                    value={editCompany.ape_code}
                    onChange={(value) => setEditCompany((f) => ({ ...f, ape_code: value }))}
                    onDescriptionChange={(description) => setEditCompany((f) => ({ ...f, main_activity: description }))}
                  />
                ) : (
                  <p className="text-sm font-medium text-primary">{editCompany.ape_code || "—"}</p>
                )}
              </div>
              <Field
                label="Activité principale"
                value={editCompany.main_activity}
                editing={false} // Always read-only like in the original
                onChange={() => { }} // Non-modifiable
              />
              <Field
                label="Début d&apos;exercice"
                value={editCompany.fiscal_year_start}
                editing={editing}
                onChange={(v) =>
                  setEditCompany((prev) => ({
                    ...prev,
                    fiscal_year_start: normalizeMonthDayInput(v),
                  }))
                }
                placeholder="DD-MM"
              />
              <Field
                label="Dernier exercice clos"
                value={editCompany.last_closed_fiscal_year}
                editing={editing}
                type="number"
                onChange={(v) =>
                  setEditCompany((prev) => ({ ...prev, last_closed_fiscal_year: v }))
                }
              />
              <Field
                label="Taille"
                value={editCompany.size}
                editing={editing}
                onChange={(v) =>
                  setEditCompany((f) => ({ ...f, size: v }))
                }
              />
              <Field
                label="Modèle"
                value={editCompany.model}
                editing={editing}
                onChange={(v) =>
                  setEditCompany((f) => ({ ...f, model: v }))
                }
              />
              <Field
                label="Pourcentage de complétion"
                value={editCompany.completionPercentage.toString()}
                editing={false}
                type="number"
                onChange={(v) =>
                  setEditCompany((f) => ({ ...f, completionPercentage: parseFloat(v) || 0 }))
                }
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo
                </label>
                {editing ? (
                  <FileUpload
                    key={editCompany.logo}
                    value={editCompany.logo}
                    onChange={(file) => {
                      setEditCompanyLogoFile(file);
                      if (file) {
                        setEditCompany((f) => ({ ...f, logo: file.name }));
                      } else {
                        setEditCompany((f) => ({ ...f, logo: undefined }));
                      }
                    }}
                    placeholder="Uploader une image de logo"
                    accept="image/*"
                  />
                ) : (
                  <div className="space-y-2">
                    {editCompany.logo ? (
                      <>
                        {editCompany.logo.startsWith('http') ? (
                          <Image
                            src={editCompany.logo}
                            alt="Logo de l'entreprise"
                            width={64}
                            height={64}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image URL:', editCompany.logo);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editCompany.logo}`}
                            alt="Logo de l'entreprise"
                            width={64}
                            height={64}
                            unoptimized={true}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image fichier:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editCompany.logo}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-primary">—</p>
                    )}
                  </div>
                )}
              </div>

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
            <div className="space-y-4 py-2 p-5">
              <Field
                label="Nom"
                value={editBU.name}
                editing={editing}
                onChange={(v) => setEditBU((f) => ({ ...f, name: v }))}
              />
              {editing ? (
                <div className="space-y-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Code APE
                  </label>
                  <ApeCodeSelect
                    value={editBU.code}
                    onChange={(value) => setEditBU((f) => ({ ...f, code: value }))}
                    onDescriptionChange={(description) => setEditBU((f) => ({ ...f, activity: description }))}
                  />
                </div>
              ) : (
                <Field
                  label="Code APE"
                  value={editBU.code}
                  editing={false}
                  onChange={(v) => setEditBU((f) => ({ ...f, code: v }))}
                />
              )}
              {editing ? (
                <div className="space-y-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Activité
                  </label>
                  <Input
                    value={editBU.activity}
                    readOnly
                    className="bg-white border-gray-300"
                    placeholder="Activité principale"
                  />
                </div>
              ) : (
                <Field
                  label="Activité"
                  value={editBU.activity}
                  editing={false} // Always read-only like in company
                  onChange={() => { }} // Non-modifiable
                />
              )}
              <Field
                label="SIRET"
                value={editBU.siret}
                editing={editing}
                validate={validateSiret}
                onChange={(v) => setEditBU((f) => ({ ...f, siret: v }))}
              />
              <FieldCountry
                label="Pays"
                value={editBU.country}
                editing={editing}
                onChange={(v) => setEditBU((f) => ({ ...f, country: v }))}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo
                </label>
                {editing ? (
                  <FileUpload
                    key={editBU.logo}
                    value={editBU.logo}
                    onChange={(file) => {
                      setEditBULogoFile(file);
                      if (file) {
                        setEditBU((f) => ({ ...f, logo: file.name }));
                      } else {
                        setEditBU((f) => ({ ...f, logo: undefined }));
                      }
                    }}
                    placeholder="Uploader une image de logo"
                    accept="image/*"
                  />
                ) : (
                  <div className="space-y-2">
                    {editBU.logo ? (
                      <>
                        {editBU.logo.startsWith('http') ? (
                          <Image
                            src={editBU.logo}
                            alt="Logo de la business unit"
                            width={64}
                            height={64}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image URL:', editBU.logo);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editBU.logo}`}
                            alt="Logo de la business unit"
                            width={64}
                            height={64}
                            unoptimized={true}
                            className="object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              console.error('Erreur chargement image fichier:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${editBU.logo}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-primary">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sticky bottom-0 bg-white border-t border-border pt-4 mt-4">
            {!editing ? (
              <>
                {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "HEAD_MANAGER") && (
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
                {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER" || user?.role === "MANAGER") && (
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
        <DialogContent className="max-h-[70vh] max-w-7xl gap-2!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
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
                  <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
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
                        {formatMonthDayForDisplay(ficheCompany.fiscal_year_start)}
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
                        user?.role === "MANAGER" ||
                        user?.role === "HEAD_MANAGER") && (
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
                              ? ficheShareholderUsers.find((u) => u.id === s.ownerId)?.firstName +
                              " " +
                              ficheShareholderUsers.find((u) => u.id === s.ownerId)?.lastName
                              : s.ownerType === "COMPANY"
                                ? allTreeCompanies.find((c) => c.id === s.ownerId)?.name
                                : s.ownerId || "Inconnu";
                          return (
                            <li
                              key={s.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-primary">
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
                <TabsContent value="donnees-extracomptables" className="">
                  <div className="space-y-6">
                    {ficheCompanyDataLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Section Emprunts */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Emprunts
                          </h3>
                          {ficheCompanyEmprunts.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">
                              Aucun emprunt enregistré pour cette entreprise.
                            </p>
                          ) : (
                            <div className="relative">
                              <div className="mb-4 pb-4 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-primary">Total des emprunts:</span>
                                  <span className="font-bold text-red-600 text-lg">
                                    -{ficheCompanyEmprunts.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fr-FR')} €
                                  </span>
                                </div>
                              </div>
                              <div className={`space-y-3 ${ficheCompanyEmprunts.length > 4 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                                {ficheCompanyEmprunts.map((emprunt) => (
                                  <div
                                    key={emprunt.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleLoanClick(emprunt.id)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-primary">
                                        Emprunt
                                      </div>
                                      {emprunt.description && (
                                        <div className="text-sm text-slate-500 mt-1">
                                          {emprunt.description}
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-400 mt-1">
                                        {new Date(emprunt.date).toLocaleDateString('fr-FR')}
                                        {emprunt.duration_months && (
                                          <span className="ml-2">
                                            â¢ {emprunt.duration_months} mois
                                          </span>
                                        )}
                                        {emprunt.interest_rate && (
                                          <span className="ml-2">
                                            â¢ {emprunt.interest_rate}% d&apos;intérêt
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-red-600">
                                        -{emprunt.amount.toLocaleString('fr-FR')} €
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </>
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

      {/* Fiche Group Modal */}
      <Dialog open={ficheGroupOpen} onOpenChange={setFicheGroupOpen}>
        <DialogContent className="max-w-7xl gap-2!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              {ficheGroup?.name ??
                groupList.find((x) => x.id === ficheGroupId)?.name ??
                "Fiche groupe"}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            if (!ficheGroup) {
              return (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                </div>
              );
            }
            const groupCompanies = allTreeCompanies.filter(c => c.groupId === ficheGroup.id);
            return (
              <Tabs value={ficheGroupTab} onValueChange={setFicheGroupTab}>
                <TabsList className="gap-4">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="entreprises">Entreprises</TabsTrigger>
                  <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
                </TabsList>
                <TabsContent value="informations" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 pt-0">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <dt className="text-slate-500">SIRET</dt>
                      <dd className="font-medium text-primary">
                        {ficheGroup.siret || "—"}
                      </dd>
                      <dt className="text-slate-500">SIREN</dt>
                      <dd className="font-medium text-primary">
                        {ficheGroup.siret
                          ? ficheGroup.siret.substring(0, 9)
                          : "—"}
                      </dd>
                      <dt className="text-slate-500">Début d&apos;exercice</dt>
                      <dd className="font-medium text-primary">
                        {formatMonthDayForDisplay(ficheGroup.fiscal_year_start)}
                      </dd>
                      {ficheGroup.ape_code && (
                        <>
                          <dt className="text-slate-500">Code APE</dt>
                          <dd className="font-medium text-primary">
                            {ficheGroup.ape_code}
                          </dd>
                        </>
                      )}
                      {ficheGroup.mainActivity && (
                        <>
                          <dt className="text-slate-500">
                            Activité principale
                          </dt>
                          <dd className="font-medium text-primary">
                            {ficheGroup.mainActivity}
                          </dd>
                        </>
                      )}
                      {ficheGroup.country && (
                        <>
                          <dt className="text-slate-500">Pays</dt>
                          <dd className="font-medium text-primary">
                            {ficheGroup.country}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </TabsContent>
                <TabsContent value="entreprises" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-1">
                    <ul className="space-y-2">
                      {groupCompanies.map((company) => (
                        <li
                          key={company.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                          onClick={() => {
                            setFicheGroupOpen(false);
                            openFiche(company.id);
                          }}
                        >
                          <span className="font-medium text-primary">
                            {company.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {company.siret}
                            </span>
                            <span className="text-slate-400">›</span>
                          </div>
                        </li>
                      ))}
                      {groupCompanies.length === 0 && (
                        <li className="py-4 text-center text-slate-400">
                          Aucune entreprise dans ce groupe.
                        </li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="donnees-extracomptables" className="">
                  <div className="space-y-6">
                    {ficheGroupDataLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Section Emprunts */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Emprunts
                          </h3>
                          {ficheGroupEmprunts.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">
                              Aucun emprunt enregistré pour ce groupe.
                            </p>
                          ) : (
                            <div className="relative">
                              <div className="mb-4 pb-4 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-primary">Total des emprunts:</span>
                                  <span className="font-bold text-red-600 text-lg">
                                    -{ficheGroupEmprunts.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fr-FR')} €
                                  </span>
                                </div>
                              </div>
                              <div className={`space-y-3 ${ficheGroupEmprunts.length > 4 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                                {ficheGroupEmprunts.map((emprunt) => (
                                  <div
                                    key={emprunt.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleLoanClick(emprunt.id)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-primary">
                                        Emprunt
                                      </div>
                                      {emprunt.description && (
                                        <div className="text-sm text-slate-500 mt-1">
                                          {emprunt.description}
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-400 mt-1">
                                        {new Date(emprunt.date).toLocaleDateString('fr-FR')}
                                        {emprunt.duration_months && (
                                          <span className="ml-2">
                                            â¢ {emprunt.duration_months} mois
                                          </span>
                                        )}
                                        {emprunt.interest_rate && (
                                          <span className="ml-2">
                                            â¢ {emprunt.interest_rate}% d&apos;intérêt
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-red-600">
                                        -{emprunt.amount.toLocaleString('fr-FR')} €
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fiche BU Modal */}
      <Dialog open={ficheBUOpen} onOpenChange={setFicheBUOpen}>
        <DialogContent className="max-w-7xl gap-2!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              {ficheBU?.name || `BU ${ficheBU?.code ?? ""}` || "Fiche BU"}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            if (!ficheBU) {
              return (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                </div>
              );
            }
            return (
              <Tabs value={ficheBUTab} onValueChange={setFicheBUTab}>
                <TabsList className="gap-4">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
                </TabsList>
                <TabsContent value="informations" className="">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 pt-0">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <dt className="text-slate-500">Code</dt>
                      <dd className="font-medium text-primary">
                        {ficheBU.code || "—"}
                      </dd>
                      <dt className="text-slate-500">SIRET</dt>
                      <dd className="font-medium text-primary">
                        {ficheBU.siret || "—"}
                      </dd>
                      <dt className="text-slate-500">Activité</dt>
                      <dd className="font-medium text-primary">
                        {ficheBU.activity || "—"}
                      </dd>
                      <dt className="text-slate-500">Pays</dt>
                      <dd className="font-medium text-primary">
                        {ficheBU.country || "—"}
                      </dd>
                      {ficheBU.company_id && (
                        <>
                          <dt className="text-slate-500">Entreprise</dt>
                          <dd className="font-medium text-primary">
                            {allTreeCompanies.find(c => c.id === ficheBU.company_id)?.name || ficheBU.company_id}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </TabsContent>
                <TabsContent value="donnees-extracomptables" className="">
                  <div className="space-y-6">
                    {ficheBUDataLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Section Emprunts */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Emprunts
                          </h3>
                          {ficheBUEmprunts.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">
                              Aucun emprunt enregistré pour cette business unit.
                            </p>
                          ) : (
                            <div className="relative">
                              <div className="mb-4 pb-4 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-primary">Total des emprunts:</span>
                                  <span className="font-bold text-red-600 text-lg">
                                    -{ficheBUEmprunts.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fr-FR')} €
                                  </span>
                                </div>
                              </div>
                              <div className={`space-y-3 ${ficheBUEmprunts.length > 4 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                                {ficheBUEmprunts.map((emprunt) => (
                                  <div
                                    key={emprunt.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleLoanClick(emprunt.id)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-primary">
                                        Emprunt
                                      </div>
                                      {emprunt.description && (
                                        <div className="text-sm text-slate-500 mt-1">
                                          {emprunt.description}
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-400 mt-1">
                                        {new Date(emprunt.date).toLocaleDateString('fr-FR')}
                                        {emprunt.duration_months && (
                                          <span className="ml-2">
                                            â¢ {emprunt.duration_months} mois
                                          </span>
                                        )}
                                        {emprunt.interest_rate && (
                                          <span className="ml-2">
                                            â¢ {emprunt.interest_rate}% d&apos;intérêt
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-red-600">
                                        -{emprunt.amount.toLocaleString('fr-FR')} €
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheBUOpen(false)}>
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
                Workspace *
              </label>
              <Select
                value={addGroupForm.workspaceId}
                onValueChange={(value) =>
                  setAddGroupForm((f) => ({ ...f, workspaceId: value }))
                }
                className="h-11"
              >
                <option value="">Sélectionner une workspace</option>
                {tree?.workspaces?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </div>
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
                Code APE *
              </label>
              <ApeCodeSelect
                value={addGroupForm.ape_code}
                onChange={(value) =>
                  setAddGroupForm((f) => ({ ...f, ape_code: value }))
                }
                onDescriptionChange={(description) =>
                  setAddGroupForm((f) => ({ ...f, mainActivity: description }))
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
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET *
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
                Logo
              </label>
              <FileUpload
                value={addGroupForm.logo}
                onChange={(file) => {
                  setAddGroupLogoFile(file);
                  if (file) {
                    setAddGroupForm((f) => ({ ...f, logo: file.name }));
                  } else {
                    setAddGroupForm((f) => ({ ...f, logo: undefined }));
                  }
                }}
                placeholder="Uploader une image de logo"
                accept="image/*"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pays *
              </label>
              <CountrySelect
                value={addGroupForm.country}
                onChange={(value) =>
                  setAddGroupForm((f) => ({ ...f, country: value }))
                }
                placeholder="Pays du groupe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Début exercice *
                </label>
                <Input
                  type="text"
                  value={addGroupForm.fiscal_year_start}
                  onChange={(e) =>
                    setAddGroupForm((prev) => ({
                      ...prev,
                      fiscal_year_start: normalizeMonthDayInput(e.target.value),
                    }))
                  }
                  placeholder="DD-MM"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Dernier exercice clos
                </label>
                <Input
                  type="number"
                  min="1900"
                  max="9999"
                  value={addGroupForm.last_closed_fiscal_year}
                  onChange={(e) =>
                    setAddGroupForm((prev) => ({
                      ...prev,
                      last_closed_fiscal_year: e.target.value,
                    }))
                  }
                  placeholder="Ex: 2024"
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
              disabled={
                addGroupLoading ||
                !addGroupForm.name.trim() ||
                !addGroupForm.workspaceId.trim() ||
                !addGroupForm.ape_code.trim() ||
                !addGroupForm.siret.trim() ||
                (addGroupForm.siret && !validateSiret(addGroupForm.siret)) ||
                !addGroupForm.country.trim() ||
                !isValidMonthDay(toMonthDay(addGroupForm.fiscal_year_start))
              }
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
                Code APE *
              </label>
              <ApeCodeSelect
                value={addBUStandaloneForm.code}
                onChange={(value) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    code: value,
                  }))
                }
                onDescriptionChange={(description) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    activity: description,
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité principale
              </label>
              <Input
                placeholder="Activité principale"
                value={addBUStandaloneForm.activity}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({
                    ...f,
                    activity: e.target.value,
                  }))
                }
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET *
              </label>
              <SiretInput
                value={addBUStandaloneForm.siret}
                onChange={(value) =>
                  setAddBUStandaloneForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pays *
              </label>
              <CountrySelect
                value={addBUStandaloneForm.country}
                onChange={(value) =>
                  setAddBUStandaloneForm((f) => ({ ...f, country: value }))
                }
                placeholder="Pays de la Business Unit"
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
                !addBUStandaloneForm.code.trim() ||
                !addBUStandaloneForm.siret.trim() ||
                (addBUStandaloneForm.siret && !validateSiret(addBUStandaloneForm.siret)) ||
                !addBUStandaloneForm.country.trim() ||
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700" />
              Ajouter une entreprise
            </DialogTitle>
          </DialogHeader>
          {addCompanyGroupId ? (
            <p className="text-sm text-slate-500">
              Dans le groupe :{" "}
              <strong>
                {groupList.find((g) => g.id === addCompanyGroupId)?.name || "Groupe inconnu"}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Sélectionnez un groupe pour rattacher cette entreprise
            </p>
          )}
          <div className="space-y-4 py-2">
            {/* Champ de sélection du groupe - seulement en mode standalone */}
            {!addCompanyGroupId && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Groupe *
                </label>
                <Select
                  value={addCompanyForm.groupId || ""}
                  onValueChange={(value) => {
                    const selectedGroup = groupList.find(g => g.id === value);
                    setAddCompanyForm((f) => ({
                      ...f,
                      groupId: value,
                      workspaceId: selectedGroup?.workspaceId || ""
                    }));
                  }}
                  className="h-11"
                  required
                >
                  <option value="">Sélectionner un groupe</option>
                  {groupList.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </div>
            )}
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



            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  SIRET *
                </label>
                <SiretInput
                  value={addCompanyForm.siret}
                  onChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, siret: value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Code APE *
                </label>
                <ApeCodeSelect
                  value={addCompanyForm.ape_code}
                  onChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, ape_code: value }))
                  }
                  onDescriptionChange={(description) =>
                    setAddCompanyForm((f) => ({ ...f, main_activity: description }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité principale
              </label>
              <Input
                placeholder="Activité principale"
                value={addCompanyForm.main_activity}
                onChange={(e) => setAddCompanyForm((f) => ({ ...f, main_activity: e.target.value }))}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adresse
              </label>
              <Textarea
                value={addCompanyForm.address}
                onChange={(e) =>
                  setAddCompanyForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Adresse de l'entreprise"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pays *
              </label>
              <CountrySelect
                placeholder="Pays de l'entreprise"
                value={addCompanyForm.country}
                onChange={(value) =>
                  setAddCompanyForm((f) => ({ ...f, country: value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Taille
                </label>
                <Select
                  value={addCompanyForm.size}
                  onValueChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, size: value }))
                  }
                >
                  <option value="SMALL">TPE</option>
                  <option value="MEDIUM">PME</option>
                  <option value="MEDIUM_ETI">ETI</option>
                  <option value="LARGE">Grand Groupe</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Modèle
                </label>
                <Select
                  value={addCompanyForm.model}
                  onValueChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, model: value }))
                  }
                >
                  <option value="HOLDING">Holding</option>
                  <option value="SUBSIDIARY">Filiale</option>
                  <option value="INDEPENDANT">Indépendant</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Logo
              </label>
              <FileUpload
                value={addCompanyForm.logo}
                onChange={(file) => {
                  setAddCompanyLogoFile(file);
                  if (file) {
                    setAddCompanyForm((f) => ({ ...f, logo: file.name }));
                  } else {
                    setAddCompanyForm((f) => ({ ...f, logo: undefined }));
                  }
                }}
                placeholder="Uploader une image de logo"
                accept="image/*"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Début exercice *
                </label>
                <Input
                  type="text"
                  value={addCompanyForm.fiscal_year_start}
                  onChange={(e) =>
                    setAddCompanyForm((prev) => ({
                      ...prev,
                      fiscal_year_start: normalizeMonthDayInput(e.target.value),
                    }))
                  }
                  placeholder="DD-MM"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Dernier exercice clos
                </label>
                <Input
                  type="number"
                  min="1900"
                  max="9999"
                  value={addCompanyForm.last_closed_fiscal_year}
                  onChange={(e) =>
                    setAddCompanyForm((prev) => ({
                      ...prev,
                      last_closed_fiscal_year: e.target.value,
                    }))
                  }
                  placeholder="Ex: 2024"
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
              disabled={
                addCompanyLoading ||
                !addCompanyForm.name.trim() ||
                !addCompanyForm.siret.trim() ||
                (addCompanyForm.siret && !validateSiret(addCompanyForm.siret)) ||
                !addCompanyForm.ape_code.trim() ||
                !addCompanyForm.country.trim() ||
                !isValidMonthDay(toMonthDay(addCompanyForm.fiscal_year_start)) ||
                (!addCompanyGroupId && !addCompanyForm.groupId.trim())
              }
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
                Code APE *
              </label>
              <ApeCodeSelect
                value={addBUForm.code}
                onChange={(value) => setAddBUForm((f) => ({ ...f, code: value }))}
                onDescriptionChange={(description) => setAddBUForm((f) => ({ ...f, activity: description }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Activité principale
              </label>
              <Input
                placeholder="Activité principale"
                value={addBUForm.activity}
                onChange={(e) => setAddBUForm((f) => ({ ...f, activity: e.target.value }))}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                SIRET *
              </label>
              <SiretInput
                value={addBUForm.siret}
                onChange={(value) =>
                  setAddBUForm((f) => ({ ...f, siret: value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pays *
              </label>
              <CountrySelect
                value={addBUForm.country}
                onChange={(value) =>
                  setAddBUForm((f) => ({ ...f, country: value }))
                }
                placeholder="Pays de la Business Unit"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Logo
              </label>
              <FileUpload
                value={addBUForm.logo}
                onChange={(file) => {
                  setAddBULogoFile(file);
                  if (file) {
                    setAddBUForm((f) => ({ ...f, logo: file.name }));
                  } else {
                    setAddBUForm((f) => ({ ...f, logo: undefined }));
                  }
                }}
                placeholder="Uploader une image de logo"
                accept="image/*"
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
                !addBUForm.code.trim() ||
                !addBUForm.siret.trim() ||
                (addBUForm.siret && !validateSiret(addBUForm.siret)) ||
                !addBUForm.country.trim() ||
                !can("business-units", CRUD_ACTION.CREATE)
              }
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addBULoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Workspace Modal */}
      <Dialog open={addworkspaceOpen} onOpenChange={setAddworkspaceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Créer l&apos;workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nom *
              </label>
              <Input
                value={addworkspaceForm.name}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom de l&apos;workspace"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                value={addworkspaceForm.description}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Description de l&apos;workspace"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Logo
              </label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  placeholder="Choisir une image"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <Image
                      src={logoPreview}
                      alt="Aperçu du logo"
                      width={80}
                      height={80}
                      className="object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Adresse
              </label>
              <Input
                value={addworkspaceForm.address}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Adresse de l&apos;workspace"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email de contact
              </label>
              <Input
                type="email"
                value={addworkspaceForm.contact_email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="email@exemple.com"
                className={workspaceErrors.contact_email ? "border-red-500" : ""}
              />
              {workspaceErrors.contact_email && (
                <p className="text-xs text-red-500">{workspaceErrors.contact_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Téléphone de contact
              </label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="FR"
                value={addworkspaceForm.contact_phone}
                onChange={(value) => handlePhoneChange(value || "")}
                className={workspaceErrors.contact_phone ? "border-red-500" : ""}
                numberInputProps={{
                  className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${workspaceErrors.contact_phone ? "border-red-500" : ""}`
                }}
              />
              {workspaceErrors.contact_phone && (
                <p className="text-xs text-red-500">{workspaceErrors.contact_phone}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddworkspaceOpen(false);
                setLogoFile(null);
                setLogoPreview("");
                setWorkspaceErrors({ contact_email: "", contact_phone: "" });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateworkspace}
              disabled={addworkspaceLoading || !addworkspaceForm.name.trim() || !!workspaceErrors.contact_email || !!workspaceErrors.contact_phone}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {addworkspaceLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (v: string) => void;
  validate?: (v: string) => boolean;
  placeholder?: string;
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
            placeholder={placeholder}
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

function FieldCountry({
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
        <CountrySelect
          value={value}
          onChange={onChange}
          placeholder="Sélectionner un pays"
        />
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
