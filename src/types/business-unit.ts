/** Aligné sur `BUManagerType` backend. */
export type BUManagerType = "USER" | "EXTERNAL_PERSON";

export type BUManagerKindUi = "none" | BUManagerType;

export type BUManagerUser = {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type BUManagerExternalPerson = {
  id?: string;
  last_name?: string;
  first_name?: string;
  contact_email?: string | null;
  phone?: string | null;
  lastName?: string;
  firstName?: string;
  email?: string;
};

/** Réponse API BU (relations incluses). */
export type BusinessUnitApi = {
  id: string;
  name: string;
  code: string;
  activity?: string;
  siret?: string;
  country?: string;
  logo?: string;
  company_id?: string;
  entity_code?: string | null;
  manager_type?: BUManagerType | null;
  manager_user_id?: string | null;
  manager_external_person_id?: string | null;
  managerUser?: BUManagerUser | null;
  managerExternalPerson?: BUManagerExternalPerson | null;
};

export type BUManagerFormFields = {
  managerKind: BUManagerKindUi;
  manager_user_id: string;
  manager_last_name: string;
  manager_first_name: string;
  manager_email: string;
  manager_phone: string;
};

export const defaultBUManagerFormFields = (): BUManagerFormFields => ({
  managerKind: "none",
  manager_user_id: "",
  manager_last_name: "",
  manager_first_name: "",
  manager_email: "",
  manager_phone: "",
});

export function mapApiBuToManagerFormFields(bu: Partial<BusinessUnitApi>): BUManagerFormFields {
  const base = defaultBUManagerFormFields();
  const mt = bu.manager_type ?? null;
  if (mt === "USER" && (bu.manager_user_id || bu.managerUser?.id)) {
    return {
      ...base,
      managerKind: "USER",
      manager_user_id: String(bu.manager_user_id ?? bu.managerUser?.id ?? ""),
    };
  }
  if (mt === "EXTERNAL_PERSON" && bu.managerExternalPerson) {
    const ep = bu.managerExternalPerson as Record<string, unknown>;
    const ln = String(ep.last_name ?? ep.lastName ?? "").trim();
    const fn = String(ep.first_name ?? ep.firstName ?? "").trim();
    const email = String(ep.contact_email ?? ep.email ?? "").trim();
    const phone = String(ep.phone ?? "").trim();
    return {
      ...base,
      managerKind: "EXTERNAL_PERSON",
      manager_last_name: ln,
      manager_first_name: fn,
      manager_email: email,
      manager_phone: phone,
    };
  }
  return base;
}

/** Libellé court pour fiche / liste. */
export function formatBuManagerDisplay(bu: Partial<BusinessUnitApi>): string {
  if (bu.manager_type === "USER" && bu.managerUser) {
    const u = bu.managerUser;
    const label = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    if (label && u.email) return `${label} (${u.email})`;
    if (u.email) return u.email;
    if (label) return label;
  }
  if (bu.manager_type === "EXTERNAL_PERSON" && bu.managerExternalPerson) {
    const ep = bu.managerExternalPerson as Record<string, unknown>;
    const fn = String(ep.first_name ?? ep.firstName ?? "").trim();
    const ln = String(ep.last_name ?? ep.lastName ?? "").trim();
    const name = `${fn} ${ln}`.trim();
    if (name) return name;
  }
  return "";
}

export function appendBuManagerToFormData(
  formData: FormData,
  m: BUManagerFormFields,
  opts: { mode: "create" | "update" },
): void {
  if (opts.mode === "update" && m.managerKind === "none") {
    formData.append("clear_manager", "true");
    return;
  }
  if (m.managerKind === "USER") {
    formData.append("manager_type", "USER");
    formData.append("manager_user_id", m.manager_user_id.trim());
    return;
  }
  if (m.managerKind === "EXTERNAL_PERSON") {
    formData.append("manager_type", "EXTERNAL_PERSON");
    formData.append("manager_last_name", m.manager_last_name.trim());
    formData.append("manager_first_name", m.manager_first_name.trim());
    if (m.manager_email.trim()) {
      formData.append("manager_email", m.manager_email.trim());
    }
    if (m.manager_phone.trim()) {
      formData.append("manager_phone", m.manager_phone.trim());
    }
  }
}

export function buildBuCreateManagerJson(
  m: BUManagerFormFields,
): Record<string, string> {
  if (m.managerKind === "USER") {
    return {
      manager_type: "USER",
      manager_user_id: m.manager_user_id.trim(),
    };
  }
  if (m.managerKind === "EXTERNAL_PERSON") {
    const o: Record<string, string> = {
      manager_type: "EXTERNAL_PERSON",
      manager_last_name: m.manager_last_name.trim(),
      manager_first_name: m.manager_first_name.trim(),
    };
    if (m.manager_email.trim()) o.manager_email = m.manager_email.trim();
    if (m.manager_phone.trim()) o.manager_phone = m.manager_phone.trim();
    return o;
  }
  return {};
}
