import { apiFetch } from "@/lib/apiClient";

/** Aligné sur `ShareholderOwnerType` backend (Ameliorations). */
export type ShareholderOwnerType =
  | "USER"
  | "COMPANY"
  | "EXTERNAL_PERSON"
  | "EXTERNAL_COMPANY";

/** Discriminant UI / formulaire → corps API. */
export type ShareholderOwnerKind =
  | "USER_LINKED"
  | "USER_EXTERNAL"
  | "COMPANY_LINKED"
  | "COMPANY_EXTERNAL";

/** Champs personne externe (formulaire camelCase). */
export type ExternalPersonInput = {
  lastName: string;
  firstName: string;
  address?: string;
  email?: string;
  phone?: string;
};

/** Champs société externe (formulaire camelCase). */
export type ExternalCompanyInput = {
  companyName: string;
  siret?: string;
  email?: string;
  phone?: string;
  address?: string;
};

/** Utilisateur plateforme (réponse API enrichie). */
export type ShareholderPlatformUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

/** Société plateforme (réponse API enrichie). */
export type ShareholderPlatformCompany = {
  id: string;
  name: string;
  siret?: string;
};

export type ShareholderCompanyLite = {
  id: string;
  name?: string;
};

export type ShareholderDto = {
  id: string;
  ownerType: ShareholderOwnerType;
  ownerId: string;
  percentage: number;
  companies?: ShareholderCompanyLite[];
  displayName?: string | null;
  platformUser?: ShareholderPlatformUser | null;
  platformCompany?: ShareholderPlatformCompany | null;
  externalPerson?: ExternalPersonInput | null;
  externalCompany?: ExternalCompanyInput | null;
};

export type ShareholderFormValues = {
  id?: string;
  ownerKind: ShareholderOwnerKind;
  ownerId: string;
  externalPerson?: ExternalPersonInput | null;
  externalCompany?: ExternalCompanyInput | null;
  percentage: number;
  companyIds: string[];
};

function trimPerson(e: ExternalPersonInput): ExternalPersonInput {
  return {
    lastName: e.lastName.trim(),
    firstName: e.firstName.trim(),
    ...(e.address?.trim() ? { address: e.address.trim() } : {}),
    ...(e.email?.trim() ? { email: e.email.trim() } : {}),
    ...(e.phone?.trim() ? { phone: e.phone.trim() } : {}),
  };
}

function trimCompany(e: ExternalCompanyInput): ExternalCompanyInput {
  const siretDigits = e.siret?.replace(/\D/g, "") ?? "";
  return {
    companyName: e.companyName.trim(),
    ...(siretDigits.length ? { siret: siretDigits } : {}),
    ...(e.email?.trim() ? { email: e.email.trim() } : {}),
    ...(e.phone?.trim() ? { phone: e.phone.trim() } : {}),
    ...(e.address?.trim() ? { address: e.address.trim() } : {}),
  };
}

/**
 * Corps JSON POST/PUT aligné sur `CreateShareholderDto` Nest (snake_case).
 */
export function toCreateShareholderInput(v: Omit<ShareholderFormValues, "id">): Record<string, unknown> {
  const base: Record<string, unknown> = {
    percentage: v.percentage,
    ...(v.companyIds?.length ? { companyIds: v.companyIds } : {}),
  };

  switch (v.ownerKind) {
    case "USER_LINKED":
      return { ...base, ownerType: "USER", ownerId: v.ownerId };
    case "COMPANY_LINKED":
      return { ...base, ownerType: "COMPANY", ownerId: v.ownerId };
    case "USER_EXTERNAL": {
      const e = trimPerson(v.externalPerson!);
      return {
        ...base,
        ownerType: "EXTERNAL_PERSON",
        last_name: e.lastName,
        first_name: e.firstName,
        ...(e.email ? { contact_email: e.email } : {}),
        ...(e.phone ? { phone: e.phone } : {}),
        ...(e.address ? { street: e.address } : {}),
      };
    }
    case "COMPANY_EXTERNAL": {
      const c = trimCompany(v.externalCompany!);
      return {
        ...base,
        ownerType: "EXTERNAL_COMPANY",
        company_name: c.companyName,
        ...(c.siret ? { siret: c.siret } : {}),
        ...(c.email ? { contact_email: c.email } : {}),
        ...(c.phone ? { phone: c.phone } : {}),
        ...(c.address ? { street: c.address } : {}),
      };
    }
  }
}

