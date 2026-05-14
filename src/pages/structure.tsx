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
import { apiFetch } from "@/lib/apiClient";
import { COUNTRIES } from '@/lib/countriesData';

// Fonction pour trouver le nom du pays à partir du code
const getCountryName = (code: string) => {
  const country = COUNTRIES.find(c => c.value === code || c.code === code);
  return country ? country.label : code;
};

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
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SiretInput, validateSiret } from "@/components/ui/SiretInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { ApeCodeSelect } from "@/components/structure/ApeCodeSelect";
import { ApeCodeSelectModal } from "@/components/structure/ApeCodeSelectModal";
import { APE_CODES } from "@/lib/nafApeData";
import { CountrySelect } from "@/components/structure/CountrySelect";
import { CountrySelectModal } from "@/components/structure/CountrySelectModal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";
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
  MapPin,
  Mail,
  Phone,
  Calendar,
  Hash,
  Globe,
  FileText,
  Info,
  Image as ImageIcon,
  Users as UsersIcon,
  Pencil,
  Trash2,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import {
  fetchShareholdersByCompany,
  createShareholder,
  type ShareholderDto,
  ownerTypeLabel,
} from "@/lib/shareholdersApi";
import { assetsApi } from "@/lib/assetsApi";
import { globalDotationsApi } from "@/lib/globalDotationsApi";
import { type Asset, type EntityType, type GlobalDotation } from "@/types/asset.types";
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
  description?: string;
  code: string;
  activity: string;
  siret: string;
  country: string;
  logo?: string;
  company_id?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  phone_landline?: string;
  phone_mobile?: string;
  contact_email?: string;
};

type GroupFull = {
  id: string;
  name: string;
  description?: string;

  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;

  country?: string;
  logo?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  phone_landline?: string;
  phone_mobile?: string;
  contact_email?: string;
};

type workspaceFull = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  contact_email?: string;
  phone_landline?: string;
  phone_mobile?: string;
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
  description?: string;
  siret: string;
  fiscal_year_start: string;
  last_closed_fiscal_year?: number | null;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  phone_landline?: string;
  phone_mobile?: string;
  contact_email?: string;
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
  | { type: "workspace"; id: string; name: string; completionPercentage: number }
  | { type: "group"; id: string; name: string; completionPercentage: number }
  | {
    type: "company";
    id: string;
    name: string;
    groupId: string | null;
    workspaceId?: string;
    completionPercentage: number;
  }
  | { type: "bu"; id: string; name: string; companyId: string; code: string; completionPercentage: number }
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

// ---------- Detail modal presentation helpers ----------

type NodeType = "workspace" | "group" | "company" | "bu";

const NODE_TYPE_META: Record<
  NodeType,
  {
    label: string;
    gradient: string;
    soft: string;
    text: string;
    ring: string;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  workspace: {
    label: "Espace de travail",
    gradient: "from-(--nebula-gold-light) to-(--nebula-gold-deep)",
    soft: "bg-(--nebula-gold)/15",
    text: "text-(--nebula-gold-light)",
    ring: "ring-(--nebula-gold-light)/30",
    Icon: Building2,
    description: "Container principal regroupant plusieurs groupes et entreprises.",
  },
  group: {
    label: "Groupe",
    gradient: "from-(--nebula-gold-light) to-(--nebula-gold-deep)",
    soft: "bg-(--nebula-gold)/15",
    text: "text-(--nebula-gold-light)",
    ring: "ring-(--nebula-gold-light)/30",
    Icon: Layers,
    description: "Entité juridique mère regroupant plusieurs entreprises.",
  },
  company: {
    label: "Entreprise",
    gradient: "from-(--nebula-gold-light) to-(--nebula-gold-deep)",
    soft: "bg-white/10",
    text: "text-(--nebula-gold-light)",
    ring: "ring-(--nebula-gold-light)/25",
    Icon: Building,
    description: "Société opérationnelle rattachée à un groupe.",
  },
  bu: {
    label: "Business Unit",
    gradient: "from-(--nebula-gold-light) to-(--nebula-gold-deep)",
    soft: "bg-(--nebula-gold)/15",
    text: "text-(--nebula-gold-light)",
    ring: "ring-(--nebula-gold-light)/30",
    Icon: Briefcase,
    description: "Unité d'activité spécialisée au sein d'une entreprise.",
  },
};

