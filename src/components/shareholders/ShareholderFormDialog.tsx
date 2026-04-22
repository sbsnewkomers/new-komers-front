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
import type { ShareholderOwnerType } from "@/lib/shareholdersApi";

type OwnerOption = { id: string; label: string; secondary?: string };
type CompanyOption = { id: string; name: string };

export type ShareholderFormValues = {
  id?: string;
  ownerType: ShareholderOwnerType;
  ownerId: string;
  percentage: number;
  companyIds: string[];
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
        className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300"
        onClick={() => setOpen(true)}
      >
        {icon}
        {selected ? (
          <span className="flex-1 truncate text-slate-900">
            {selected.label}
            {selected.secondary && (
              <span className="ml-1 text-slate-400">{selected.secondary}</span>
            )}
          </span>
        ) : (
          <span className="flex-1 truncate text-slate-400">{placeholder}</span>
        )}
        {value && (
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700"
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
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="sticky top-0 border-b border-slate-100 bg-white p-2">
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
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                o.id === value ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"
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
                  <span className="ml-1 text-slate-400">{o.secondary}</span>
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
  const [ownerType, setOwnerType] = useState<ShareholderOwnerType>(
    initial?.ownerType ?? "USER",
  );
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? "");
  const [percentage, setPercentage] = useState(
    initial?.percentage?.toString() ?? "",
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    initial?.companyIds ?? (lockedCompanyId ? [lockedCompanyId] : []),
  );
  const [companySearch, setCompanySearch] = useState("");

  useEffect(() => {
    if (open) {
      setOwnerType(initial?.ownerType ?? "USER");
      setOwnerId(initial?.ownerId ?? "");
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
  const isValid = ownerId && percentage && !Number.isNaN(Number(percentage));

  const handleSubmit = async () => {
    if (!isValid) return;
    await onSubmit({
      id: initial?.id,
      ownerType,
      ownerId,
      percentage: Number(percentage),
      companyIds: selectedCompanyIds,
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

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {title ?? (isEditing ? "Modifier l'actionnaire" : "Nouvel actionnaire")}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Owner type toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Type d&apos;actionnaire
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  ownerType === "USER"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => {
                  setOwnerType("USER");
                  setOwnerId("");
                }}
              >
                <Users className="h-4 w-4" />
                Personne
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  ownerType === "COMPANY"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => {
                  setOwnerType("COMPANY");
                  setOwnerId("");
                }}
              >
                <Building2 className="h-4 w-4" />
                Entreprise
              </button>
            </div>
          </div>

          {/* Owner searchable select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {ownerType === "USER" ? "Utilisateur" : "Entreprise actionnaire"}
            </label>
            <SearchableSelect
              options={ownerType === "USER" ? userAsOwnerOptions : companyAsOwnerOptions}
              value={ownerId}
              onChange={setOwnerId}
              placeholder={
                ownerType === "USER"
                  ? "Sélectionner un utilisateur..."
                  : "Sélectionner une entreprise..."
              }
              icon={
                ownerType === "USER" ? (
                  <Users className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                )
              }
            />
          </div>

          {/* Percentage */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
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

          {/* Linked companies */}
          {!lockedCompanyId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Entreprises liées
                {selectedCompanyIds.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
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
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
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
                      className={`flex w-full items-center gap-2.5 border-b border-slate-50 px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-slate-50 ${
                        checked ? "bg-slate-50/80" : ""
                      }`}
                      onClick={() => toggleCompany(c.id)}
                    >
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </div>
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className={checked ? "font-medium text-slate-900" : "text-slate-700"}>
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
