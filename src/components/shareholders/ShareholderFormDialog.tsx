"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, Building2, X, Check } from "lucide-react";
import type {
  ShareholderFormValues,
  ShareholderOwnerKind,
  ExternalPersonInput,
  ExternalCompanyInput,
} from "@/lib/shareholdersApi";

export type { ShareholderFormValues, ShareholderOwnerKind } from "@/lib/shareholdersApi";

type OwnerOption = { id: string; label: string; secondary?: string };
type CompanyOption = { id: string; name: string };

const emptyExternal: ExternalPersonInput = {
  lastName: "",
  firstName: "",
  address: "",
  email: "",
  phone: "",
};

const emptyExternalCompany: ExternalCompanyInput = {
  companyName: "",
  siret: "",
  email: "",
  phone: "",
  address: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ShareholderFormValues) => Promise<void>;
  saving?: boolean;
  initial?: Partial<ShareholderFormValues>;
  userOptions: OwnerOption[];
  companyOptions: CompanyOption[];
  /** When set, lock the linked companies to this single company (structure fiche mode). */
  lockedCompanyId?: string;
  title?: string;
};

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon,
}: {
  options: OwnerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.secondary ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative">
      <div
        className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-border"
        onClick={() => setOpen(true)}
      >
        {icon}
        {selected ? (
          <span className="flex-1 truncate text-foreground">
            {selected.label}
            {selected.secondary && (
              <span className="ml-1 text-muted-foreground">{selected.secondary}</span>
            )}
          </span>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
        )}
        {value && (
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          <div className="sticky top-0 border-b border-border bg-popover p-2">
            <Input
              autoFocus
              type="search"
              placeholder="Rechercher..."
              className="h-8 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              Aucun résultat
            </div>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${o.id === value ? "bg-muted font-medium text-foreground" : "text-foreground"
                }`}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="flex-1 truncate">
                {o.label}
                {o.secondary && (
                  <span className="ml-1 text-muted-foreground">{o.secondary}</span>
                )}
              </span>
              {o.id === value && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isPersonKind(k: ShareholderOwnerKind): boolean {
  return k === "USER_LINKED" || k === "USER_EXTERNAL";
}

function isCompanyKind(k: ShareholderOwnerKind): boolean {
  return k === "COMPANY_LINKED" || k === "COMPANY_EXTERNAL";
}

export function ShareholderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  saving = false,
  initial,
  userOptions,
  companyOptions,
  lockedCompanyId,
  title,
}: Props) {
  const [ownerKind, setOwnerKind] = useState<ShareholderOwnerKind>(
    initial?.ownerKind ?? "USER_LINKED",
  );
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? "");
  const [external, setExternal] = useState<ExternalPersonInput>(
    () => ({ ...emptyExternal, ...initial?.externalPerson }),
  );
  const [externalCompany, setExternalCompany] = useState<ExternalCompanyInput>(
    () => ({ ...emptyExternalCompany, ...initial?.externalCompany }),
  );
  const [percentage, setPercentage] = useState(
    initial?.percentage?.toString() ?? "",
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    initial?.companyIds ?? (lockedCompanyId ? [lockedCompanyId] : []),
  );
  const [companySearch, setCompanySearch] = useState("");

  useEffect(() => {
    if (open) {
      setOwnerKind(initial?.ownerKind ?? "USER_LINKED");
      setOwnerId(initial?.ownerId ?? "");
      setExternal({ ...emptyExternal, ...initial?.externalPerson });
      setExternalCompany({ ...emptyExternalCompany, ...initial?.externalCompany });
      setPercentage(initial?.percentage?.toString() ?? "");
      setSelectedCompanyIds(
        initial?.companyIds ?? (lockedCompanyId ? [lockedCompanyId] : []),
      );
      setCompanySearch("");
    }
  }, [open, initial, lockedCompanyId]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.toLowerCase();
    if (!q) return companyOptions;
    return companyOptions.filter((c) => c.name.toLowerCase().includes(q));
  }, [companyOptions, companySearch]);

  const toggleCompany = useCallback((id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isEditing = !!initial?.id;
  const pctNum = Number(percentage);
  const pctOk = percentage !== "" && !Number.isNaN(pctNum);
  const isValid = useMemo(() => {
    if (!pctOk) return false;
    switch (ownerKind) {
      case "USER_LINKED":
        return !!ownerId;
      case "USER_EXTERNAL":
        return (
          external.lastName.trim().length > 0 && external.firstName.trim().length > 0
        );
      case "COMPANY_LINKED":
        return !!ownerId;
      case "COMPANY_EXTERNAL":
        return externalCompany.companyName.trim().length > 0;
      default:
        return false;
    }
  }, [ownerKind, ownerId, external.lastName, external.firstName, externalCompany.companyName, pctOk]);

  const handleSubmit = async () => {
    if (!isValid) return;
    await onSubmit({
      id: initial?.id,
      ownerKind,
      ownerId,
      percentage: pctNum,
      companyIds: selectedCompanyIds,
      externalPerson: ownerKind === "USER_EXTERNAL" ? { ...external } : null,
      externalCompany: ownerKind === "COMPANY_EXTERNAL" ? { ...externalCompany } : null,
    });
  };

  const userAsOwnerOptions: OwnerOption[] = useMemo(
    () => userOptions.map((u) => ({ id: u.id, label: u.label, secondary: u.secondary })),
    [userOptions],
  );

  const companyAsOwnerOptions: OwnerOption[] = useMemo(
    () => companyOptions.map((c) => ({ id: c.id, label: c.name })),
    [companyOptions],
  );

  const personLinked = ownerKind === "USER_LINKED";
  const personExternal = ownerKind === "USER_EXTERNAL";
  const companyLinked = ownerKind === "COMPANY_LINKED";
  const companyExternal = ownerKind === "COMPANY_EXTERNAL";

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {title ?? (isEditing ? "Modifier l'actionnaire" : "Nouvel actionnaire")}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Type d&apos;actionnaire
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${isPersonKind(ownerKind)
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                onClick={() => {
                  setOwnerKind("USER_LINKED");
                  setOwnerId("");
                  setExternal({ ...emptyExternal });
                  setExternalCompany({ ...emptyExternalCompany });
                }}
              >
                <Users className="h-4 w-4" />
                Personne
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${isCompanyKind(ownerKind)
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                onClick={() => {
                  setOwnerKind("COMPANY_LINKED");
                  setOwnerId("");
                  setExternal({ ...emptyExternal });
                  setExternalCompany({ ...emptyExternalCompany });
                }}
              >
                <Building2 className="h-4 w-4" />
                Entreprise
              </button>
            </div>
            {isPersonKind(ownerKind) && (
              <p className="text-xs text-muted-foreground">
                Compte utilisateur de la plateforme ou saisie manuelle pour une personne externe.
              </p>
            )}
            {isCompanyKind(ownerKind) && (
              <p className="text-xs text-muted-foreground">
                Société présente dans la plateforme ou saisie d&apos;une entreprise externe.
              </p>
            )}
          </div>

          {isPersonKind(ownerKind) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Origine de la personne
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm ${personLinked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  onClick={() => {
                    setOwnerKind("USER_LINKED");
                    setExternal({ ...emptyExternal });
                  }}
                >
                  Utilisateur existant
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm ${personExternal
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  onClick={() => {
                    setOwnerKind("USER_EXTERNAL");
                    setOwnerId("");
                  }}
                >
                  Personne externe
                </button>
              </div>
            </div>
          )}

          {isCompanyKind(ownerKind) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Origine de l&apos;entreprise
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm ${companyLinked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  onClick={() => {
                    setOwnerKind("COMPANY_LINKED");
                    setExternalCompany({ ...emptyExternalCompany });
                  }}
                >
                  Entreprise plateforme
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm ${companyExternal
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  onClick={() => {
                    setOwnerKind("COMPANY_EXTERNAL");
                    setOwnerId("");
                  }}
                >
                  Entreprise externe
                </button>
              </div>
            </div>
          )}

          {personLinked && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Utilisateur
              </label>
              <SearchableSelect
                options={userAsOwnerOptions}
                value={ownerId}
                onChange={setOwnerId}
                placeholder="Sélectionner un utilisateur..."
                icon={<Users className="h-4 w-4 shrink-0 text-slate-400" />}
              />
            </div>
          )}

          {personExternal && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Nom et prénom obligatoires ; adresse, mail et téléphone optionnels.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={external.lastName}
                    onChange={(e) => setExternal((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Nom"
                    autoComplete="family-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={external.firstName}
                    onChange={(e) => setExternal((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Prénom"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Adresse</label>
                  <Input
                    value={external.address ?? ""}
                    onChange={(e) => setExternal((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Adresse"
                    autoComplete="street-address"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Mail</label>
                  <Input
                    type="email"
                    value={external.email ?? ""}
                    onChange={(e) => setExternal((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemple.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Téléphone</label>
                  <Input
                    type="tel"
                    value={external.phone ?? ""}
                    onChange={(e) => setExternal((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Téléphone"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          )}

          {companyLinked && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Entreprise actionnaire
              </label>
              <SearchableSelect
                options={companyAsOwnerOptions}
                value={ownerId}
                onChange={setOwnerId}
                placeholder="Sélectionner une entreprise..."
                icon={<Building2 className="h-4 w-4 shrink-0 text-slate-400" />}
              />
            </div>
          )}

          {companyExternal && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Raison sociale obligatoire ; SIRET, adresse, mail et téléphone optionnels.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Raison sociale <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={externalCompany.companyName}
                    onChange={(e) =>
                      setExternalCompany((p) => ({ ...p, companyName: e.target.value }))
                    }
                    placeholder="Nom de la société"
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">SIRET</label>
                  <Input
                    value={externalCompany.siret ?? ""}
                    onChange={(e) =>
                      setExternalCompany((p) => ({ ...p, siret: e.target.value }))
                    }
                    placeholder="14 chiffres"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Adresse</label>
                  <Input
                    value={externalCompany.address ?? ""}
                    onChange={(e) =>
                      setExternalCompany((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Adresse"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Mail</label>
                  <Input
                    type="email"
                    value={externalCompany.email ?? ""}
                    onChange={(e) =>
                      setExternalCompany((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Téléphone</label>
                  <Input
                    type="tel"
                    value={externalCompany.phone ?? ""}
                    onChange={(e) =>
                      setExternalCompany((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="Téléphone"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Pourcentage de détention
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-28"
                placeholder="0.00"
              />
              <span className="text-sm font-medium text-slate-500">%</span>
              {percentage && !Number.isNaN(Number(percentage)) && (
                <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, Number(percentage)))}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {!lockedCompanyId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Entreprises liées
                {selectedCompanyIds.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {selectedCompanyIds.length}
                  </span>
                )}
              </label>
              {companyOptions.length > 5 && (
                <Input
                  type="search"
                  placeholder="Filtrer les entreprises..."
                  className="h-8 text-sm"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                />
              )}
              <div className="max-h-40 overflow-auto rounded-lg border border-border bg-card">
                {filteredCompanies.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    Aucune entreprise disponible.
                  </div>
                )}
                {filteredCompanies.map((c) => {
                  const checked = selectedCompanyIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-muted ${checked ? "bg-muted" : ""
                        }`}
                      onClick={() => toggleCompany(c.id)}
                    >
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background"
                          }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </div>
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => !saving && onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="min-w-[120px] w-full sm:w-auto"
          >
            {saving
              ? "Enregistrement..."
              : isEditing
                ? "Enregistrer"
                : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