function DetailLogoPreview({
  logo,
  alt,
  size = 56,
}: {
  logo?: string | null;
  alt: string;
  size?: number;
}) {
  if (!logo) return null;
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const normalized = logo.replace(/\\/g, "/").trim();
  const isDirectSrc = /^(https?:\/\/|blob:|data:)/i.test(normalized);
  const src = isDirectSrc
    ? normalized
    : normalized.startsWith("/uploads/")
      ? `${baseUrl}${normalized}`
      : normalized.startsWith("uploads/")
        ? `${baseUrl}/${normalized}`
        : normalized.includes("/uploads/")
          ? `${baseUrl}${normalized.slice(normalized.indexOf("/uploads/"))}`
          : `${baseUrl}/uploads/${normalized}`;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-sm"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized={!/^https?:\/\//i.test(src)}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function DetailHero({
  type,
  name,
  logo,
  pills,
}: {
  type: NodeType;
  name?: string;
  logo?: string | null;
  pills?: React.ReactNode;
}) {
  const meta = NODE_TYPE_META[type];
  const Icon = meta.Icon;
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className={`h-1.5 w-full bg-linear-to-r ${meta.gradient}`} />
      <div className="flex items-start gap-4 p-4 sm:p-5">
        {logo ? (
          <DetailLogoPreview logo={logo} alt={name ?? meta.label} size={64} />
        ) : (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${meta.gradient} shadow-sm`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full ${meta.soft} ${meta.text} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ${meta.ring}`}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </div>
          <h2 className="mt-1.5 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-[22px]">
            {name && name.trim().length > 0 ? name : "Sans nom"}
          </h2>
          <p className="mt-1 text-xs text-(--nebula-muted) sm:text-sm">{meta.description}</p>
          {pills && (
            <div className="mt-3 flex flex-wrap gap-1.5">{pills}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailPill({
  icon: Icon,
  children,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90 ${mono ? "font-mono tracking-tight" : ""}`}
    >
      {Icon && <Icon className="h-3 w-3 text-(--nebula-muted)" />}
      {children}
    </span>
  );
}

function DetailSection({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10">
            <Icon className="h-3.5 w-3.5 text-(--nebula-muted)" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-[11px] leading-snug text-(--nebula-muted)">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}) {
  const col =
    cols === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : cols === 2
        ? "sm:grid-cols-2"
        : "";
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${col}`}>{children}</dl>
  );
}

function ReadField({
  label,
  value,
  icon: Icon,
  mono,
  hint,
  full,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  hint?: string;
  full?: boolean;
}) {
  const display =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "");
  return (
    <div className={`min-w-0 ${full ? "sm:col-span-2" : ""}`}>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--nebula-muted)">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd
        className={`mt-1 wrap-break-word text-sm ${display ? "italic text-(--nebula-muted)" : "font-medium text-(--nebula-ink)"} ${mono && !display ? "font-mono tracking-tight" : ""}`}
      >
        {display ? "Non renseigné" : value}
      </dd>
      {hint && !display && (
        <p className="mt-0.5 text-[11px] leading-snug text-(--nebula-muted)">{hint}</p>
      )}
    </div>
  );
}

function formatSiret(siret?: string): string {
  if (!siret) return "";
  const digits = siret.replace(/\s/g, "");
  if (digits.length !== 14) return siret;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

function formatSiren(siret?: string): string {
  if (!siret) return "";
  const digits = siret.replace(/\s/g, "");
  if (digits.length < 9) return siret.slice(0, 9);
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

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

  // Move ALL hooks here before any conditional returns
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
  const [ficheCompanyActifs, setFicheCompanyActifs] = useState<Asset[]>([]);
  const [ficheCompanyDotations, setFicheCompanyDotations] = useState<GlobalDotation[]>([]);
  const [ficheCompanyDataLoading, setFicheCompanyDataLoading] = useState(false);

  // Fiche Group states
  const [ficheGroupOpen, setFicheGroupOpen] = useState(false);
  const [ficheGroupId, setFicheGroupId] = useState<string | null>(null);
  const [ficheGroup, setFicheGroup] = useState<GroupFull | null>(null);
  const [ficheGroupTab, setFicheGroupTab] = useState("informations");
  const [ficheGroupEmprunts, setFicheGroupEmprunts] = useState<Emprunt[]>([]);
  const [ficheGroupActifs, setFicheGroupActifs] = useState<Asset[]>([]);
  const [ficheGroupDotations, setFicheGroupDotations] = useState<GlobalDotation[]>([]);
  const [ficheGroupDataLoading, setFicheGroupDataLoading] = useState(false);

  // Fiche BU states
  const [ficheBUOpen, setFicheBUOpen] = useState(false);
  const [ficheBUId, setFicheBUId] = useState<string | null>(null);
  const [ficheBU, setFicheBU] = useState<BusinessUnit | null>(null);
  const [ficheBUTab, setFicheBUTab] = useState("informations");
  const [ficheBUEmprunts, setFicheBUEmprunts] = useState<Emprunt[]>([]);
  const [ficheBUActifs, setFicheBUActifs] = useState<Asset[]>([]);
  const [ficheBUDotations, setFicheBUDotations] = useState<GlobalDotation[]>([]);
  const [ficheBUDataLoading, setFicheBUDataLoading] = useState(false);

  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(
    new Set(),
  );

  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState("");

  // État pour créer une workspace
  const [addworkspaceOpen, setAddworkspaceOpen] = useState(false);
  const [addworkspaceForm, setAddworkspaceForm] = useState({
    name: "",
    description: "",
    logo: undefined as string | undefined,
    street: "",
    postal_code: "",
    city: "",
    country: "",
    contact_email: "",
    phone_mobile: "",
    phone_landline: "",
    manager_id: "",
  });
  const [addworkspaceLoading, setAddworkspaceLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [workspaceErrors, setWorkspaceErrors] = useState({
    contact_email: "",
    phone_mobile: "",
    phone_landline: "",
  });
  const [editWorkspaceErrors, setEditWorkspaceErrors] = useState({
    contact_email: "",
    phone_mobile: "",
    phone_landline: "",
  });
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [createCountryModalOpen, setCreateCountryModalOpen] = useState(false);
  const [groupCountryModalOpen, setGroupCountryModalOpen] = useState(false);
  const [companyApeModalOpen, setCompanyApeModalOpen] = useState(false);
  const [editBUApeModalOpen, setEditBUApeModalOpen] = useState(false);
  const [editBUCountryModalOpen, setEditBUCountryModalOpen] = useState(false);
  const [addBUCountryModalOpen, setAddBUCountryModalOpen] = useState(false);
  const [addBUStandaloneCountryModalOpen, setAddBUStandaloneCountryModalOpen] = useState(false);
  const [addBUStandaloneApeModalOpen, setAddBUStandaloneApeModalOpen] = useState(false);
  const [addCompanyApeModalOpen, setAddCompanyApeModalOpen] = useState(false);
  const [addBUApeModalOpen, setAddBUApeModalOpen] = useState(false);
  const [addCompanyCountryModalOpen, setAddCompanyCountryModalOpen] = useState(false);

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

  const handlePhoneChange = (
    value: string,
    formType: 'addworkspace' | 'editworkspace' | 'editGroup' | 'addGroup' | 'editCompany' | 'addCompany' | 'editBU' | 'addBU' | 'addBUStandalone',
    field?: 'phone_mobile' | 'phone_landline' | 'contact_phone'
  ) => {
    // Validation du téléphone
    const isValid = validatePhone(value);
    const errorMessage = isValid ? "" : "Veuillez entrer un numéro de téléphone valide";

    // Mise à jour du formulaire et des erreurs selon le type
    switch (formType) {
      case 'addworkspace':
        if (field) {
          setAddworkspaceForm((f) => ({ ...f, [field]: value }));
          setWorkspaceErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'editworkspace':
        if (field) {
          setEditworkspace((f) => ({ ...f, [field]: value }));
          setEditWorkspaceErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'editGroup':
        if (field) {
          setEditGroup((f) => ({ ...f, [field]: value }));
          setGroupErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'addGroup':
        if (field) {
          setAddGroupForm((f) => ({ ...f, [field]: value }));
          setAddGroupErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'editCompany':
        if (field) {
          setEditCompany((f) => ({ ...f, [field]: value }));
          setCompanyErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'addCompany':
        if (field) {
          setAddCompanyForm((f) => ({ ...f, [field]: value }));
          setCompanyErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'editBU':
        if (field) {
          setEditBU((f) => ({ ...f, [field]: value }));
          setBuErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'addBU':
        if (field) {
          setAddBUForm((f) => ({ ...f, [field]: value }));
          setAddBUErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;

      case 'addBUStandalone':
        if (field) {
          setAddBUStandaloneForm((f) => ({ ...f, [field]: value }));
          setAddBUStandaloneErrors((prev) => ({ ...prev, [field]: errorMessage }));
        }
        break;
    }
  };

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addCompanyGroupId, setAddCompanyGroupId] = useState<string | null>(
    null,
  );
  const [addCompanyForm, setAddCompanyForm] = useState({
    name: "",
    description: "",
    siret: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",

    street: "",
    postal_code: "",
    city: "",
    country: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
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
    description: "",
    code: "",
    activity: "",
    siret: "",
    country: "",
    street: "",
    postal_code: "",
    city: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
    logo: undefined as string | undefined,
  });
  const [addBULoading, setAddBULoading] = useState(false);
  const [addBULogoFile, setAddBULogoFile] = useState<File | null>(null);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupForm, setAddGroupForm] = useState({
    name: "",
    description: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",

    country: "",
    street: "",
    postal_code: "",
    city: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
    workspaceId: "",
    logo: undefined as string | undefined,
  });
  const [addGroupErrors, setAddGroupErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [addGroupCountryModalOpen, setAddGroupCountryModalOpen] = useState(false);
  const [addGroupLoading, setAddGroupLoading] = useState(false);

  const [addBUStandaloneOpen, setAddBUStandaloneOpen] = useState(false);
  const [addBUStandaloneForm, setAddBUStandaloneForm] = useState({
    name: "",
    description: "",

    code: "",
    activity: "",
    siret: "",
    country: "",
    street: "",
    postal_code: "",
    city: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
    companyId: "",
  });
  const [addBUStandaloneLoading, setAddBUStandaloneLoading] = useState(false);

  const [editworkspace, setEditworkspace] = useState({
    name: "",
    description: "",
    logo: undefined as string | undefined,
    street: "",
    postal_code: "",
    city: "",
    country: "",
    contact_email: "",
    phone_landline: "",
    phone_mobile: "",
    manager_id: "",
    completionPercentage: 0,
  });
  const [editworkspaceLogoFile, setEditworkspaceLogoFile] = useState<File | null>(null);
  const [editGroupLogoFile, setEditGroupLogoFile] = useState<File | null>(null);
  const [addGroupLogoFile, setAddGroupLogoFile] = useState<File | null>(null);
  const [editCompanyLogoFile, setEditCompanyLogoFile] = useState<File | null>(null);
  const [editBULogoFile, setEditBULogoFile] = useState<File | null>(null);
  const [editGroup, setEditGroup] = useState({
    name: "",
    description: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",

    country: "",
    street: "",
    postal_code: "",
    city: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
    logo: undefined as string | undefined,
    completionPercentage: 0,

  });
  const [groupErrors, setGroupErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [editCompany, setEditCompany] = useState({
    name: "",
    description: "",
    siret: "",

    street: "",
    postal_code: "",
    city: "",
    country: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
    ape_code: "",
    main_activity: "",
    fiscal_year_start: "",
    last_closed_fiscal_year: "",
    size: "",
    model: "",
    logo: undefined as string | undefined,
    completionPercentage: 0,
  });
  const [companyErrors, setCompanyErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [buErrors, setBuErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [addBUErrors, setAddBUErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [addBUStandaloneErrors, setAddBUStandaloneErrors] = useState({ contact_email: "", phone_landline: "", phone_mobile: "" });
  const [companyCountryModalOpen, setCompanyCountryModalOpen] = useState(false);
  const [editBU, setEditBU] = useState({
    name: "",
    description: "",
    code: "",
    activity: "",
    siret: "",
    country: "",
    street: "",
    postal_code: "",
    city: "",
    phone_landline: "",
    phone_mobile: "",
    contact_email: "",
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
        rows.push({
          type: "workspace",
          id: org.id,
          name: org.name,
          completionPercentage: org.completionPercentage || 0
        });
        console.log(`Added workspace: ${org.name}`);
      }

      // Ajouter les groupes de l'workspace immédiatement après le workspace
      org.groups.forEach((g) => {
        rows.push({
          type: "group",
          id: g.id,
          name: g.name,
          completionPercentage: g.completionPercentage || 0
        });
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
                completionPercentage: bu.completionPercentage || 0,
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
                completionPercentage: bu.completionPercentage || 0,
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
                completionPercentage: bu.completionPercentage || 0,
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
              completionPercentage: bu.completionPercentage || 0,
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
        description: "",
        code: "",
        activity: "",
        siret: "",
        country: "",
        logo: undefined as string | undefined,
        street: "",
        postal_code: "",
        city: "",
        phone_landline: "",
        phone_mobile: "",
        contact_email: "",
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
            street: org.street ?? "",
            postal_code: org.postal_code ?? "",
            city: org.city ?? "",
            country: org.country ?? "",
            contact_email: org.contact_email ?? "",
            phone_landline: org.phone_landline ?? "",
            phone_mobile: org.phone_mobile ?? "",
            manager_id: org.manager_id ?? "",
            completionPercentage: org.completionPercentage || 0,
          });
          setEditworkspaceLogoFile(null);
          setEditWorkspaceErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
        } catch {
          setEditworkspace({
            name: node.name,
            description: "",
            logo: undefined as string | undefined,
            street: "",
            postal_code: "",
            city: "",
            country: "",
            contact_email: "",
            phone_landline: "",
            phone_mobile: "",
            manager_id: "",
            completionPercentage: 0,
          });
          setEditworkspaceLogoFile(null);
          setEditWorkspaceErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
        }
      } else if (node.type === "group") {
        try {
          const g = await apiFetch<GroupFull>(`/groups/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditGroup({
            name: g.name,
            description: g.description ?? "",
            fiscal_year_start: toMonthDay(g.fiscal_year_start),
            last_closed_fiscal_year:
              g.last_closed_fiscal_year !== null &&
                g.last_closed_fiscal_year !== undefined
                ? String(g.last_closed_fiscal_year)
                : "",
            country: g.country ?? "",
            street: g.street ?? "",
            postal_code: g.postal_code ?? "",
            city: g.city ?? "",
            phone_landline: g.phone_landline ?? "",
            phone_mobile: g.phone_mobile ?? "",
            contact_email: g.contact_email ?? "",
            logo: g.logo ?? "",
            completionPercentage: g.completionPercentage || 0,
          });
          setEditGroupLogoFile(null);
          setGroupErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
        } catch {
          setEditGroup({
            name: node.name,
            description: "",
            fiscal_year_start: "",
            last_closed_fiscal_year: "",
            country: "",
            street: "",
            postal_code: "",
            city: "",
            phone_landline: "",
            phone_mobile: "",
            contact_email: "",
            logo: undefined as string | undefined,
            completionPercentage: 0,
          });
          setEditGroupLogoFile(null);
          setGroupErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
        }
      } else if (node.type === "company") {
        try {
          const c = await apiFetch<CompanyFull>(`/companies/${node.id}`, {
            snackbar: { showSuccess: false, showError: true },
          });
          setEditCompany({
            name: c.name,
            description: c.description ?? "",
            siret: c.siret ?? "",
            street: c.street ?? "",
            postal_code: c.postal_code ?? "",
            city: c.city ?? "",
            country: c.country ?? "",
            phone_landline: c.phone_landline ?? "",
            phone_mobile: c.phone_mobile ?? "",
            contact_email: c.contact_email ?? "",
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
            description: "",
            siret: "",
            street: "",
            postal_code: "",
            city: "",
            country: "",
            phone_landline: "",
            phone_mobile: "",
            contact_email: "",
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
            description: bu.description || "",
            code: bu.code,
            activity: bu.activity || "",
            siret: bu.siret || "",
            country: bu.country || "",
            street: bu.street || "",
            postal_code: bu.postal_code || "",
            city: bu.city || "",
            phone_landline: bu.phone_landline || "",
            phone_mobile: bu.phone_mobile || "",
            contact_email: bu.contact_email || "",
            logo: bu.logo || "",
          };
          console.log('Setting editBU to:', updatedEditBU); // Debug log
          setEditBU(updatedEditBU);
        } else {
          // Valeurs par défaut seulement si la BU n'est pas trouvée
          setEditBU({
            name: node.name,
            description: "",
            code: node.code,
            activity: "",
            siret: "",
            country: "",
            street: "",
            postal_code: "",
            city: "",
            phone_landline: "",
            phone_mobile: "",
            contact_email: "",
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
      const phoneValid = validatePhone(editworkspace?.phone_mobile || "");

      if (!emailValid || !phoneValid) {
        // Mettre à jour les erreurs
        setEditWorkspaceErrors({
          contact_email: emailValid ? "" : "Veuillez entrer un email valide",
          phone_mobile: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
          phone_landline: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', editworkspace.name);
      if (editworkspace.description) {
        formData.append('description', editworkspace.description);
      }
      if (editworkspace.street) {
        formData.append('street', editworkspace.street);
      }
      if (editworkspace.postal_code) {
        formData.append('postal_code', editworkspace.postal_code);
      }
      if (editworkspace.city) {
        formData.append('city', editworkspace.city);
      }
      if (editworkspace.country) {
        formData.append('country', editworkspace.country);
      }
      if (editworkspace.phone_landline) {
        formData.append('phone_landline', editworkspace.phone_landline);
      }
      if (editworkspace.phone_mobile) {
        formData.append('phone_mobile', editworkspace.phone_mobile);
      }
      if (editworkspace.contact_email) {
        formData.append('contact_email', editworkspace.contact_email);
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
      setEditWorkspaceErrors({ contact_email: "", phone_mobile: "", phone_landline: "" });
      // Mettre à jour l'état local avec le logo retourné par le serveur
      if (updatedOrg) {
        setEditworkspace(prev => ({
          ...prev,
          logo: updatedOrg.logo || ""
        }));
      }
    } else if (selectedNode.type === "group") {
      // Valider l'email et les téléphones
      const emailValid = validateEmail(editGroup.contact_email);
      const phone_mobileValid = validatePhone(editGroup.phone_mobile || "");
      const phone_landlineValid = validatePhone(editGroup.phone_landline || "");

      if (!emailValid || !phone_mobileValid || !phone_landlineValid) {
        // Mettre à jour les erreurs
        setGroupErrors({
          contact_email: emailValid ? "" : "Veuillez entrer un email valide",
          phone_mobile: phone_mobileValid ? "" : "Veuillez entrer un numéro de téléphone valide",
          phone_landline: phone_landlineValid ? "" : "Veuillez entrer un numéro de téléphone valide",
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', editGroup.name);
      if (editGroup.description) {
        formData.append('description', editGroup.description);
      }

      const normalizedGroupFiscalYearStart = toMonthDay(editGroup.fiscal_year_start);
      if (normalizedGroupFiscalYearStart) {
        formData.append('fiscal_year_start', normalizedGroupFiscalYearStart);
      }
      if (editGroup.last_closed_fiscal_year.trim()) {
        formData.append('last_closed_fiscal_year', editGroup.last_closed_fiscal_year.trim());
      }
      if (editGroup.country) {
        formData.append('country', editGroup.country);
      }
      if (editGroup.street) {
        formData.append('street', editGroup.street);
      }
      if (editGroup.postal_code) {
        formData.append('postal_code', editGroup.postal_code);
      }
      if (editGroup.city) {
        formData.append('city', editGroup.city);
      }
      if (editGroup.contact_email) {
        formData.append('contact_email', editGroup.contact_email);
      }
      if (editGroup.phone_mobile) {
        formData.append('phone_mobile', editGroup.phone_mobile);
      }
      if (editGroup.phone_landline) {
        formData.append('phone_landline', editGroup.phone_landline);
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
      setGroupErrors({ contact_email: "", phone_mobile: "", phone_landline: "" });
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
      if (editCompany.description) {
        formData.append('description', editCompany.description);
      }
      if (editCompany.siret) {
        formData.append('siret', editCompany.siret);
      }
      if (editCompany.street) {
        formData.append('street', editCompany.street);
      }
      if (editCompany.postal_code) {
        formData.append('postal_code', editCompany.postal_code);
      }
      if (editCompany.city) {
        formData.append('city', editCompany.city);
      }
      if (editCompany.country) {
        formData.append('country', editCompany.country);
      }
      if (editCompany.phone_landline) {
        formData.append('phone_landline', editCompany.phone_landline);
      }
      if (editCompany.phone_mobile) {
        formData.append('phone_mobile', editCompany.phone_mobile);
      }
      if (editCompany.contact_email) {
        formData.append('contact_email', editCompany.contact_email);
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
      if (editBU.description) {
        formData.append('description', editBU.description);
      }
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
      if (editBU.street) {
        formData.append('street', editBU.street);
      }
      if (editBU.postal_code) {
        formData.append('postal_code', editBU.postal_code);
      }
      if (editBU.city) {
        formData.append('city', editBU.city);
      }
      if (editBU.phone_landline) {
        formData.append('phone_landline', editBU.phone_landline);
      }
      if (editBU.phone_mobile) {
        formData.append('phone_mobile', editBU.phone_mobile);
      }
      if (editBU.contact_email) {
        formData.append('contact_email', editBU.contact_email);
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
          logo: updatedBU.logo || "",
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
    const phoneValid = validatePhone(addworkspaceForm.phone_mobile) && validatePhone(addworkspaceForm.phone_landline);

    if (!emailValid || !phoneValid) {
      // Mettre à jour les erreurs
      setWorkspaceErrors({
        contact_email: emailValid ? "" : "Veuillez entrer un email valide",
        phone_landline: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
        phone_mobile: phoneValid ? "" : "Veuillez entrer un numéro de téléphone valide",
      });
      return;
    }

    setAddworkspaceLoading(true);
    try {
      // Créer FormData pour l'upload du fichier
      const formData = new FormData();
      formData.append('name', addworkspaceForm.name.trim());
      formData.append('description', addworkspaceForm.description.trim() || '');
      formData.append('street', addworkspaceForm.street.trim() || '');
      formData.append('postal_code', addworkspaceForm.postal_code.trim() || '');
      formData.append('city', addworkspaceForm.city.trim() || '');
      formData.append('country', addworkspaceForm.country.trim() || '');
      formData.append('contact_email', addworkspaceForm.contact_email.trim() || '');
      formData.append('phone_mobile', addworkspaceForm.phone_mobile.trim() || '');
      formData.append('phone_landline', addworkspaceForm.phone_landline.trim() || '');

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
        street: "",
        postal_code: "",
        city: "",
        country: "",
        contact_email: "",
        phone_mobile: "",
        phone_landline: "",
        manager_id: "",
      });
      setLogoFile(null);
      setLogoPreview("");
      setWorkspaceErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
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

    // En mode standalone, le groupe est optionnel
    // La création est possible sans groupe

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
      if (addCompanyForm.description) {
        formData.append('description', addCompanyForm.description);
      }
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
      if (addCompanyForm.country) {
        formData.append('country', addCompanyForm.country);
      }
      if (addCompanyForm.street) {
        formData.append('street', addCompanyForm.street);
      }
      if (addCompanyForm.postal_code) {
        formData.append('postal_code', addCompanyForm.postal_code);
      }
      if (addCompanyForm.city) {
        formData.append('city', addCompanyForm.city);
      }
      if (addCompanyForm.phone_landline) {
        formData.append('phone_landline', addCompanyForm.phone_landline);
      }
      if (addCompanyForm.phone_mobile) {
        formData.append('phone_mobile', addCompanyForm.phone_mobile);
      }
      if (addCompanyForm.contact_email) {
        formData.append('contact_email', addCompanyForm.contact_email);
      }
      if (addCompanyForm.ape_code) {
        formData.append('ape_code', addCompanyForm.ape_code);
      }
      if (addCompanyForm.main_activity) {
        formData.append('main_activity', addCompanyForm.main_activity);
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
        description: "",
        siret: "",
        fiscal_year_start: "",
        last_closed_fiscal_year: "",

        street: "",
        postal_code: "",
        city: "",
        country: "",
        phone_landline: "",
        phone_mobile: "",
        contact_email: "",
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
      if (addBUForm.street) {
        formData.append('street', addBUForm.street);
      }
      if (addBUForm.postal_code) {
        formData.append('postal_code', addBUForm.postal_code);
      }
      if (addBUForm.city) {
        formData.append('city', addBUForm.city);
      }
      if (addBUForm.phone_landline) {
        formData.append('phone_landline', addBUForm.phone_landline);
      }
      if (addBUForm.phone_mobile) {
        formData.append('phone_mobile', addBUForm.phone_mobile);
      }
      if (addBUForm.contact_email) {
        formData.append('contact_email', addBUForm.contact_email);
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
      setAddBUForm({ name: "", description: "", code: "", activity: "", siret: "", country: "", street: "", postal_code: "", city: "", phone_landline: "", phone_mobile: "", contact_email: "", logo: undefined });
      setAddBUErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
      setAddBULogoFile(null);
    } catch {
      /* snackbar handles */
    } finally {
      setAddBULoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!addGroupForm.name.trim()) return;

    // Valider l'email et les téléphones
    const emailValid = validateEmail(addGroupForm.contact_email);
    const phone_mobileValid = validatePhone(addGroupForm.phone_mobile || "");
    const phone_landlineValid = validatePhone(addGroupForm.phone_landline || "");

    if (!emailValid || !phone_mobileValid || !phone_landlineValid) {
      // Mettre à jour les erreurs
      setAddGroupErrors({
        contact_email: emailValid ? "" : "Veuillez entrer un email valide",
        phone_mobile: phone_mobileValid ? "" : "Veuillez entrer un numéro de téléphone valide",
        phone_landline: phone_landlineValid ? "" : "Veuillez entrer un numéro de téléphone valide",
      });
      return;
    }

    const normalizedGroupFiscalYearStart = toMonthDay(addGroupForm.fiscal_year_start);
    if (!isValidMonthDay(normalizedGroupFiscalYearStart)) {
      console.error("La date de début d'exercice est invalide (DD-MM)");
      return;
    }



    setAddGroupLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', addGroupForm.name);
      if (addGroupForm.description) {
        formData.append('description', addGroupForm.description);
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

      if (addGroupForm.country) {
        formData.append('country', addGroupForm.country);
      }
      if (addGroupForm.street) {
        formData.append('street', addGroupForm.street);
      }
      if (addGroupForm.postal_code) {
        formData.append('postal_code', addGroupForm.postal_code);
      }
      if (addGroupForm.city) {
        formData.append('city', addGroupForm.city);
      }
      if (addGroupForm.phone_landline) {
        formData.append('phone_landline', addGroupForm.phone_landline);
      }
      if (addGroupForm.phone_mobile) {
        formData.append('phone_mobile', addGroupForm.phone_mobile);
      }
      if (addGroupForm.contact_email) {
        formData.append('contact_email', addGroupForm.contact_email);
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
        description: "",

        fiscal_year_start: "",
        last_closed_fiscal_year: "",

        country: "",
        street: "",
        postal_code: "",
        city: "",
        phone_landline: "",
        phone_mobile: "",
        contact_email: "",
        workspaceId: "",
        logo: undefined as string | undefined,
      });
      setAddGroupLogoFile(null);
      setAddGroupErrors({ contact_email: "", phone_landline: "", phone_mobile: "" });
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
            description: addBUStandaloneForm.description,
            code: addBUStandaloneForm.code,
            activity: addBUStandaloneForm.activity,
            siret: addBUStandaloneForm.siret,
            country: addBUStandaloneForm.country,
            street: addBUStandaloneForm.street,
            postal_code: addBUStandaloneForm.postal_code,
            city: addBUStandaloneForm.city,
            phone_landline: addBUStandaloneForm.phone_landline,
            phone_mobile: addBUStandaloneForm.phone_mobile,
            contact_email: addBUStandaloneForm.contact_email,
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
        description: "",
        code: "",
        activity: "",
        siret: "",
        country: "",
        street: "",
        postal_code: "",
        city: "",
        phone_landline: "",
        phone_mobile: "",
        contact_email: "",
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

  // Fonction pour gérer le clic sur un actif
  const handleAssetClick = (assetId: string) => {
    router.push(`/dotations/assets/view/${assetId}`);
  };

  // Fonction pour gérer le clic sur une dotation
  const handleDotationClick = (dotationId: string) => {
    router.push({
      pathname: '/dotations/global',
      query: {
        view: 'details',
        dotationId: dotationId
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

      // Charger les actifs du groupe
      const actifs = await assetsApi.getAssetsByEntity('group' as EntityType, groupId);
      setFicheGroupActifs(actifs);

      // Charger les dotations globales du groupe
      console.log(`Loading dotations for group: ${groupId}`);
      const allDotations = await globalDotationsApi.getAllGlobalDotations('group' as EntityType, groupId);
      console.log(`Received ${allDotations.length} total dotations:`, allDotations);

      // Filtrer pour n'afficher que les dotations de cette entité spécifique
      const filteredDotations = allDotations.filter(d => d.entityId === groupId);
      console.log(`Filtered to ${filteredDotations.length} dotations for group ${groupId}:`, filteredDotations);
      setFicheGroupDotations(filteredDotations);
    } catch {
      setFicheGroupEmprunts([]);
      setFicheGroupActifs([]);
      setFicheGroupDotations([]);
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

      // Charger les actifs de la BU
      const actifs = await assetsApi.getAssetsByEntity('business unit' as EntityType, buId);
      setFicheBUActifs(actifs);

      // Charger les dotations globales de la BU
      console.log(`Loading dotations for BU: ${buId}`);
      const allDotations = await globalDotationsApi.getAllGlobalDotations('business unit' as EntityType, buId);
      console.log(`Received ${allDotations.length} total dotations:`, allDotations);

      // Filtrer pour n'afficher que les dotations de cette entité spécifique
      const filteredDotations = allDotations.filter(d => d.entityId === buId);
      console.log(`Filtered to ${filteredDotations.length} dotations for BU ${buId}:`, filteredDotations);
      setFicheBUDotations(filteredDotations);
    } catch {
      setFicheBUEmprunts([]);
      setFicheBUActifs([]);
      setFicheBUDotations([]);
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

      // Charger les actifs de l'entreprise
      const actifs = await assetsApi.getAssetsByEntity('company' as EntityType, companyId);
      setFicheCompanyActifs(actifs);

      // Charger les dotations globales de l'entreprise
      console.log(`Loading dotations for company: ${companyId}`);
      const allDotations = await globalDotationsApi.getAllGlobalDotations('company' as EntityType, companyId);
      console.log(`Received ${allDotations.length} total dotations:`, allDotations);

      // Filtrer pour n'afficher que les dotations de cette entité spécifique
      const filteredDotations = allDotations.filter(d => d.entityId === companyId);
      console.log(`Filtered to ${filteredDotations.length} dotations for company ${companyId}:`, filteredDotations);
      setFicheCompanyDotations(filteredDotations);
    } catch {
      setFicheCompanyEmprunts([]);
      setFicheCompanyActifs([]);
      setFicheCompanyDotations([]);
    } finally {
      setFicheCompanyDataLoading(false);
    }
  };

  // Redirect to login if not authenticated
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
        <title>Structure du workspace</title>
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
              <p className="text-sm text-(--nebula-muted)">Gérez la structure hiérarchique de votre workspace et pilotez l&apos;ensemble de vos entités.</p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-1 items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="h-9 w-full rounded-lg border-white/10 pl-9 text-sm sm:w-[260px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-wrap justify-end gap-3">
            {canImportStructure && (
              <Button
                onClick={() => router.push("/structure/import/upload")}
                variant="outline"
                className="h-10 gap-2"
              >
                <Upload className="size-4 text-primary" />
                Importer
              </Button>
            )}
            {(user?.role === "SUPER_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "HEAD_MANAGER" ||
              user?.role === "MANAGER") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary text-white! hover:bg-primary/90">
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                      <DropdownMenuItem
                        onClick={() => setAddworkspaceOpen(true)}
                        className="gap-2"
                      >
                        <Layers className="h-4 w-4 text-(--nebula-gold-light)" />
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
                            <Building2 className="h-4 w-4 text-(--nebula-gold-light)" />
                            Groupe
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setAddCompanyGroupId(null);
                              setAddCompanyForm({
                                name: "",
                                description: "",
                                siret: "",
                                fiscal_year_start: "",
                                last_closed_fiscal_year: "",
                                street: "",
                                postal_code: "",
                                city: "",
                                country: "",
                                phone_landline: "",
                                phone_mobile: "",
                                contact_email: "",
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
                            <Building className="h-4 w-4 text-(--nebula-gold-light)" />
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
                            <Briefcase className="h-4 w-4 text-(--nebula-gold-light)" />
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
        <div className="overflow-hidden rounded-xl border border-primary nebula-glass shadow-sm">
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
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/10 border-t-primary mb-4"></div>
              <p className="text-(--nebula-muted) font-medium">
                Chargement de la structure...
              </p>
            </div>
          ) : treeRows.length === 0 ? (
            <>
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  {searchQuery.trim() ? (
                    <svg
                      className="h-8 w-8 text-white/45"
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
                    <Folder className="h-8 w-8 text-white/45" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery.trim()
                    ? "Aucun résultat trouvé"
                    : "Aucune structure trouvée"}
                </h3>
                <p className="text-(--nebula-muted) text-center max-w-md mb-6">
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
            <div className="overflow-x-auto">
              {/* Indicateur de recherche active */}
              {searchQuery.trim() && (
                <div className="flex flex-col gap-2 border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
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
                    className="h-8 w-full px-3 text-amber-600 hover:bg-amber-100 hover:text-amber-700 sm:w-auto"
                  >
                    Effacer
                  </Button>
                </div>
              )}

              <div className="min-w-[720px]">
                {tree?.workspaces && tree.workspaces.length > 0 && (
                  <div className="grid grid-cols-[1fr_120px_100px_60px] gap-4 border-b border-primary bg-linear-to-r from-(--nebula-gold-light) via-(--nebula-gold-light) to-(--nebula-gold) text-white! px-3 py-4 text-xs font-semibold uppercase tracking-wider sm:px-6">
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

                <ul className="divide-y divide-primary/30">
                  {treeRows.map((node, index) => {
                    // Gérer l'en-tête de section pour les entreprises indépendantes
                    if (node.type === "section-header") {
                      const isPackageIcon = node.name === "ENTREPRISES INDÉPENDANTES";
                      return (
                        <li
                          key={node.id}
                          className={`bg-primary/0 border-y border-primary/0 ${user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HEAD_MANAGER" ? "mx-11" : ""}`}
                        >
                          <div className="flex items-center gap-2 px-3 py-3 sm:px-6">
                            <div className="h-px flex-1 bg-primary" />
                            <div className="flex items-center gap-2">
                              {isPackageIcon ? (
                                <Package className="h-4 w-4 text-primary" />
                              ) : (
                                <Building className="h-4 w-4 text-primary" />
                              )}
                              <span className="text-xs font-semibold text-primary uppercase tracking-wide whitespace-nowrap">
                                {node.name}
                              </span>
                            </div>
                            <div className="h-px flex-1 bg-primary" />
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
                        ? "text-dark"
                        : node.type === "group"
                          ? "text-primary"
                          : node.type === "company"
                            ? "text-light"
                            : "text-primary";
                    const typeText =
                      node.type === "workspace"
                        ? "Workspace"
                        : node.type === "group"
                          ? "Groupe"
                          : node.type === "company"
                            ? "Entreprise"
                            : "BU";
                    const typeBadgeVariant =
                      node.type === "workspace"
                        ? "info"
                        : node.type === "group"
                          ? "info"
                          : node.type === "company"
                            ? "neutral"
                            : "neutral";
                    const completion = node.completionPercentage;
                    const canExpand =
                      node.type === "company" && companiesWithBus.has(node.id);

                    return (
                      <li
                        key={`${node.type}-${node.id}`}
                        className={`group/row transition-all duration-200 hover:bg-primary/30 hover:shadow-sm ${node.type === "workspace" && index !== 0 ? "border-t-2 border-t-primary" : ""}`}
                      >
                        <div
                          className="grid cursor-pointer grid-cols-[1fr_120px_100px_60px] items-center gap-4 px-3 py-3 sm:px-6"
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
                                className="cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 mr-1"
                              >
                                <Play
                                  className={`h-3 w-3 fill-white/55 text-white/45 transition-transform nebula-light:fill-[var(--nebula-gold)]! nebula-light:text-[var(--nebula-gold)]! ${expandedCompanyIds.has(node.id)
                                    ? "rotate-90"
                                    : ""
                                    }`}
                                />
                              </div>
                            ) : (
                              node.type === "company" && (
                                <div className="w-5 fill-white/55 text-white/45" />
                              )
                            )}
                            <Icon
                              className={`h-5 w-5 ${iconColor} transition-colors group-hover/row:scale-110`}
                            />
                            <span
                              className={`truncate font-medium transition-colors ${node.type === "group"
                                ? "text-primary font-semibold"
                                : "te"
                                }`}
                            >
                              {node.name}
                            </span>
                            {node.type === "company" && node.groupId === null && (
                              <Badge variant="warning">Indépendante</Badge>
                            )}
                          </div>

                          <div>
                            <Badge variant={typeBadgeVariant}>{typeText}</Badge>
                          </div>

                          <div>
                            {completion !== null && (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden border border-primary">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${completion === 100
                                      ? "bg-green-500"
                                      : completion >= 50
                                        ? "bg-amber-400"
                                        : "bg-white/25"
                                      }`}
                                    style={{ width: `${completion}%` }}
                                  />
                                </div>
                                <span className="text-[10px] tabular-nums text-(--nebula-muted) font-medium">
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
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-(--nebula-muted) opacity-100 transition-all hover:bg-white/10 hover:text-primary hover:shadow-md md:group-hover/row:opacity-100"
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
                                          description: "",
                                          street: "",
                                          postal_code: "",
                                          city: "",
                                          phone_landline: "",
                                          phone_mobile: "",
                                          country: "",
                                          contact_email: "",
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
                                            description: "",
                                            siret: "",
                                            fiscal_year_start: "",
                                            last_closed_fiscal_year: "",
                                            street: "",
                                            postal_code: "",
                                            city: "",
                                            phone_landline: "",
                                            phone_mobile: "",
                                            contact_email: "",
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
                                            description: "",
                                            code: "",
                                            activity: "",
                                            siret: "",
                                            street: "",
                                            postal_code: "",
                                            city: "",
                                            country: "",
                                            phone_landline: "",
                                            phone_mobile: "",
                                            contact_email: "",
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
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-(--nebula-muted) opacity-100 transition-all hover:bg-white/10 hover:text-primary hover:shadow-sm md:opacity-0 md:group-hover/row:opacity-100"
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
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Building2 className="h-6 w-6 text-white/35" />
                      </div>
                      <h3 className="text-sm font-medium text-primary">
                        Aucune structure
                      </h3>
                      <p className="mt-1 text-sm text-(--nebula-muted)">
                        Commencez par créer votre première entreprise.
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="3xl">
          <DialogHeader className="gap-1 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                  {editing ? (
                    <>
                      <Pencil className="h-4 w-4 text-white/60" />
                      Modifier {typeLabel.toLowerCase()}
                    </>
                  ) : (
                    <>
                      <Info className="h-4 w-4 text-white/60" />
                      Détails
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-(--nebula-muted)">
                  {editing
                    ? "Mettez à jour les informations ci-dessous puis enregistrez vos modifications."
                    : "Vue détaillée des informations rattachées à cette entité."}
                </DialogDescription>
              </div>
              {!editing &&
                nodeUsers &&
                (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setNodeUsersOpen(true)}
                  >
                    <UsersIcon className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Utilisateurs liés</span>
                    <span className="sm:hidden">Utilisateurs</span>
                  </Button>
                )}
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 bg-transparent px-4 py-4 sm:px-5">
            {/* ---------- WORKSPACE ---------- */}
            {selectedNode?.type === "workspace" && (
              <>
                <DetailHero
                  type="workspace"
                  name={editworkspace.name}
                  logo={editworkspace.logo}
                  pills={
                    <>
                      {editworkspace.contact_email && (
                        <DetailPill icon={Mail}>
                          {editworkspace.contact_email}
                        </DetailPill>
                      )}
                      {editworkspace.phone_mobile && (
                        <DetailPill icon={Phone}>
                          {editworkspace.phone_mobile}
                        </DetailPill>
                      )}
                      {editworkspace.phone_landline && (
                        <DetailPill icon={Phone}>
                          {editworkspace.phone_landline}
                        </DetailPill>
                      )}
                    </>
                  }
                />

                <DetailSection
                  icon={Info}
                  title="Identité"
                  description="Nom et présentation générale de l'espace de travail."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <Field
                        label="Nom"
                        value={editworkspace.name}
                        editing={editing}
                        onChange={(v) =>
                          setEditworkspace((f) => ({ ...f, name: v }))
                        }
                      />
                      <FieldTextarea
                        label="Description"
                        value={editworkspace.description}
                        editing={editing}
                        onChange={(v) =>
                          setEditworkspace((f) => ({ ...f, description: v }))
                        }
                      />
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField label="Nom" value={editworkspace.name} />
                      <ReadField
                        label="Description"
                        value={editworkspace.description}
                        full
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={MapPin}
                  title="Adresse"
                  description="Adresse postale de l'espace de travail."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <Field
                        label="Rue"
                        value={editworkspace.street}
                        editing={editing}
                        onChange={(v) =>
                          setEditworkspace((f) => ({ ...f, street: v }))
                        }
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field
                          label="Code postal"
                          value={editworkspace.postal_code}
                          editing={editing}
                          onChange={(v) =>
                            setEditworkspace((f) => ({ ...f, postal_code: v }))
                          }
                        />
                        <Field
                          label="Ville"
                          value={editworkspace.city}
                          editing={editing}
                          onChange={(v) =>
                            setEditworkspace((f) => ({ ...f, city: v }))
                          }
                        />
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Pays
                          </label>
                          {editing ? (
                            <button
                              type="button"
                              onClick={() => setCountryModalOpen(true)}
                              className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                            >
                              <span className={editworkspace.country ? "text-foreground" : "text-muted-foreground"}>
                                {editworkspace.country ?
                                  (() => {
                                    const country = COUNTRIES.find(c => c.value === editworkspace.country || c.label === editworkspace.country);
                                    return country ? `${country.label} (${country.code})` : editworkspace.country;
                                  })()
                                  : "Sélectionner un pays"
                                }
                              </span>
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ) : (
                            <div className="min-h-10 flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                              {editworkspace.country ?
                                (() => {
                                  const country = COUNTRIES.find(c => c.value === editworkspace.country || c.label === editworkspace.country);
                                  return country ? `${country.label} (${country.code})` : editworkspace.country;
                                })()
                                : "Non renseigné"
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Rue"
                        icon={MapPin}
                        value={editworkspace.street}
                      />
                      <ReadField
                        label="Code postal"
                        value={editworkspace.postal_code}
                      />
                      <ReadField
                        label="Ville"
                        value={editworkspace.city}
                      />
                      <ReadField
                        label="Pays"
                        value={editworkspace.country}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Phone}
                  title="Contact"
                  description="Coordonnées pour contacter l'espace de travail."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={editworkspace.contact_email}
                            onChange={(e) =>
                              setEditworkspace((f) => ({ ...f, contact_email: e.target.value }))
                            }
                            placeholder="email@exemple.com"
                            className={
                              editWorkspaceErrors.contact_email
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {editWorkspaceErrors.contact_email && (
                            <p className="mt-1 text-xs text-red-500">
                              {editWorkspaceErrors.contact_email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Téléphone mobile
                          </label>
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="FR"
                            value={editworkspace.phone_mobile}
                            onChange={(value) =>
                              handlePhoneChange(value || "", "editworkspace", "phone_mobile")
                            }
                            className={
                              editWorkspaceErrors.phone_landline && editWorkspaceErrors.phone_mobile && editWorkspaceErrors.contact_email
                                ? "border-red-500"
                                : ""
                            }
                            numberInputProps={{
                              className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${editWorkspaceErrors.phone_mobile ? "border-red-500" : ""}`,
                            }}
                          />

                          {editWorkspaceErrors.phone_mobile && (
                            <p className="mt-1 text-xs text-red-500">
                              {editWorkspaceErrors.phone_mobile}
                            </p>
                          )}

                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Téléphone fixe
                          </label>
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="FR"
                            value={editworkspace.phone_landline}
                            onChange={(value) =>
                              handlePhoneChange(value || "", "editworkspace", "phone_landline")
                            }
                            className={
                              editWorkspaceErrors.phone_landline
                                ? "border-red-500"
                                : ""
                            }
                            numberInputProps={{
                              className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${editWorkspaceErrors.phone_landline ? "border-red-500" : ""}`,
                            }}
                          />
                          {editWorkspaceErrors.phone_landline && (
                            <p className="mt-1 text-xs text-red-500">
                              {editWorkspaceErrors.phone_landline}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Email"
                        icon={Mail}
                        value={editworkspace.contact_email}
                      />
                      <ReadField
                        label="Téléphone mobile"
                        icon={Phone}
                        value={editworkspace.phone_mobile}
                      />
                      <ReadField
                        label="Téléphone fixe"
                        icon={Phone}
                        value={editworkspace.phone_landline}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={ImageIcon}
                  title="Identité visuelle"
                  description="Logo affiché dans les interfaces."
                >
                  {editing ? (
                    <FileUpload
                      key={editworkspace.logo}
                      value={editworkspace.logo}
                      onChange={(file) => {
                        setEditworkspaceLogoFile(file);
                        setEditworkspace((f) => {
                          if (f.logo?.startsWith("blob:")) {
                            URL.revokeObjectURL(f.logo);
                          }
                          return {
                            ...f,
                            logo: file ? URL.createObjectURL(file) : undefined,
                          };
                        });
                      }}
                      placeholder="Uploader une image de logo"
                      accept="image/*"
                    />
                  ) : editworkspace.logo ? (
                    <div className="flex items-center gap-3">
                      <DetailLogoPreview
                        logo={editworkspace.logo}
                        alt="Logo"
                        size={72}
                      />
                      <p className="truncate text-xs text-(--nebula-muted)">
                        {editworkspace.logo}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-(--nebula-muted)">
                      Aucun logo renseigné
                    </p>
                  )}
                </DetailSection>
              </>
            )}

            {/* ---------- GROUP ---------- */}
            {selectedNode?.type === "group" && (
              <>
                <DetailHero
                  type="group"
                  name={editGroup.name}
                  logo={editGroup.logo}
                />


                <DetailSection
                  icon={Info}
                  title="Identité"
                  description="Informations principales du groupe."
                >
                  {editing ? (
                    <DetailGrid>
                      <Field
                        label="Nom"
                        value={editGroup.name}
                        editing={editing}
                        onChange={(v) => setEditGroup((f) => ({ ...f, name: v }))}
                      />
                      <FieldTextarea
                        label="Description"
                        value={editGroup.description}
                        editing={editing}
                        onChange={(v) => setEditGroup((f) => ({ ...f, description: v }))}
                      />
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField label="Nom" value={editGroup.name} />
                      <ReadField
                        label="Description"
                        value={editGroup.description}
                        full
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={MapPin}
                  title="Adresse"
                  description="Adresse postale du groupe."
                >
                  {editing ? (
                    <DetailGrid>
                      <Field
                        label="Rue"
                        value={editGroup.street}
                        editing={editing}
                        onChange={(v) => setEditGroup((f) => ({ ...f, street: v }))}
                        placeholder="123 rue de la République"
                      />
                      <Field
                        label="Code postal"
                        value={editGroup.postal_code}
                        editing={editing}
                        onChange={(v) => setEditGroup((f) => ({ ...f, postal_code: v }))}
                        placeholder="75001"
                      />
                      <Field
                        label="Ville"
                        value={editGroup.city}
                        editing={editing}
                        onChange={(v) => setEditGroup((f) => ({ ...f, city: v }))}
                        placeholder="Paris"
                      />
                      {editing ? (
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Pays
                          </label>
                          <button
                            type="button"
                            onClick={() => setGroupCountryModalOpen(true)}
                            className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                          >
                            <span className={editGroup.country ? "text-foreground" : "text-muted-foreground"}>
                              {editGroup.country ? getCountryName(editGroup.country) : "Sélectionner un pays..."}
                            </span>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <ReadField
                          label="Pays"
                          icon={Globe}
                          value={editGroup.country ? getCountryName(editGroup.country) : ""}
                        />
                      )}
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Rue"
                        icon={MapPin}
                        value={editGroup.street}
                      />
                      <ReadField
                        label="Code postal"
                        icon={MapPin}
                        value={editGroup.postal_code}
                      />
                      <ReadField
                        label="Ville"
                        icon={MapPin}
                        value={editGroup.city}
                      />
                      <ReadField
                        label="Pays"
                        icon={Globe}
                        value={editGroup.country ? getCountryName(editGroup.country) : ""}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Phone}
                  title="Contact"
                  description="Coordonnées pour contacter le groupe."
                >
                  {editing ? (
                    <DetailGrid>
                      <Field
                        label="Email"
                        value={editGroup.contact_email}
                        editing={editing}
                        type="email"
                        onChange={(v) => setEditGroup((f) => ({ ...f, contact_email: v }))}
                        placeholder="contact@groupe.com"
                      />
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Téléphone mobile
                        </label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="FR"
                          value={editGroup.phone_mobile}
                          onChange={(value) =>
                            handlePhoneChange(value || "", "editGroup", "phone_mobile")
                          }
                          className={
                            groupErrors.phone_mobile
                              ? "border-red-500"
                              : ""
                          }
                          numberInputProps={{
                            className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${groupErrors.phone_mobile ? "border-red-500" : ""}`,
                          }}
                        />
                        {groupErrors.phone_mobile && (
                          <p className="mt-1 text-xs text-red-500">
                            {groupErrors.phone_mobile}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Téléphone fixe
                        </label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="FR"
                          value={editGroup.phone_landline}
                          onChange={(value) =>
                            handlePhoneChange(value || "", "editGroup", "phone_landline")
                          }
                          className={
                            groupErrors.phone_landline
                              ? "border-red-500"
                              : ""
                          }
                          numberInputProps={{
                            className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${groupErrors.phone_landline ? "border-red-500" : ""}`,
                          }}
                        />
                        {groupErrors.phone_landline && (
                          <p className="mt-1 text-xs text-red-500">
                            {groupErrors.phone_landline}
                          </p>
                        )}
                      </div>
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Email"
                        icon={Mail}
                        value={editGroup.contact_email}
                      />
                      <ReadField
                        label="Téléphone fixe"
                        icon={Phone}
                        value={editGroup.phone_landline}
                      />
                      <ReadField
                        label="Téléphone mobile"
                        icon={Phone}
                        value={editGroup.phone_mobile}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Calendar}
                  title="Exercice fiscal"
                  description="Dates clés de la période comptable."
                >
                  {editing ? (
                    <DetailGrid>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Début d&apos;exercice
                        </label>
                        <Input
                          type="text"
                          value={editGroup.fiscal_year_start}
                          onChange={(e) =>
                            setEditGroup((prev) => ({
                              ...prev,
                              fiscal_year_start: normalizeMonthDayInput(
                                e.target.value,
                              ),
                            }))
                          }
                          placeholder="DD-MM"
                          maxLength={5}
                        />
                      </div>
                      <Field
                        label="Dernier exercice clôturé"
                        value={editGroup.last_closed_fiscal_year}
                        editing={editing}
                        type="number"
                        onChange={(v) =>
                          setEditGroup((prev) => ({
                            ...prev,
                            last_closed_fiscal_year: v,
                          }))
                        }
                      />
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Début d'exercice"
                        icon={Calendar}
                        value={formatMonthDayForDisplay(
                          editGroup.fiscal_year_start,
                        )}
                        mono
                        hint="Jour/mois de début de l'exercice fiscal."
                      />
                      <ReadField
                        label="Dernier exercice clôturé"
                        icon={Calendar}
                        value={editGroup.last_closed_fiscal_year}
                        mono
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={ImageIcon}
                  title="Identité visuelle"
                  description="Logo affiché dans les interfaces."
                >
                  {editing ? (
                    <FileUpload
                      key={editGroup.logo}
                      value={editGroup.logo}
                      onChange={(file) => {
                        setEditGroupLogoFile(file);
                        setEditGroup((f) => {
                          if (f.logo?.startsWith("blob:")) {
                            URL.revokeObjectURL(f.logo);
                          }
                          return { ...f, logo: file ? URL.createObjectURL(file) : undefined };
                        });
                      }}
                      placeholder="Uploader une image de logo"
                      accept="image/*"
                    />
                  ) : editGroup.logo ? (
                    <div className="flex items-center gap-3">
                      <DetailLogoPreview
                        logo={editGroup.logo}
                        alt="Logo"
                        size={72}
                      />
                      <p className="truncate text-xs text-(--nebula-muted)">
                        {editGroup.logo}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-(--nebula-muted)">
                      Aucun logo renseigné
                    </p>
                  )}
                </DetailSection>
              </>
            )}

            {/* ---------- COMPANY ---------- */}
            {selectedNode?.type === "company" && (
              <>
                <DetailHero
                  type="company"
                  name={editCompany.name}
                  logo={editCompany.logo}

                />

                {/* Completion progress (view only) */}
                {!editing && (
                  <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white">
                          Complétion du profil
                        </h4>
                        <p className="text-[11px] leading-snug text-(--nebula-muted)">
                          Pourcentage d&apos;informations renseignées sur cette
                          entreprise.
                        </p>
                      </div>
                      <span className="text-xl font-semibold tabular-nums text-white">
                        {Math.round(editCompany.completionPercentage)}
                        <span className="text-sm text-white/45">%</span>
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) transition-all"
                        style={{
                          width: `${Math.max(0, Math.min(100, editCompany.completionPercentage))}%`,
                        }}
                      />
                    </div>
                  </section>
                )}

                <DetailSection
                  icon={Info}
                  title="Identité"
                  description="Informations générales de l'entreprise."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <DetailGrid>
                        <Field
                          label="Nom"
                          value={editCompany.name}
                          editing={editing}
                          onChange={(v) =>
                            setEditCompany((f) => ({ ...f, name: v }))
                          }
                        />
                        <FieldTextarea
                          label="Description"
                          value={editCompany.description}
                          editing={editing}
                          onChange={(v) => setEditCompany((f) => ({ ...f, description: v }))}
                        />

                      </DetailGrid>
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField label="Nom" value={editCompany.name} />
                      <ReadField
                        label="Description"
                        value={editCompany.description}
                        full
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={MapPin}
                  title="Adresse"
                  description="Adresse postale de l'entreprise."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <DetailGrid>
                        <Field
                          label="Rue"
                          value={editCompany.street}
                          editing={editing}
                          onChange={(v) => setEditCompany((f) => ({ ...f, street: v }))}
                          placeholder="123 rue de la République"
                        />
                        <Field
                          label="Code postal"
                          value={editCompany.postal_code}
                          editing={editing}
                          onChange={(v) => setEditCompany((f) => ({ ...f, postal_code: v }))}
                          placeholder="75001"
                        />
                        <Field
                          label="Ville"
                          value={editCompany.city}
                          editing={editing}
                          onChange={(v) => setEditCompany((f) => ({ ...f, city: v }))}
                          placeholder="Paris"
                        />
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Pays
                          </label>
                          <button
                            type="button"
                            onClick={() => setCompanyCountryModalOpen(true)}
                            className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                          >
                            <span className={editCompany.country ? "text-foreground" : "text-muted-foreground"}>
                              {editCompany.country ? getCountryName(editCompany.country) : "Sélectionner un pays..."}
                            </span>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </DetailGrid>
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Rue"
                        icon={MapPin}
                        value={editCompany.street}
                      />
                      <ReadField
                        label="Code postal"
                        icon={MapPin}
                        value={editCompany.postal_code}
                      />
                      <ReadField
                        label="Ville"
                        icon={MapPin}
                        value={editCompany.city}
                      />
                      <ReadField
                        label="Pays"
                        icon={Globe}
                        value={editCompany.country ? getCountryName(editCompany.country) : ""}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Phone}
                  title="Contact"
                  description="Coordonnées pour contacter l'entreprise."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <DetailGrid>
                        <Field
                          label="Email"
                          value={editCompany.contact_email}
                          editing={editing}
                          type="email"
                          onChange={(v) => setEditCompany((f) => ({ ...f, contact_email: v }))}
                          placeholder="contact@entreprise.com"
                        />
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Téléphone mobile
                          </label>
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="FR"
                            value={editCompany.phone_mobile}
                            onChange={(value) =>
                              handlePhoneChange(value || "", "editCompany", "phone_mobile")
                            }
                            className={
                              companyErrors?.phone_mobile
                                ? "border-red-500"
                                : ""
                            }
                            numberInputProps={{
                              className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${companyErrors?.phone_mobile ? "border-red-500" : ""}`,
                            }}
                          />
                          {companyErrors?.phone_mobile && (
                            <p className="mt-1 text-xs text-red-500">
                              {companyErrors.phone_mobile}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                            Téléphone fixe
                          </label>
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="FR"
                            value={editCompany.phone_landline}
                            onChange={(value) =>
                              handlePhoneChange(value || "", "editCompany", "phone_landline")
                            }
                            className={
                              companyErrors?.phone_landline
                                ? "border-red-500"
                                : ""
                            }
                            numberInputProps={{
                              className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${companyErrors?.phone_landline ? "border-red-500" : ""}`,
                            }}
                          />
                          {companyErrors?.phone_landline && (
                            <p className="mt-1 text-xs text-red-500">
                              {companyErrors.phone_landline}
                            </p>
                          )}
                        </div>
                      </DetailGrid>
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Email"
                        icon={Mail}
                        value={editCompany.contact_email}
                      />
                      <ReadField
                        label="Téléphone fixe"
                        icon={Phone}
                        value={editCompany.phone_landline}
                      />
                      <ReadField
                        label="Téléphone mobile"
                        icon={Phone}
                        value={editCompany.phone_mobile}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Hash}
                  title="Informations légales"
                  description="Identifiants d'immatriculation et activité principale."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <DetailGrid>
                        <Field
                          label="SIRET"
                          value={editCompany.siret}
                          editing={editing}
                          validate={validateSiret}
                          onChange={(v) =>
                            setEditCompany((f) => ({ ...f, siret: v }))
                          }
                        />
                        <Field
                          label="SIREN"
                          value={
                            editCompany.siret
                              ? editCompany.siret.substring(0, 9)
                              : ""
                          }
                          editing={false}
                          onChange={() => { }}
                        />
                      </DetailGrid>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Code APE
                        </label>
                        <button
                          type="button"
                          onClick={() => setCompanyApeModalOpen(true)}
                          className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                        >
                          <span className={editCompany.ape_code ? "text-foreground" : "text-muted-foreground"}>
                            {editCompany.ape_code ?
                              APE_CODES.find(code => code.value === editCompany.ape_code)?.label || editCompany.ape_code
                              : "Sélectionner un code APE"
                            }
                          </span>
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <Field
                        label="Activité principale"
                        value={editCompany.main_activity}
                        editing={false}
                        onChange={() => { }}
                      />

                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="SIRET"
                        icon={Hash}
                        value={formatSiret(editCompany.siret)}
                        mono
                        hint="Identifiant d'établissement à 14 chiffres."
                      />
                      <ReadField
                        label="SIREN"
                        icon={Hash}
                        value={formatSiren(editCompany.siret)}
                        mono
                        hint="Identifiant d'établissement à 9 chiffres."
                      />
                      <ReadField
                        label="Code APE"
                        icon={BadgeCheck}
                        value={editCompany.ape_code}
                        mono
                      />
                      <ReadField
                        label="Activité principale"
                        icon={FileText}
                        value={editCompany.main_activity}
                      />

                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Calendar}
                  title="Exercice fiscal"
                  description="Dates clés de la période comptable."
                >
                  {editing ? (
                    <DetailGrid>
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
                        label="Dernier exercice clôturé"
                        value={editCompany.last_closed_fiscal_year}
                        editing={editing}
                        type="number"
                        onChange={(v) =>
                          setEditCompany((prev) => ({
                            ...prev,
                            last_closed_fiscal_year: v,
                          }))
                        }
                      />
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Début d'exercice"
                        icon={Calendar}
                        value={formatMonthDayForDisplay(
                          editCompany.fiscal_year_start,
                        )}
                        mono
                        hint="Jour/mois de début de l'exercice fiscal."
                      />
                      <ReadField
                        label="Dernier exercice clôturé"
                        icon={Calendar}
                        value={editCompany.last_closed_fiscal_year}
                        mono
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Briefcase}
                  title="Profil commercial"
                  description="Taille et positionnement de l'entreprise."
                >
                  {editing ? (
                    <DetailGrid>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Taille
                        </label>
                        <Select
                          value={editCompany.size}
                          onValueChange={(v) => setEditCompany((f) => ({ ...f, size: v }))}
                        >
                          <option value="SMALL">SMALL</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LARGE">LARGE</option>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Modèle
                        </label>
                        <Select
                          value={editCompany.model}
                          onValueChange={(v) => setEditCompany((f) => ({ ...f, model: v }))}
                        >
                          <option value="HOLDING">HOLDING</option>
                          <option value="SUBSIDIARY">SUBSIDIARY</option>
                        </Select>
                      </div>
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Taille"
                        icon={UsersIcon}
                        value={editCompany.size}
                      />
                      <ReadField
                        label="Modèle"
                        value={editCompany.model}
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={ImageIcon}
                  title="Identité visuelle"
                  description="Logo affiché dans les interfaces."
                >
                  {editing ? (
                    <FileUpload
                      key={editCompany.logo}
                      value={editCompany.logo}
                      onChange={(file) => {
                        setEditCompanyLogoFile(file);
                        setEditCompany((f) => {
                          if (f.logo?.startsWith("blob:")) {
                            URL.revokeObjectURL(f.logo);
                          }
                          return { ...f, logo: file ? URL.createObjectURL(file) : undefined };
                        });
                      }}
                      placeholder="Uploader une image de logo"
                      accept="image/*"
                    />
                  ) : editCompany.logo ? (
                    <div className="flex items-center gap-3">
                      <DetailLogoPreview
                        logo={editCompany.logo}
                        alt="Logo"
                        size={72}
                      />
                      <p className="truncate text-xs text-(--nebula-muted)">
                        {editCompany.logo}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-(--nebula-muted)">
                      Aucun logo renseigné
                    </p>
                  )}
                </DetailSection>

                {!editing &&
                  (busByCompany[selectedNode.id] ?? []).length > 0 && (
                    <DetailSection
                      icon={Briefcase}
                      title={`Business Units (${(busByCompany[selectedNode.id] ?? []).length})`}
                      description="Unités d'activité rattachées à cette entreprise."
                    >
                      <ul className="divide-y divide-white/10">
                        {(busByCompany[selectedNode.id] ?? []).map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10">
                                <Briefcase className="h-3.5 w-3.5 text-(--nebula-gold-light)" />
                              </div>
                              <span className="truncate text-sm font-medium text-white">
                                {b.name}
                              </span>
                            </div>
                            {b.code && (
                              <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-(--nebula-muted) ring-1 ring-white/15">
                                {b.code}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </DetailSection>
                  )}
              </>
            )}

            {/* ---------- BUSINESS UNIT ---------- */}
            {selectedNode?.type === "bu" && (
              <>
                <DetailHero
                  type="bu"
                  name={editBU.name}
                  logo={editBU.logo}
                  pills={
                    <>
                      {editBU.code && (
                        <DetailPill icon={BadgeCheck} mono>
                          APE {editBU.code}
                        </DetailPill>
                      )}
                      {editBU.siret && (
                        <DetailPill icon={Hash} mono>
                          SIRET {formatSiret(editBU.siret)}
                        </DetailPill>
                      )}
                      {editBU.country && (
                        <DetailPill icon={Globe}>{editBU.country}</DetailPill>
                      )}
                    </>
                  }
                />

                <DetailSection
                  icon={Info}
                  title="Identité"
                  description="Nom et activité de l'unité."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <Field
                        label="Nom"
                        value={editBU.name}
                        editing={editing}
                        onChange={(v) =>
                          setEditBU((f) => ({ ...f, name: v }))
                        }
                      />
                      <Field
                        label="Description"
                        value={editBU.description}
                        editing={editing}
                        onChange={(v) =>
                          setEditBU((f) => ({ ...f, description: v }))
                        }
                      />
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField label="Nom" value={editBU.name} />
                      <ReadField
                        label="Description"
                        icon={FileText}
                        value={editBU.description}
                        full
                      />

                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Hash}
                  title="Informations légales"
                  description="Identifiants et pays d'exercice."
                >
                  {editing ? (
                    <DetailGrid>
                      <Field
                        label="SIRET"
                        value={editBU.siret}
                        editing={editing}
                        validate={validateSiret}
                        onChange={(v) =>
                          setEditBU((f) => ({ ...f, siret: v }))
                        }
                      />
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Code APE
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditBUApeModalOpen(true)}
                          className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                        >
                          <span className={editBU.code ? "text-foreground" : "text-muted-foreground"}>
                            {editBU.code ?
                              APE_CODES.find(code => code.value === editBU.code)?.label || editBU.code
                              : "Sélectionner un code APE"
                            }
                          </span>
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Activité
                        </label>
                        <Input
                          value={editBU.activity}
                          readOnly
                          className="bg-white/5"
                          placeholder="Activité principale"
                        />
                      </div>
                    </DetailGrid>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="SIRET"
                        icon={Hash}
                        value={formatSiret(editBU.siret)}
                        mono
                        hint="Identifiant d'établissement à 14 chiffres."
                      />
                      <ReadField
                        label="Code APE"
                        icon={BadgeCheck}
                        value={editBU.code}
                        mono
                      />
                      <ReadField
                        label="Activité"
                        icon={FileText}
                        value={editBU.activity}
                        full
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={MapPin}
                  title="Adresse"
                  description="Adresse postale de l'unité."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Rue
                        </label>
                        <Input
                          value={editBU.street}
                          onChange={(e) =>
                            setEditBU((f) => ({ ...f, street: e.target.value }))
                          }
                          placeholder="Rue"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Code postal
                        </label>
                        <Input
                          value={editBU.postal_code}
                          onChange={(e) =>
                            setEditBU((f) => ({ ...f, postal_code: e.target.value }))
                          }
                          placeholder="Code postal"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Ville
                        </label>
                        <Input
                          value={editBU.city}
                          onChange={(e) =>
                            setEditBU((f) => ({ ...f, city: e.target.value }))
                          }
                          placeholder="Ville"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Pays
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditBUCountryModalOpen(true)}
                          className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                        >
                          <span className={editBU.country ? "text-foreground" : "text-muted-foreground"}>
                            {editBU.country ?
                              (() => {
                                const country = COUNTRIES.find(c => c.value === editBU.country || c.label === editBU.country);
                                return country ? `${country.label} (${country.code})` : editBU.country;
                              })()
                              : "Sélectionner un pays"
                            }
                          </span>
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ReadField
                        label="Rue"
                        icon={MapPin}
                        value={editBU.street}
                        full
                      />
                      <ReadField
                        label="Code postal"
                        icon={MapPin}
                        value={editBU.postal_code}
                        mono
                      />
                      <ReadField
                        label="Ville"
                        icon={MapPin}
                        value={editBU.city}
                      />
                      <ReadField
                        label="Pays"
                        icon={Globe}
                        value={editBU.country}
                      />
                    </div>
                  )}
                </DetailSection>

                <DetailSection
                  icon={Phone}
                  title="Contact"
                  description="Téléphones et email."
                >
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Téléphone mobile
                        </label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="FR"
                          value={editBU.phone_mobile}
                          onChange={(value) =>
                            handlePhoneChange(value || "", "editBU", "phone_mobile")
                          }
                          className={
                            buErrors?.phone_mobile
                              ? "border-red-500"
                              : ""
                          }
                          numberInputProps={{
                            className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${buErrors?.phone_mobile ? "border-red-500" : ""}`,
                          }}
                        />
                        {buErrors?.phone_mobile && (
                          <p className="mt-1 text-xs text-red-500">
                            {buErrors.phone_mobile}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                          Téléphone fixe
                        </label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="FR"
                          value={editBU.phone_landline}
                          onChange={(value) =>
                            handlePhoneChange(value || "", "editBU", "phone_landline")
                          }
                          className={
                            buErrors?.phone_landline
                              ? "border-red-500"
                              : ""
                          }
                          numberInputProps={{
                            className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${buErrors?.phone_landline ? "border-red-500" : ""}`,
                          }}
                        />
                        {buErrors?.phone_landline && (
                          <p className="mt-1 text-xs text-red-500">
                            {buErrors.phone_landline}
                          </p>
                        )}
                      </div>
                      <Field
                        label="Email"
                        value={editBU.contact_email}
                        editing={editing}
                        onChange={(v) =>
                          setEditBU((f) => ({ ...f, contact_email: v }))
                        }
                      />
                    </div>
                  ) : (
                    <DetailGrid>
                      <ReadField
                        label="Téléphone fixe"
                        icon={Phone}
                        value={editBU.phone_landline}
                        mono
                      />
                      <ReadField
                        label="Téléphone mobile"
                        icon={Phone}
                        value={editBU.phone_mobile}
                        mono
                      />
                      <ReadField
                        label="Email"
                        icon={Mail}
                        value={editBU.contact_email}
                        mono
                      />
                    </DetailGrid>
                  )}
                </DetailSection>

                <DetailSection
                  icon={ImageIcon}
                  title="Identité visuelle"
                  description="Logo affiché dans les interfaces."
                >
                  {editing ? (
                    <FileUpload
                      key={editBU.logo}
                      value={editBU.logo}
                      onChange={(file) => {
                        setEditBULogoFile(file);
                        setEditBU((f) => {
                          if (f.logo?.startsWith("blob:")) {
                            URL.revokeObjectURL(f.logo);
                          }
                          return { ...f, logo: file ? URL.createObjectURL(file) : undefined };
                        });
                      }}
                      placeholder="Uploader une image de logo"
                      accept="image/*"
                    />
                  ) : editBU.logo ? (
                    <div className="flex items-center gap-3">
                      <DetailLogoPreview
                        logo={editBU.logo}
                        alt="Logo"
                        size={72}
                      />
                      <p className="truncate text-xs text-(--nebula-muted)">
                        {editBU.logo}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-(--nebula-muted)">
                      Aucun logo renseigné
                    </p>
                  )}
                </DetailSection>
              </>
            )}
          </DialogBody>

          <DialogFooter>
            {!editing ? (
              <>
                {(user?.role === "SUPER_ADMIN" ||
                  user?.role === "ADMIN" ||
                  user?.role === "MANAGER" ||
                  user?.role === "HEAD_MANAGER") && (
                    <Button
                      variant="outline"
                      className="text-white/80 hover:text-white"
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Fiche complète
                  </Button>
                )}
                {(user?.role === "SUPER_ADMIN" ||
                  user?.role === "ADMIN" ||
                  user?.role === "HEAD_MANAGER" ||
                  user?.role === "MANAGER") && (
                    <Button onClick={() => setEditing(true)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
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
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-white">
              Utilisateurs liés à ce nœud
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
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
                      <p className="pl-1 text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                        {roleLabel}{" "}
                        <span className="font-normal text-white/50">
                          ({users.length}):
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-(--nebula-muted)">
                        {sortedUsers.map((u) => {
                          const fullName =
                            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                          return (
                            <li
                              key={u.id}
                              className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10 nebula-blob"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-white">
                                  {fullName || u.email}
                                </span>
                                {fullName && (
                                  <span className="text-[11px] text-(--nebula-muted) font-mono">
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
              <p className="text-xs text-(--nebula-muted)">
                Aucun utilisateur lié à ce nœud.
              </p>
            )}
          </DialogBody>
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
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-(--nebula-muted)">
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong className="font-semibold text-white">{selectedNode?.name}</strong> ?{" "}
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fiche Entreprise Modal */}
      <Dialog open={ficheOpen} onOpenChange={setFicheOpen}>
        <DialogContent size="7xl">
          <DialogHeader className="gap-1 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Building2 className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              <span className="min-w-0 truncate">
                {ficheCompany?.name ??
                  allTreeCompanies.find((x) => x.id === ficheCompanyId)?.name ??
                  "Fiche entreprise"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-(--nebula-muted)">
              Vue complète de l’entreprise (informations, business units, actionnaires et
              données extracomptables).
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 bg-transparent px-3 py-4 sm:px-5">
            {(() => {
              if (!ficheCompany) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-(--nebula-gold-light)" />
                  </div>
                );
              }
              const bus = busByCompany[ficheCompany.id] ?? [];
              return (
                <Tabs value={ficheTab} onValueChange={setFicheTab} className="space-y-3">
                  <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="informations">Informations</TabsTrigger>
                    <TabsTrigger value="business-units">
                      Business Units
                    </TabsTrigger>
                    <TabsTrigger value="actionnaires">Actionnaires</TabsTrigger>
                    <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
                  </TabsList>
                  <TabsContent value="informations" className="mt-0">
                    <div className="space-y-4">
                      <DetailHero
                        type="company"
                        name={ficheCompany.name}
                        logo={ficheCompany.logo}
                        pills={
                          <>
                            {ficheCompany.siret && (
                              <DetailPill icon={Hash} mono>
                                SIRET {formatSiret(ficheCompany.siret)}
                              </DetailPill>
                            )}
                            {ficheCompany.ape_code && (
                              <DetailPill icon={BadgeCheck} mono>
                                APE {ficheCompany.ape_code}
                              </DetailPill>
                            )}
                            {ficheCompany.country && (
                              <DetailPill icon={Globe}>{ficheCompany.country}</DetailPill>
                            )}
                            {ficheCompany.size && (
                              <DetailPill icon={UsersIcon}>{ficheCompany.size}</DetailPill>
                            )}
                          </>
                        }
                      />

                      {typeof ficheCompany.completionPercentage === "number" && (
                        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 nebula-blob">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white">
                                Complétion du profil
                              </h4>
                              <p className="text-[11px] leading-snug text-(--nebula-muted)">
                                Pourcentage d&apos;informations renseignées sur cette entreprise.
                              </p>
                            </div>
                            <span className="text-xl font-semibold tabular-nums text-white font-mono">
                              {Math.round(ficheCompany.completionPercentage)}
                              <span className="text-sm text-(--nebula-muted)">%</span>
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) transition-all"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, ficheCompany.completionPercentage),
                                )}%`,
                              }}
                            />
                          </div>
                        </section>
                      )}

                      <DetailSection
                        icon={Info}
                        title="Identité"
                        description="Informations générales de l'entreprise."
                      >
                        <DetailGrid>
                          <ReadField label="Nom" value={ficheCompany.name} />
                          <ReadField label="Pays" icon={Globe} value={ficheCompany.country} />
                          <ReadField
                            label="Adresse"
                            icon={MapPin}
                            value={ficheCompany.address}
                            full
                          />
                        </DetailGrid>
                      </DetailSection>

                      <DetailSection
                        icon={Hash}
                        title="Informations légales"
                        description="Identifiants d'immatriculation et activité principale."
                      >
                        <DetailGrid>
                          <ReadField
                            label="SIRET"
                            icon={Hash}
                            value={formatSiret(ficheCompany.siret)}
                            mono
                            hint="Identifiant d'établissement à 14 chiffres."
                          />
                          <ReadField
                            label="SIREN"
                            icon={Hash}
                            value={formatSiren(ficheCompany.siret)}
                            mono
                            hint="Identifiant d'établissement à 9 chiffres."
                          />
                          <ReadField
                            label="Code APE"
                            icon={BadgeCheck}
                            value={ficheCompany.ape_code}
                            mono
                          />
                          <ReadField
                            label="Activité principale"
                            icon={FileText}
                            value={ficheCompany.main_activity}
                            full
                          />
                        </DetailGrid>
                      </DetailSection>

                      <DetailSection
                        icon={Calendar}
                        title="Exercice fiscal"
                        description="Dates clés de la période comptable."
                      >
                        <DetailGrid>
                          <ReadField
                            label="Début d'exercice"
                            icon={Calendar}
                            value={formatMonthDayForDisplay(ficheCompany.fiscal_year_start)}
                            mono
                            hint="Jour/mois de début de l'exercice fiscal."
                          />
                          <ReadField
                            label="Dernier exercice clôturé"
                            icon={Calendar}
                            value={
                              ficheCompany.last_closed_fiscal_year === null ||
                                ficheCompany.last_closed_fiscal_year === undefined
                                ? undefined
                                : String(ficheCompany.last_closed_fiscal_year)
                            }
                            mono
                          />
                        </DetailGrid>
                      </DetailSection>

                      <DetailSection
                        icon={Briefcase}
                        title="Profil commercial"
                        description="Taille et positionnement de l'entreprise."
                      >
                        <DetailGrid>
                          <ReadField label="Taille" icon={UsersIcon} value={ficheCompany.size} />
                          <ReadField label="Modèle" value={ficheCompany.model} />
                        </DetailGrid>
                      </DetailSection>

                      <DetailSection
                        icon={ImageIcon}
                        title="Identité visuelle"
                        description="Logo affiché dans les interfaces."
                      >
                        {ficheCompany.logo ? (
                          <div className="flex items-center gap-3">
                            <DetailLogoPreview logo={ficheCompany.logo} alt="Logo" size={72} />
                            <p className="truncate text-xs text-(--nebula-muted)">
                              {ficheCompany.logo}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm italic text-(--nebula-muted)">
                            Aucun logo renseigné
                          </p>
                        )}
                      </DetailSection>
                    </div>
                  </TabsContent>
                  <TabsContent value="business-units" className="mt-0">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                      <ul className="space-y-2">
                        {bus.map((b) => (
                          <li
                            key={b.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
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
                              <span className="text-sm text-(--nebula-muted)">
                                {b.code}
                                {b.code && b.siret ? " — " : ""}
                                {b.siret}
                              </span>
                              <span className="text-white/45">›</span>
                            </div>
                          </li>
                        ))}
                        {bus.length === 0 && (
                          <li className="py-4 text-center text-white/45">
                            Aucune business unit.
                          </li>
                        )}
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="actionnaires" className="mt-0">
                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
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
                        <p className="text-xs text-white/45">
                          Chargement des actionnaires...
                        </p>
                      ) : ficheShareholders.length === 0 ? (
                        <p className="text-xs text-white/45">
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
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-primary">
                                    {ownerLabel}
                                  </span>
                                  <span className="text-[11px] text-white/45">
                                    {ownerTypeLabel(s.ownerType)}
                                  </span>
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-medium text-(--nebula-gold-light)">
                                  <span>{s.percentage}%</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="donnees-extracomptables" className="mt-0">
                    <div className="space-y-6">
                      {ficheCompanyDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
                        </div>
                      ) : (
                        <>
                          <EmpruntsSection
                            emprunts={ficheCompanyEmprunts}
                            emptyMessage="Aucun emprunt enregistré pour cette entreprise."
                            onLoanClick={handleLoanClick}
                          />
                          <ActifsSection
                            actifs={ficheCompanyActifs}
                            emptyMessage="Aucun actif immobilisé enregistré pour cette entreprise."
                            onAssetClick={handleAssetClick}
                          />
                          <DotationsSection
                            dotations={ficheCompanyDotations}
                            emptyMessage="Aucune dotation aux amortissements enregistrée pour cette entreprise."
                            onDotationClick={handleDotationClick}
                          />

                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              );
            })()}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiche Group Modal */}
      <Dialog open={ficheGroupOpen} onOpenChange={setFicheGroupOpen}>
        <DialogContent size="7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Layers className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              {ficheGroup?.name ??
                groupList.find((x) => x.id === ficheGroupId)?.name ??
                "Fiche groupe"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="bg-transparent px-3 py-4 sm:px-5">
            {(() => {
              if (!ficheGroup) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
                  </div>
                );
              }
              const groupCompanies = allTreeCompanies.filter(c => c.groupId === ficheGroup.id);
              return (
                <Tabs value={ficheGroupTab} onValueChange={setFicheGroupTab} className="space-y-3">
                  <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1">
                    <TabsTrigger value="informations">Informations</TabsTrigger>
                    <TabsTrigger value="entreprises">Entreprises</TabsTrigger>
                    <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
                  </TabsList>
                  <TabsContent value="informations" className="mt-0">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">

                        <dt className="text-(--nebula-muted)">Début d&apos;exercice</dt>
                        <dd className="font-medium text-primary">
                          {formatMonthDayForDisplay(ficheGroup.fiscal_year_start)}
                        </dd>
                        {ficheGroup.country && (
                          <>
                            <dt className="text-(--nebula-muted)">Pays</dt>
                            <dd className="font-medium text-primary">
                              {ficheGroup.country}
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </TabsContent>
                  <TabsContent value="entreprises" className="mt-0">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                      <ul className="space-y-2">
                        {groupCompanies.map((company) => (
                          <li
                            key={company.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                            onClick={() => {
                              setFicheGroupOpen(false);
                              openFiche(company.id);
                            }}
                          >
                            <span className="font-medium text-primary">
                              {company.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-(--nebula-muted)">
                                {company.siret}
                              </span>
                              <span className="text-white/45">›</span>
                            </div>
                          </li>
                        ))}
                        {groupCompanies.length === 0 && (
                          <li className="py-4 text-center text-white/45">
                            Aucune entreprise dans ce groupe.
                          </li>
                        )}
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="donnees-extracomptables" className="mt-0">
                    <div className="space-y-6">
                      {ficheGroupDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
                        </div>
                      ) : (
                        <>
                          <EmpruntsSection
                            emprunts={ficheGroupEmprunts}
                            emptyMessage="Aucun emprunt enregistré pour ce groupe."
                            onLoanClick={handleLoanClick}
                          />
                          <ActifsSection
                            actifs={ficheGroupActifs}
                            emptyMessage="Aucun actif immobilisé enregistré pour ce groupe."
                            onAssetClick={handleAssetClick}
                          />
                          <DotationsSection
                            dotations={ficheGroupDotations}
                            emptyMessage="Aucune dotation aux amortissements enregistrée pour ce groupe."
                            onDotationClick={handleDotationClick}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              );
            })()}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheGroupOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiche BU Modal */}
      <Dialog open={ficheBUOpen} onOpenChange={setFicheBUOpen}>
        <DialogContent size="7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Briefcase className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              {ficheBU?.name || `BU ${ficheBU?.code ?? ""}` || "Fiche BU"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="bg-transparent px-3 py-4 sm:px-5">
            {(() => {
              if (!ficheBU) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
                  </div>
                );
              }
              return (
                <Tabs value={ficheBUTab} onValueChange={setFicheBUTab} className="space-y-3">
                  <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1">
                    <TabsTrigger value="informations">Informations</TabsTrigger>
                    <TabsTrigger value="donnees-extracomptables">Données extracomptables</TabsTrigger>
                  </TabsList>
                  <TabsContent value="informations" className="mt-0">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <dt className="text-(--nebula-muted)">Description</dt>
                        <dd className="font-medium text-primary sm:col-span-1">
                          {ficheBU.description || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Code</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.code || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">SIRET</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.siret || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Activité</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.activity || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Rue</dt>
                        <dd className="font-medium text-primary sm:col-span-1">
                          {ficheBU.street || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Code Postal</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.postal_code || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Ville</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.city || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Pays</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.country ? getCountryName(ficheBU.country) : "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Téléphone Fixe</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.phone_landline || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Téléphone Mobile</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.phone_mobile || "—"}
                        </dd>
                        <dt className="text-(--nebula-muted)">Email</dt>
                        <dd className="font-medium text-primary">
                          {ficheBU.contact_email || "—"}
                        </dd>
                        {ficheBU.company_id && (
                          <>
                            <dt className="text-(--nebula-muted)">Entreprise</dt>
                            <dd className="font-medium text-primary">
                              {allTreeCompanies.find(c => c.id === ficheBU.company_id)?.name || ficheBU.company_id}
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </TabsContent>
                  <TabsContent value="donnees-extracomptables" className="mt-0">
                    <div className="space-y-6">
                      {ficheBUDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
                        </div>
                      ) : (
                        <>
                          <EmpruntsSection
                            emprunts={ficheBUEmprunts}
                            emptyMessage="Aucun emprunt enregistré pour cette business unit."
                            onLoanClick={handleLoanClick}
                          />
                          <ActifsSection
                            actifs={ficheBUActifs}
                            emptyMessage="Aucun actif immobilisé enregistré pour cette business unit."
                            onAssetClick={handleAssetClick}
                          />
                          <DotationsSection
                            dotations={ficheBUDotations}
                            emptyMessage="Aucune dotation aux amortissements enregistrée pour cette business unit."
                            onDotationClick={handleDotationClick}
                          />

                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              );
            })()}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFicheBUOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Modal */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Folder className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              Nouveau Groupe
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Description
              </label>
              <Textarea
                value={addGroupForm.description}
                onChange={(e) =>
                  setAddGroupForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description du groupe"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Pays *
              </label>
              <button
                type="button"
                onClick={() => setAddGroupCountryModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <span className={addGroupForm.country ? "text-foreground" : "text-muted-foreground"}>
                  {addGroupForm.country ? getCountryName(addGroupForm.country) : "Sélectionner un pays..."}
                </span>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Rue
              </label>
              <Input
                value={addGroupForm.street}
                onChange={(e) =>
                  setAddGroupForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="123 rue de la République"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Code postal
                </label>
                <Input
                  value={addGroupForm.postal_code}
                  onChange={(e) =>
                    setAddGroupForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                  placeholder="75001"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Ville
                </label>
                <Input
                  value={addGroupForm.city}
                  onChange={(e) =>
                    setAddGroupForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="Paris"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Email
              </label>
              <Input
                type="email"
                value={addGroupForm.contact_email}
                onChange={(e) =>
                  setAddGroupForm((f) => ({ ...f, contact_email: e.target.value }))
                }
                placeholder="contact@groupe.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Téléphone mobile
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addGroupForm.phone_mobile}
                  onChange={(value) =>
                    handlePhoneChange(value || "", "addGroup", "phone_mobile")
                  }
                  className={
                    addGroupErrors.phone_mobile
                      ? "border-red-500"
                      : ""
                  }
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addGroupErrors.phone_mobile ? "border-red-500" : ""}`,
                  }}
                />
                {addGroupErrors.phone_mobile && (
                  <p className="mt-1 text-xs text-red-500">
                    {addGroupErrors.phone_mobile}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Téléphone fixe
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addGroupForm.phone_landline}
                  onChange={(value) =>
                    handlePhoneChange(value || "", "addGroup", "phone_landline")
                  }
                  className={
                    addGroupErrors.phone_landline
                      ? "border-red-500"
                      : ""
                  }
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addGroupErrors.phone_landline ? "border-red-500" : ""}`,
                  }}
                />
                {addGroupErrors.phone_landline && (
                  <p className="mt-1 text-xs text-red-500">
                    {addGroupErrors.phone_landline}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Dernier exercice clôturé
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

          </DialogBody>

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
                !addGroupForm.country.trim() ||
                !isValidMonthDay(toMonthDay(addGroupForm.fiscal_year_start))
              }
            >
              {addGroupLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Country Select Modal for Add Group */}
      <CountrySelectModal
        open={addGroupCountryModalOpen}
        onOpenChange={setAddGroupCountryModalOpen}
        value={addGroupForm.country}
        onChange={(value) => setAddGroupForm((f) => ({ ...f, country: value }))}
        title="Sélectionner un pays pour le groupe"
      />

      {/* Add BU Standalone Modal */}
      <Dialog open={addBUStandaloneOpen} onOpenChange={setAddBUStandaloneOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Package className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              Nouvelle Business Unit
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Code APE *
              </label>
              <button
                type="button"
                onClick={() => setAddBUStandaloneApeModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm hover:border-white/15 transition-colors"
              >
                <span className={addBUStandaloneForm.code ? "text-foreground" : "text-muted-foreground"}>
                  {addBUStandaloneForm.code ?
                    APE_CODES.find(code => code.value === addBUStandaloneForm.code)?.label || addBUStandaloneForm.code
                    : "Sélectionner un code APE"
                  }
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
                className="bg-white/5 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Pays *
              </label>
              <button
                type="button"
                onClick={() => setAddBUStandaloneCountryModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <span className={addBUStandaloneForm.country ? "text-foreground" : "text-muted-foreground"}>
                  {addBUStandaloneForm.country ?
                    (() => {
                      const country = COUNTRIES.find(c => c.value === addBUStandaloneForm.country || c.label === addBUStandaloneForm.country);
                      return country ? `${country.label} (${country.code})` : addBUStandaloneForm.country;
                    })()
                    : "Sélectionner un pays"
                  }
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Description
              </label>
              <textarea
                value={addBUStandaloneForm.description}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description de la Business Unit"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Adresse
              </label>
              <Input
                value={addBUStandaloneForm.street}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="Rue"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Code postal
              </label>
              <Input
                value={addBUStandaloneForm.postal_code}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({ ...f, postal_code: e.target.value }))
                }
                placeholder="Code postal"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Ville
              </label>
              <Input
                value={addBUStandaloneForm.city}
                onChange={(e) =>
                  setAddBUStandaloneForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Ville"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Contact
              </label>
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Téléphone mobile
                  </label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="FR"
                    value={addBUStandaloneForm.phone_mobile}
                    onChange={(value) =>
                      handlePhoneChange(value || "", "addBUStandalone", "phone_mobile")
                    }
                    className={
                      addBUStandaloneErrors?.phone_mobile
                        ? "border-red-500"
                        : ""
                    }
                    numberInputProps={{
                      className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addBUStandaloneErrors?.phone_mobile ? "border-red-500" : ""}`,
                    }}
                  />
                  {addBUStandaloneErrors?.phone_mobile && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUStandaloneErrors.phone_mobile}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Téléphone fixe
                  </label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="FR"
                    value={addBUStandaloneForm.phone_landline}
                    onChange={(value) =>
                      handlePhoneChange(value || "", "addBUStandalone", "phone_landline")
                    }
                    className={
                      addBUStandaloneErrors?.phone_landline
                        ? "border-red-500"
                        : ""
                    }
                    numberInputProps={{
                      className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addBUStandaloneErrors?.phone_landline ? "border-red-500" : ""}`,
                    }}
                  />
                  {addBUStandaloneErrors?.phone_landline && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUStandaloneErrors.phone_landline}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Email
                  </label>
                  <Input
                    value={addBUStandaloneForm.contact_email}
                    onChange={(e) =>
                      setAddBUStandaloneForm((f) => ({ ...f, contact_email: e.target.value }))
                    }
                    placeholder="Email"
                  />
                  {addBUStandaloneErrors?.contact_email && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUStandaloneErrors.contact_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </DialogBody>
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
        <DialogContent size="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Building2 className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              Ajouter une entreprise
            </DialogTitle>
          </DialogHeader>
          {addCompanyGroupId ? (
            <p className="text-sm text-(--nebula-muted)">
              Dans le groupe :{" "}
              <strong className="font-semibold text-white">
                {groupList.find((g) => g.id === addCompanyGroupId)?.name || "Groupe inconnu"}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-(--nebula-muted)">
              Si aucun groupe n'est sélectionné, l'entreprise sera créée comme indépendante
            </p>
          )}
          <DialogBody className="space-y-4">
            {/* Champ de sélection du groupe - seulement en mode standalone */}
            {!addCompanyGroupId && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Groupe
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
                >
                  <option value="">Sélectionner un groupe (optionnel)</option>
                  {groupList.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Description
              </label>
              <textarea
                value={addCompanyForm.description}
                onChange={(e) =>
                  setAddCompanyForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description de l'entreprise"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white placeholder:text-white/45"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Code APE *
                </label>
                <button
                  type="button"
                  onClick={() => setAddCompanyApeModalOpen(true)}
                  className="min-h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm hover:border-white/15 transition-colors"
                >
                  <span className={addCompanyForm.ape_code ? "text-foreground" : "text-muted-foreground"}>
                    {addCompanyForm.ape_code ?
                      APE_CODES.find(code => code.value === addCompanyForm.ape_code)?.label || addCompanyForm.ape_code
                      : "Sélectionner un code APE"
                    }
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Activité principale
              </label>
              <Input
                placeholder="Activité principale"
                value={addCompanyForm.main_activity}
                onChange={(e) => setAddCompanyForm((f) => ({ ...f, main_activity: e.target.value }))}
                readOnly
                className="bg-white/5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Adresse
              </label>
              <Input
                value={addCompanyForm.street}
                onChange={(e) =>
                  setAddCompanyForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="Rue et numéro"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Code postal
                </label>
                <Input
                  value={addCompanyForm.postal_code}
                  onChange={(e) =>
                    setAddCompanyForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                  placeholder="Code postal"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Ville
                </label>
                <Input
                  value={addCompanyForm.city}
                  onChange={(e) =>
                    setAddCompanyForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="Ville"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Pays *
              </label>
              <button
                type="button"
                onClick={() => setAddCompanyCountryModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm hover:border-white/15 transition-colors"
              >
                <span className={addCompanyForm.country ? "text-foreground" : "text-muted-foreground"}>
                  {addCompanyForm.country ? addCompanyForm.country : "Sélectionner un pays"}
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Téléphone mobile
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addCompanyForm.phone_mobile}
                  onChange={(value) =>
                    handlePhoneChange(value || "", 'addCompany', 'phone_mobile')
                  }
                  className={companyErrors?.phone_mobile ? "border-red-500" : ""}
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${companyErrors?.phone_mobile ? "border-red-500" : ""}`
                  }}
                />
                {companyErrors?.phone_mobile && (
                  <p className="mt-1 text-xs text-red-500">{companyErrors.phone_mobile}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Téléphone fixe
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addCompanyForm.phone_landline}
                  onChange={(value) =>
                    handlePhoneChange(value || "", 'addCompany', 'phone_landline')
                  }
                  className={companyErrors?.phone_landline ? "border-red-500" : ""}
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${companyErrors?.phone_landline ? "border-red-500" : ""}`
                  }}
                />
                {companyErrors?.phone_landline && (
                  <p className="mt-1 text-xs text-red-500">{companyErrors.phone_landline}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Email
              </label>
              <Input
                type="email"
                value={addCompanyForm.contact_email}
                onChange={(e) =>
                  setAddCompanyForm((f) => ({ ...f, contact_email: e.target.value }))
                }
                placeholder="email@exemple.com"
                className={companyErrors?.contact_email ? "border-red-500" : ""}
              />
              {companyErrors?.contact_email && (
                <p className="mt-1 text-xs text-red-500">{companyErrors.contact_email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Taille
                </label>
                <Select
                  value={addCompanyForm.size}
                  onValueChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, size: value }))
                  }
                >
                  <option value="SMALL">SMALL</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LARGE">LARGE</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Modèle
                </label>
                <Select
                  value={addCompanyForm.model}
                  onValueChange={(value) =>
                    setAddCompanyForm((f) => ({ ...f, model: value }))
                  }
                >
                  <option value="HOLDING">HOLDING</option>
                  <option value="SUBSIDIARY">SUBSIDIARY</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                  Dernier exercice clôturé
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
          </DialogBody>
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
                companyErrors?.phone_mobile ||
                companyErrors?.phone_landline
              }
            >
              {addCompanyLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add BU to Company Modal */}
      <Dialog open={addBUOpen} onOpenChange={setAddBUOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Package className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              Ajouter une Business Unit
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-(--nebula-muted)">
            Dans l&apos;entreprise :{" "}
            <strong className="font-semibold text-white">
              {allTreeCompanies.find((c) => c.id === addBUCompanyId)?.name}
            </strong>
          </p>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Code APE *
              </label>
              <button
                type="button"
                onClick={() => setAddBUApeModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm hover:border-white/15 transition-colors"
              >
                <span className={addBUForm.code ? "text-foreground" : "text-muted-foreground"}>
                  {addBUForm.code ?
                    APE_CODES.find(code => code.value === addBUForm.code)?.label || addBUForm.code
                    : "Sélectionner un code APE"
                  }
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Activité principale
              </label>
              <Input
                placeholder="Activité principale"
                value={addBUForm.activity}
                onChange={(e) => setAddBUForm((f) => ({ ...f, activity: e.target.value }))}
                readOnly
                className="bg-white/5 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Pays *
              </label>
              <button
                type="button"
                onClick={() => setAddBUCountryModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <span className={addBUForm.country ? "text-foreground" : "text-muted-foreground"}>
                  {addBUForm.country ?
                    (() => {
                      const country = COUNTRIES.find(c => c.value === addBUForm.country || c.label === addBUForm.country);
                      return country ? `${country.label} (${country.code})` : addBUForm.country;
                    })()
                    : "Sélectionner un pays"
                  }
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Description
              </label>
              <textarea
                value={addBUForm.description}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description de la Business Unit"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Rue
              </label>
              <Input
                value={addBUForm.street}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="Rue"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Code postal
              </label>
              <Input
                value={addBUForm.postal_code}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, postal_code: e.target.value }))
                }
                placeholder="Code postal"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Ville
              </label>
              <Input
                value={addBUForm.city}
                onChange={(e) =>
                  setAddBUForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Ville"
                className="mb-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
                Contact
              </label>
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Téléphone mobile
                  </label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="FR"
                    value={addBUForm.phone_mobile}
                    onChange={(value) =>
                      handlePhoneChange(value || "", "addBU", "phone_mobile")
                    }
                    className={
                      addBUErrors?.phone_mobile
                        ? "border-red-500"
                        : ""
                    }
                    numberInputProps={{
                      className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addBUErrors?.phone_mobile ? "border-red-500" : ""}`,
                    }}
                  />
                  {addBUErrors?.phone_mobile && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUErrors.phone_mobile}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Téléphone fixe
                  </label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="FR"
                    value={addBUForm.phone_landline}
                    onChange={(value) =>
                      handlePhoneChange(value || "", "addBU", "phone_landline")
                    }
                    className={
                      addBUErrors?.phone_landline
                        ? "border-red-500"
                        : ""
                    }
                    numberInputProps={{
                      className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${addBUErrors?.phone_landline ? "border-red-500" : ""}`,
                    }}
                  />
                  {addBUErrors?.phone_landline && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUErrors.phone_landline}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--nebula-muted)">
                    Email
                  </label>
                  <Input
                    value={addBUForm.contact_email}
                    onChange={(e) =>
                      setAddBUForm((f) => ({ ...f, contact_email: e.target.value }))
                    }
                    placeholder="Email"
                  />
                  {addBUErrors?.contact_email && (
                    <p className="mt-1 text-xs text-red-500">
                      {addBUErrors.contact_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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

          </DialogBody>
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
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Building2 className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
              Créer le workspace
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Nom *
              </label>
              <Input
                value={addworkspaceForm.name}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom du workspace"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
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
                placeholder="Description du workspace"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
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
                      className="object-cover rounded-lg border border-white/10"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Rue
              </label>
              <Input
                value={addworkspaceForm.street}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="Rue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Code postal
              </label>
              <Input
                value={addworkspaceForm.postal_code}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, postal_code: e.target.value }))
                }
                placeholder="Code postal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Ville
              </label>
              <Input
                value={addworkspaceForm.city}
                onChange={(e) =>
                  setAddworkspaceForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Ville"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Pays
              </label>
              <button
                type="button"
                onClick={() => setCreateCountryModalOpen(true)}
                className="min-h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm hover:border-white/15 transition-colors"
              >
                <span className={addworkspaceForm.country ? "text-foreground" : "text-muted-foreground"}>
                  {addworkspaceForm.country ?
                    (() => {
                      const country = COUNTRIES.find(c => c.value === addworkspaceForm.country || c.label === addworkspaceForm.country);
                      return country ? `${country.label} (${country.code})` : addworkspaceForm.country;
                    })()
                    : "Sélectionner un pays"
                  }
                </span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Email
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Téléphone mobile
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addworkspaceForm.phone_mobile}
                  onChange={(value) => handlePhoneChange(value || "", "addworkspace", "phone_mobile")}
                  className={workspaceErrors.phone_mobile ? "border-red-500" : ""}
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${workspaceErrors.phone_mobile ? "border-red-500" : ""}`
                  }}
                />
                {workspaceErrors.phone_mobile && (
                  <p className="text-xs text-red-500">{workspaceErrors.phone_mobile}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Téléphone fixe
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="FR"
                  value={addworkspaceForm.phone_landline}
                  onChange={(value) => handlePhoneChange(value || "", "addworkspace", "phone_landline")}
                  className={workspaceErrors.phone_landline ? "border-red-500" : ""}
                  numberInputProps={{
                    className: `flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${workspaceErrors.phone_landline ? "border-red-500" : ""}`
                  }}
                />
                {workspaceErrors.phone_landline && (
                  <p className="text-xs text-red-500">{workspaceErrors.phone_landline}</p>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddworkspaceOpen(false);
                setLogoFile(null);
                setLogoPreview("");
                setWorkspaceErrors({ contact_email: "", phone_mobile: "", phone_landline: "", });
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

      {/* Modal de sélection de pays */}
      <CountrySelectModal
        open={countryModalOpen}
        onOpenChange={setCountryModalOpen}
        value={editworkspace.country}
        onChange={(value) =>
          setEditworkspace((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays du workspace"
      />

      {/* Modal de sélection de pays pour la création */}
      <CountrySelectModal
        open={createCountryModalOpen}
        onOpenChange={setCreateCountryModalOpen}
        value={addworkspaceForm.country}
        onChange={(value) =>
          setAddworkspaceForm((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays du workspace"
      />

      {/* Modal de sélection de pays pour le groupe */}
      <CountrySelectModal
        open={groupCountryModalOpen}
        onOpenChange={setGroupCountryModalOpen}
        value={editGroup.country}
        onChange={(value) =>
          setEditGroup((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays du groupe"
      />

      {/* Modal de sélection de pays pour l'entreprise */}
      <CountrySelectModal
        open={companyCountryModalOpen}
        onOpenChange={setCompanyCountryModalOpen}
        value={editCompany.country}
        onChange={(value) =>
          setEditCompany((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays de l'entreprise"
      />

      {/* Modal de sélection de code APE pour l'entreprise */}
      <ApeCodeSelectModal
        open={companyApeModalOpen}
        onOpenChange={setCompanyApeModalOpen}
        value={editCompany.ape_code}
        onChange={(value) =>
          setEditCompany((f) => ({ ...f, ape_code: value }))
        }
        onDescriptionChange={(description) =>
          setEditCompany((f) => ({
            ...f,
            main_activity: description,
          }))
        }
        title="Sélectionner le code APE de l'entreprise"
      />

      {/* Modal de sélection de code APE pour la BU */}
      <ApeCodeSelectModal
        open={editBUApeModalOpen}
        onOpenChange={setEditBUApeModalOpen}
        value={editBU.code}
        onChange={(value) =>
          setEditBU((f) => ({ ...f, code: value }))
        }
        onDescriptionChange={(description) =>
          setEditBU((f) => ({
            ...f,
            activity: description,
          }))
        }
        title="Sélectionner le code APE de la BU"
      />

      {/* Modal de sélection de pays pour la BU */}
      <CountrySelectModal
        open={editBUCountryModalOpen}
        onOpenChange={setEditBUCountryModalOpen}
        value={editBU.country}
        onChange={(value) =>
          setEditBU((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays de la BU"
      />

      {/* Modal de sélection de pays pour la création de BU */}
      <CountrySelectModal
        open={addBUCountryModalOpen}
        onOpenChange={setAddBUCountryModalOpen}
        value={addBUForm.country}
        onChange={(value) =>
          setAddBUForm((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays de la BU"
      />

      {/* Modal de sélection de pays pour la création de BU standalone */}
      <CountrySelectModal
        open={addBUStandaloneCountryModalOpen}
        onOpenChange={setAddBUStandaloneCountryModalOpen}
        value={addBUStandaloneForm.country}
        onChange={(value) =>
          setAddBUStandaloneForm((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays de la BU"
      />

      {/* Modal de sélection de code APE pour la création de BU standalone */}
      <ApeCodeSelectModal
        open={addBUStandaloneApeModalOpen}
        onOpenChange={setAddBUStandaloneApeModalOpen}
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
        title="Sélectionner le code APE de la BU"
      />

      {/* Modal de sélection de code APE pour la création d'entreprise */}
      <ApeCodeSelectModal
        open={addCompanyApeModalOpen}
        onOpenChange={setAddCompanyApeModalOpen}
        value={addCompanyForm.ape_code}
        onChange={(value) =>
          setAddCompanyForm((f) => ({ ...f, ape_code: value }))
        }
        onDescriptionChange={(description) =>
          setAddCompanyForm((f) => ({ ...f, main_activity: description }))
        }
        title="Sélectionner le code APE de l'entreprise"
      />

      {/* Modal de sélection de code APE pour la création de BU */}
      <ApeCodeSelectModal
        open={addBUApeModalOpen}
        onOpenChange={setAddBUApeModalOpen}
        value={addBUForm.code}
        onChange={(value) => setAddBUForm((f) => ({ ...f, code: value }))}
        onDescriptionChange={(description) => setAddBUForm((f) => ({ ...f, activity: description }))}
        title="Sélectionner le code APE de la BU"
      />

      {/* Modal de sélection de pays pour la création d'entreprise */}
      <CountrySelectModal
        open={addCompanyCountryModalOpen}
        onOpenChange={setAddCompanyCountryModalOpen}
        value={addCompanyForm.country}
        onChange={(value) =>
          setAddCompanyForm((f) => ({ ...f, country: value }))
        }
        title="Sélectionner le pays de l'entreprise"
      />

    </AppLayout >
  );
}

function EmpruntsSection({
  emprunts,
  emptyMessage,
  onLoanClick,
}: {
  emprunts: Emprunt[];
  emptyMessage: string;
  onLoanClick: (loanId: string) => void;
}) {
  const total = emprunts.reduce((sum, e) => {
    const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  console.log('EmpruntsSection - emprunts:', emprunts);
  console.log('EmpruntsSection - calculated total:', total);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <TrendingDown className="h-4 w-4 text-red-600" />
        Emprunts
      </h3>
      {emprunts.length === 0 ? (
        <p className="py-4 text-center text-sm text-(--nebula-muted)">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-medium text-white/90">Total des emprunts</span>
            <span className="text-base font-semibold text-red-600">
              -{total.toLocaleString("fr-FR")} €
            </span>
          </div>
          <div className={`space-y-2 ${emprunts.length > 4 ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
            {emprunts.map((emprunt) => (
              <div
                key={emprunt.id}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">Emprunt</p>
                  {emprunt.description && (
                    <p className="mt-1 truncate text-sm text-(--nebula-muted)">{emprunt.description}</p>
                  )}
                  <p className="mt-1 text-xs text-(--nebula-muted)">
                    {new Date(emprunt.date).toLocaleDateString("fr-FR")}
                    {emprunt.duration_months && (
                      <span className="ml-2">• {emprunt.duration_months} mois</span>
                    )}
                    {emprunt.interest_rate && (
                      <span className="ml-2">• {emprunt.interest_rate}% d&apos;intérêt</span>
                    )}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-red-600">
                    -{emprunt.amount.toLocaleString("fr-FR")} €
                  </p>
                  <button
                    type="button"
                    onClick={() => onLoanClick(emprunt.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-(--nebula-gold-light)/30 bg-(--nebula-gold)/10 px-3 py-1.5 text-xs font-medium text-(--nebula-gold-light) transition-all duration-200 hover:bg-(--nebula-gold)/20 hover:border-(--nebula-gold-light)/50 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/50 focus:ring-offset-1 focus:ring-offset-black/50"
                    title="Voir les détails de cet emprunt"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Voir détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActifsSection({
  actifs,
  emptyMessage,
  onAssetClick,
}: {
  actifs: Asset[];
  emptyMessage: string;
  onAssetClick: (assetId: string) => void;
}) {
  const total = actifs.reduce((sum, a) => {
    const amount = typeof a.acquisitionAmount === 'string' ? parseFloat(a.acquisitionAmount) : a.acquisitionAmount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  console.log('ActifsSection - actifs:', actifs);
  console.log('ActifsSection - calculated total:', total);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <Package className="h-4 w-4 text-green-600" />
        Actifs - Mode Détaillé
      </h3>
      {actifs.length === 0 ? (
        <p className="py-4 text-center text-sm text-(--nebula-muted)">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-medium text-white/90">Total des actifs</span>
            <span className="text-base font-semibold text-green-600">
              {total.toLocaleString("fr-FR")} €
            </span>
          </div>
          <div className={`space-y-2 ${actifs.length > 4 ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
            {actifs.map((actif) => (
              <div
                key={actif.id}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{actif.name}</p>
                  {actif.description && (
                    <p className="mt-1 truncate text-sm text-(--nebula-muted)">{actif.description}</p>
                  )}
                  <p className="mt-1 text-xs text-(--nebula-muted)">
                    {new Date(actif.acquisitionDate).toLocaleDateString("fr-FR")}
                    <span className="ml-2">• {actif.amortizationDurationYears} ans</span>
                    <span className="ml-2">• {actif.amortizationType}</span>
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-green-600">
                    {actif.acquisitionAmount.toLocaleString("fr-FR")} €
                  </p>
                  <button
                    type="button"
                    onClick={() => onAssetClick(actif.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-(--nebula-gold-light)/30 bg-(--nebula-gold)/10 px-3 py-1.5 text-xs font-medium text-(--nebula-gold-light) transition-all duration-200 hover:bg-(--nebula-gold)/20 hover:border-(--nebula-gold-light)/50 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/50 focus:ring-offset-1 focus:ring-offset-black/50"
                    title="Voir les détails de cet actif"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Voir détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DotationsSection({
  dotations,
  emptyMessage,
  onDotationClick,
}: {
  dotations: GlobalDotation[];
  emptyMessage: string;
  onDotationClick: (dotationId: string) => void;
}) {
  const total = dotations.reduce((sum, d) => {
    const amount = typeof d.totalAnnualAmortization === 'string' ? parseFloat(d.totalAnnualAmortization) : d.totalAnnualAmortization;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  console.log('DotationsSection - dotations:', dotations);
  console.log('DotationsSection - calculated total:', total);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        Dotations Globales - Mode Simplifié
      </h3>
      {dotations.length === 0 ? (
        <p className="py-4 text-center text-sm text-(--nebula-muted)">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-medium text-white/90">Total des dotations</span>
            <span className="text-base font-semibold text-blue-600">
              {total.toLocaleString("fr-FR")} €
            </span>
          </div>
          <div className={`space-y-2 ${dotations.length > 4 ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
            {dotations.map((dotation) => (
              <div
                key={dotation.id}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">Dotation {dotation.year}</p>
                  {dotation.description && (
                    <p className="mt-1 truncate text-sm text-(--nebula-muted)">{dotation.description}</p>
                  )}
                  <p className="mt-1 text-xs text-(--nebula-muted)">
                    Mensuel: {dotation.monthlyAmortization.toLocaleString("fr-FR")} €
                    {dotation.isValidated && (
                      <span className="ml-2">• Validé</span>
                    )}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-blue-600">
                    {dotation.totalAnnualAmortization.toLocaleString("fr-FR")} €
                  </p>
                  <button
                    type="button"
                    onClick={() => onDotationClick(dotation.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-(--nebula-gold-light)/30 bg-(--nebula-gold)/10 px-3 py-1.5 text-xs font-medium text-(--nebula-gold-light) transition-all duration-200 hover:bg-(--nebula-gold)/20 hover:border-(--nebula-gold-light)/50 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/50 focus:ring-offset-1 focus:ring-offset-black/50"
                    title="Voir les détails de cette dotation"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Voir détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
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