export function toUpdateShareholderInput(v: ShareholderFormValues): Record<string, unknown> {
  const { id: _id, ...rest } = v;
  void _id;
  return toCreateShareholderInput(rest);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/**
 * Normalise une ligne API (camelCase ou snake_case, clés imbriquées `external_person`, etc.)
 * pour que listes / formulaires lisent toujours `displayName`, `externalPerson`, `externalCompany`.
 */
export function normalizeShareholderDto(raw: unknown): ShareholderDto {
  const o = asRecord(raw) ?? {};
  const ownerType = String(o.ownerType ?? o.owner_type ?? "USER") as ShareholderOwnerType;
  const id = String(o.id ?? "");
  const ownerId = String(o.ownerId ?? o.owner_id ?? "");
  const percentage = Number(o.percentage ?? 0);
  const companies = Array.isArray(o.companies)
    ? (o.companies as unknown[]).map((c) => {
        const r = asRecord(c) ?? {};
        return { id: String(r.id ?? ""), name: (r.name as string | undefined) ?? undefined };
      })
    : undefined;

  const displayRaw = o.displayName ?? o.display_name;
  const displayName =
    typeof displayRaw === "string" && displayRaw.trim() ? displayRaw.trim() : undefined;

  const epRaw = o.externalPerson ?? o.external_person;
  const epR = asRecord(epRaw);
  let externalPerson: ExternalPersonInput | undefined;
  if (epR) {
    const fn = String(epR.firstName ?? epR.first_name ?? "").trim();
    const ln = String(epR.lastName ?? epR.last_name ?? "").trim();
    if (fn || ln) {
      externalPerson = {
        firstName: fn,
        lastName: ln,
        address: String(epR.address ?? epR.street ?? "").trim() || undefined,
        email: String(epR.email ?? epR.contact_email ?? "").trim() || undefined,
        phone: String(epR.phone ?? "").trim() || undefined,
      };
    }
  }

  const ecRaw = o.externalCompany ?? o.external_company;
  const ecR = asRecord(ecRaw);
  let externalCompany: ExternalCompanyInput | undefined;
  if (ecR) {
    const companyName = String(ecR.companyName ?? ecR.company_name ?? ecR.name ?? "").trim();
    if (companyName) {
      const siretRaw = String(ecR.siret ?? "").replace(/\D/g, "");
      externalCompany = {
        companyName,
        ...(siretRaw ? { siret: siretRaw } : {}),
        email: String(ecR.email ?? ecR.contact_email ?? "").trim() || undefined,
        phone: String(ecR.phone ?? "").trim() || undefined,
        address: String(ecR.address ?? ecR.street ?? "").trim() || undefined,
      };
    }
  }

  const puRaw = o.platformUser ?? o.platform_user;
  const puR = asRecord(puRaw);
  let platformUser: ShareholderPlatformUser | undefined;
  if (puR && (puR.id || puR.email)) {
    platformUser = {
      id: String(puR.id ?? ""),
      email: String(puR.email ?? ""),
      firstName: (puR.firstName ?? puR.first_name ?? null) as string | null,
      lastName: (puR.lastName ?? puR.last_name ?? null) as string | null,
    };
  }

  const pcRaw = o.platformCompany ?? o.platform_company;
  const pcR = asRecord(pcRaw);
  let platformCompany: ShareholderPlatformCompany | undefined;
  if (pcR && (pcR.id || pcR.name)) {
    const siretP = String(pcR.siret ?? "").replace(/\D/g, "");
    platformCompany = {
      id: String(pcR.id ?? ""),
      name: String(pcR.name ?? ""),
      ...(siretP ? { siret: siretP } : {}),
    };
  }

  const dto: ShareholderDto = {
    id,
    ownerType,
    ownerId,
    percentage,
    companies,
  };
  if (displayName) dto.displayName = displayName;
  if (externalPerson) dto.externalPerson = externalPerson;
  if (externalCompany) dto.externalCompany = externalCompany;
  if (platformUser) dto.platformUser = platformUser;
  if (platformCompany) dto.platformCompany = platformCompany;
  return dto;
}

/** Texte agrégé pour recherche (données API uniquement). */
export function getShareholderSearchText(s: ShareholderDto): string {
  const n = normalizeShareholderDto(s);
  const parts: string[] = [];
  if (n.displayName) parts.push(n.displayName);
  const pu = n.platformUser;
  if (pu) {
    parts.push(pu.email, pu.firstName ?? "", pu.lastName ?? "");
  }
  const pc = n.platformCompany;
  if (pc) {
    parts.push(pc.name, pc.siret ?? "");
  }
  const ep = n.externalPerson;
  if (ep) {
    parts.push(ep.firstName, ep.lastName, ep.email ?? "", ep.phone ?? "", ep.address ?? "");
  }
  const ec = n.externalCompany;
  if (ec) {
    parts.push(ec.companyName, ec.siret ?? "", ec.email ?? "", ec.phone ?? "", ec.address ?? "");
  }
  (n.companies ?? []).forEach((c) => {
    if (c.name) parts.push(c.name);
  });
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Libellé affichage : préfère les champs enrichis par l’API.
 * Les résolveurs optionnels servent de repli si l’API ne renvoie pas encore `platformUser` / `platformCompany`.
 */
export function getShareholderDisplayLabel(
  s: ShareholderDto,
  resolveUser?: (id: string) => string,
  resolveCompany?: (id: string) => string,
): string {
  const n = normalizeShareholderDto(s);
  if (n.displayName?.trim()) return n.displayName.trim();
  const pu = n.platformUser;
  if (pu) {
    const label = `${pu.firstName ?? ""} ${pu.lastName ?? ""}`.trim();
    if (label) return `${label} (${pu.email})`;
    if (pu.email) return pu.email;
  }
  const pc = n.platformCompany;
  if (pc?.name?.trim()) return pc.name.trim();
  if (n.externalPerson) {
    const { firstName, lastName } = n.externalPerson;
    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    if (name) return name;
  }
  if (n.externalCompany?.companyName?.trim()) return n.externalCompany.companyName.trim();
  if (n.ownerType === "EXTERNAL_PERSON") return "Personne externe";
  if (n.ownerType === "EXTERNAL_COMPANY") return "Entreprise externe";
  if (n.ownerType === "USER" && resolveUser) return resolveUser(n.ownerId);
  if (n.ownerType === "COMPANY" && resolveCompany) return resolveCompany(n.ownerId);
  return n.ownerId;
}

const defaultSnackbar = { showSuccess: true, showError: true };

export async function fetchShareholders(): Promise<ShareholderDto[]> {
  const raw = await apiFetch<unknown[]>("/shareholders", {
    snackbar: { ...defaultSnackbar, showSuccess: false },
  });
  return Array.isArray(raw) ? raw.map(normalizeShareholderDto) : [];
}

export async function fetchShareholdersByCompany(companyId: string): Promise<ShareholderDto[]> {
  const raw = await apiFetch<unknown[]>(`/shareholders/company/${companyId}`, {
    snackbar: { ...defaultSnackbar, showSuccess: false },
  });
  return Array.isArray(raw) ? raw.map(normalizeShareholderDto) : [];
}

export async function createShareholder(input: Record<string, unknown>): Promise<ShareholderDto> {
  const raw = await apiFetch<unknown>("/shareholders", {
    method: "POST",
    body: JSON.stringify(input),
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire créé." },
  });
  return normalizeShareholderDto(raw);
}

export async function updateShareholder(
  id: string,
  input: Record<string, unknown>,
): Promise<ShareholderDto> {
  const raw = await apiFetch<unknown>(`/shareholders/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire mis à jour." },
  });
  return normalizeShareholderDto(raw);
}

export async function deleteShareholder(id: string): Promise<void> {
  await apiFetch(`/shareholders/${id}`, {
    method: "DELETE",
    snackbar: { ...defaultSnackbar, successMessage: "Actionnaire supprimé." },
  });
}

export function ownerTypeLabel(t: ShareholderOwnerType): string {
  if (t === "USER") return "Personne (utilisateur)";
  if (t === "EXTERNAL_PERSON") return "Personne (externe)";
  if (t === "COMPANY") return "Entreprise";
  if (t === "EXTERNAL_COMPANY") return "Entreprise (externe)";
  return t;
}

export function shareholderKindLabel(s: ShareholderDto): string {
  return ownerTypeLabel(s.ownerType);
}
