// pages/import/EntitySelector.tsx
import { Building, Users, Briefcase, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchStructureTree } from "@/lib/structureApi";
import { apiFetch } from "@/lib/apiClient";

interface Entity {
  id: string;
  name: string;
  last_closed_fiscal_year?: number | null;
}

interface BusinessUnit {
  id: string;
  name: string;
  code?: string;
}

interface EntitySelectorProps {
  selectedEntityId: string | null;
  selectedEntityType: 'Group' | 'Company' | 'BusinessUnit' | null;
  onEntityChange: (
    entityId: string,
    entityType: 'Group' | 'Company' | 'BusinessUnit',
    entity?: Entity | BusinessUnit,
  ) => void;
  disabled?: boolean;
  periodStart: string;
  periodEnd: string;
  onPeriodChange: (start: string, end: string) => void;
  hasData: boolean | null;
  onHasDataChange: (hasData: boolean | null) => void;
  includeDescendants: boolean;
  onIncludeDescendantsChange: (value: boolean) => void;
}

export function EntitySelector({
  selectedEntityId,
  selectedEntityType,
  onEntityChange,
  periodStart,
  periodEnd,
  onPeriodChange,
  hasData,
  onHasDataChange,
  disabled = false,
  includeDescendants,
  onIncludeDescendantsChange,
}: EntitySelectorProps) {
  const [groups, setGroups] = useState<Entity[]>([]);
  const [companies, setCompanies] = useState<Entity[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      setIsLoading(true);
      try {
        const tree = await fetchStructureTree();

        const allGroups: Entity[] = [];
        const allCompanies: Entity[] = [];
        const allBUs: BusinessUnit[] = [];

        const collectCompany = (company: { id: string; name: string; businessUnits?: Array<{ id: string; name: string; code?: string | null }> }) => {
          allCompanies.push({ id: company.id, name: company.name });
          for (const bu of company.businessUnits ?? []) {
            allBUs.push({ id: bu.id, name: bu.name, code: bu.code ?? undefined });
          }
        };

        if (tree.workspaces?.length) {
          for (const ws of tree.workspaces) {
            for (const group of ws.groups ?? []) {
              allGroups.push({ id: group.id, name: group.name });
              for (const company of group.companies ?? []) collectCompany(company);
            }
            for (const company of ws.standaloneCompanies ?? []) collectCompany(company);
          }
        }

        if (tree.groups?.length) {
          for (const group of tree.groups) {
            allGroups.push({ id: group.id, name: group.name });
            for (const company of group.companies ?? []) collectCompany(company);
          }
        }

        if (tree.standaloneCompanies?.length) {
          for (const company of tree.standaloneCompanies) collectCompany(company);
        }

        setGroups(Array.from(new Map(allGroups.map(g => [g.id, g])).values()));
        setCompanies(Array.from(new Map(allCompanies.map(c => [c.id, c])).values()));
        setBusinessUnits(Array.from(new Map(allBUs.map(bu => [bu.id, bu])).values()));
      } catch (error) {
        console.error("Erreur chargement entités:", error);
        setGroups([]);
        setCompanies([]);
        setBusinessUnits([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntities();
  }, []);

  const selectedLabel = () => {
    if (!selectedEntityId || !selectedEntityType) return null;
    if (selectedEntityType === 'Company') return companies.find(c => c.id === selectedEntityId)?.name;
    if (selectedEntityType === 'Group') return groups.find(g => g.id === selectedEntityId)?.name;
    if (selectedEntityType === 'BusinessUnit') {
      const bu = businessUnits.find(b => b.id === selectedEntityId);
      return bu ? bu.name : null;
    }
    return null;
  };

  const typeButtons = [
    {
      type: 'Group' as const,
      label: 'Groupe',
      icon: <Users className="h-4 w-4" />,
      extraDisabled: false,
    },
    {
      type: 'Company' as const,
      label: 'Entreprise',
      icon: <Building className="h-4 w-4" />,
      extraDisabled: false,
    },
    {
      type: 'BusinessUnit' as const,
      label: 'BU',
      icon: <Briefcase className="h-4 w-4" />,
      extraDisabled: businessUnits.length === 0,
    },
  ];

  return (
    <div className="nebula-glass rounded-3xl border border-white/10 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg border border-white/10 bg-white/10 p-1.5">
          <Building className="h-4 w-4 text-(--nebula-gold-light)" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          Sélectionner l&apos;entité cible
        </h3>
        {!selectedEntityId && (
          <span className="text-[10px] border border-amber-400/30 bg-amber-500/15 text-foreground px-2 py-0.5 rounded-full">
            Obligatoire
          </span>
        )}
        {disabled && (
          <span className="text-[10px] border border-white/10 bg-white/10 text-(--nebula-muted) px-2 py-0.5 rounded-full">
            Lecture seule
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type d'entité */}
        <div>
          <label className="block text-xs font-medium mb-1.5">
            Type d&apos;entité
          </label>
          <div className="flex gap-2">
            {typeButtons.map(({ type, label, icon, extraDisabled }) => {
              const isActive = selectedEntityType === type;
              const isDisabled = disabled || extraDisabled;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (isDisabled) return;
                    if (isActive) {
                      // Reclique sur le type actif → reset complet
                      onEntityChange('', type);
                      onHasDataChange(null);
                      onPeriodChange('', '');
                    } else {
                      onEntityChange('', type);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-(--nebula-muted)'
                      : isActive
                        ? 'bg-white/10 border-(--nebula-gold-light)/40 text-(--nebula-gold-light) font-medium ring-1 ring-(--nebula-gold-light)/25 cursor-pointer'
                        : 'bg-white/5 border-white/10 text-(--nebula-muted) hover:bg-white/10 hover:text-white cursor-pointer'
                    }`}
                >
                  {icon}
                  {label}
                  {isActive && (
                    <span className="ml-1 text-xs text-white/50">✕</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entité spécifique */}
        <div>
          <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
            {selectedEntityType === 'Company'
              ? 'Entreprise'
              : selectedEntityType === 'Group'
                ? 'Groupe'
                : selectedEntityType === 'BusinessUnit'
                  ? 'Business Unit'
                  : 'Entité'}
          </label>
          <select
            value={selectedEntityId || ''}
            onChange={async (e) => {
              const value = e.target.value;
              if (value && selectedEntityType && !disabled) {
                let selectedEntity: Entity | BusinessUnit | undefined;
                if (selectedEntityType === 'Company')
                  selectedEntity = companies.find(c => c.id === value);
                else if (selectedEntityType === 'Group')
                  selectedEntity = groups.find(g => g.id === value);
                else if (selectedEntityType === 'BusinessUnit')
                  selectedEntity = businessUnits.find(b => b.id === value);

                onEntityChange(value, selectedEntityType, selectedEntity);

                setIsCheckingData(true);
                onHasDataChange(null);
                onPeriodChange('', '');

                try {
                  const response = await apiFetch<{ hasData: boolean }>(
                    `/generic-import/entityType/${value}/has-data?entityType=${selectedEntityType}`,
                    { snackbar: { showSuccess: false, showError: false } }
                  );
                  onHasDataChange(response.hasData);
                } catch {
                  onHasDataChange(false);
                } finally {
                  setIsCheckingData(false);
                }
              }
            }}
            disabled={disabled || !selectedEntityType || isLoading}
            className={[
              "w-full px-3 py-2 text-[13px] rounded-xl transition-all",
              "nebula-glass border border-white/10 text-white",
              "hover:border-white/15 hover:bg-white/5",
              "focus-visible:outline-none",
              disabled || !selectedEntityType || isLoading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer",
            ].join(" ")}
          >
            <option value="" className="">
              {isLoading
                ? 'Chargement...'
                : !selectedEntityType
                  ? "Sélectionnez d'abord le type"
                  : selectedEntityType === 'Company'
                    ? 'Sélectionner une entreprise'
                    : selectedEntityType === 'Group'
                      ? 'Sélectionner un groupe'
                      : 'Sélectionner une BU'}
            </option>
            {selectedEntityType === 'Company' &&
              companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            {selectedEntityType === 'Group' &&
              groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            {selectedEntityType === 'BusinessUnit' &&
              businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.name}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Entité sélectionnée — message de confirmation */}
      {selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100 border border-emerald-400/25 bg-emerald-500/10 p-2 rounded-xl">
          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 p-0.5">
            <Building className="h-3 w-3 text-emerald-200" />
          </div>
          <span>
            Les données seront importées pour{' '}
            {selectedEntityType === 'Company'
              ? "l'entreprise"
              : selectedEntityType === 'Group'
                ? 'le groupe'
                : 'la BU'}{' '}
            <span className="font-semibold">{selectedLabel()}</span>
          </span>
        </div>
      )}

      {/* Checkbox includeDescendants — uniquement pour Group et Company */}
      {selectedEntityId && selectedEntityType && selectedEntityType !== 'BusinessUnit' && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <input
            type="checkbox"
            id="includeDescendants"
            checked={includeDescendants}
            onChange={(e) => onIncludeDescendantsChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-(--nebula-gold-light) focus:ring-(--nebula-gold-light)/30 cursor-pointer"
          />
          <label
            htmlFor="includeDescendants"
            className={`text-xs font-medium cursor-pointer select-none ${disabled ? 'text-(--nebula-muted)' : 'text-white'
              }`}
          >
            {selectedEntityType === 'Group'
              ? 'Importer aussi pour tous les descendants (Entreprises et Business Units du groupe)'
              : 'Importer aussi pour tous les descendants (Business Units de cette entreprise)'}
          </label>
        </div>
      )}

      {/* Avertissement + sélection de période si données existantes */}
      {selectedEntityId && selectedEntityType && hasData === true && (
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-2 text-xs text-amber-100 border border-amber-400/25 bg-amber-500/10 p-3 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-200" />
            <div>
              <p className="font-semibold text-white">Cette entité contient déjà des données comptables.</p>
              <p className="mt-0.5 text-amber-100/90">
                Sélectionnez la période à remplacer. Seules les écritures dans cette plage seront écrasées.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
                Début de période <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => onPeriodChange(e.target.value, periodEnd)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/40 focus:border-white/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
                Fin de période <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                min={periodStart}
                onChange={(e) => onPeriodChange(periodStart, e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/40 focus:border-white/20"
                required
              />
            </div>
          </div>

          {periodStart && periodEnd && periodEnd < periodStart && (
            <p className="text-xs text-rose-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              La date de fin doit être après la date de début.
            </p>
          )}
        </div>
      )}

      {/* Spinner vérification données */}
      {isCheckingData && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted)">
          <div className="h-3 w-3 border-2 border-white/20 border-t-(--nebula-gold-light) rounded-full animate-spin" />
          Vérification des données existantes...
        </div>
      )}

      {/* Message si type sélectionné mais pas d'entité */}
      {!selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-100 border border-amber-400/25 bg-amber-500/10 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>
            Veuillez sélectionner{' '}
            {selectedEntityType === 'Company'
              ? 'une entreprise'
              : selectedEntityType === 'Group'
                ? 'un groupe'
                : 'une business unit'}
          </span>
        </div>
      )}

      {/* Aucune entité accessible */}
      {!isLoading && groups.length === 0 && companies.length === 0 && businessUnits.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted) border border-white/10 bg-white/5 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>Aucune entité accessible dans votre périmètre.</span>
        </div>
      )}

      {/* Lecture seule END_USER */}
      {disabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted) border border-white/10 bg-white/5 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>Vous n&apos;avez pas les droits pour modifier la sélection.</span>
        </div>
      )}
    </div>
  );
}