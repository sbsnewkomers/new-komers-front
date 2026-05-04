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

        const collectCompany = (company: any) => {
          allCompanies.push({ id: company.id, name: company.name });
          for (const bu of company.businessUnits ?? []) {
            allBUs.push({ id: bu.id, name: bu.name, code: bu.code });
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Building className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">
          Sélectionner l&apos;entité cible
        </h3>
        {!selectedEntityId && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Obligatoire
          </span>
        )}
        {disabled && (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            Lecture seule
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type d'entité */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Type d&apos;entité
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => !disabled && onEntityChange('', 'Group')}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  : selectedEntityType === 'Group'
                    ? 'bg-primary/10 border-primary text-primary font-medium ring-2 ring-primary/20 cursor-pointer'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <Users className="h-4 w-4" />
              Groupe
            </button>
            <button
              type="button"
              onClick={() => !disabled && onEntityChange('', 'Company')}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  : selectedEntityType === 'Company'
                    ? 'bg-primary/10 border-primary text-primary font-medium ring-2 ring-primary/20 cursor-pointer'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <Building className="h-4 w-4" />
              Entreprise
            </button>
            <button
              type="button"
              onClick={() => !disabled && onEntityChange('', 'BusinessUnit')}
              disabled={disabled || businessUnits.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                disabled || businessUnits.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  : selectedEntityType === 'BusinessUnit'
                    ? 'bg-primary/10 border-primary text-primary font-medium ring-2 ring-primary/20 cursor-pointer'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              BU
            </button>
          </div>
        </div>

        {/* Entité spécifique */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                // Vérifier si l'entité a des données
                setIsCheckingData(true);
                onHasDataChange(null);
                onPeriodChange("", ""); // reset période
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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              disabled || !selectedEntityType || isLoading
                ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'bg-white text-slate-700'
            }`}
          >
            <option value="">
              {isLoading
                ? "Chargement..."
                : !selectedEntityType
                  ? "Sélectionnez d'abord le type"
                  : selectedEntityType === 'Company'
                    ? 'Sélectionner une entreprise'
                    : selectedEntityType === 'Group'
                      ? 'Sélectionner un groupe'
                      : 'Sélectionner une BU'
              }
            </option>
            {selectedEntityType === 'Company' && companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {selectedEntityType === 'Group' && groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
            {selectedEntityType === 'BusinessUnit' && businessUnits.map(bu => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message de validation */}
      {selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
          <div className="rounded-full bg-emerald-100 p-0.5">
            <Building className="h-3 w-3 text-emerald-600" />
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
  <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
    <input
      type="checkbox"
      id="includeDescendants"
      checked={includeDescendants}
      onChange={(e) => onIncludeDescendantsChange(e.target.checked)}
      disabled={disabled}
      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
    />
    <label
      htmlFor="includeDescendants"
      className={`text-xs font-medium cursor-pointer select-none ${
        disabled ? 'text-slate-400' : 'text-slate-700'
      }`}
    >
      {selectedEntityType === 'Group'
        ? 'Importer aussi pour tous les descendants (Entreprises et Business Units du groupe)'
        : 'Importer aussi pour tous les descendants (Business Units de cette entreprise)'}
    </label>
  </div>
)}
      {/* Avertissement + sélection de période si l'entité a déjà des données */}
{selectedEntityId && selectedEntityType && hasData === true && (
  <div className="mt-3 space-y-3">
    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
      <div>
        <p className="font-semibold">Cette entité contient déjà des données comptables.</p>
        <p className="mt-0.5 text-amber-600">
          Sélectionnez la période à remplacer. Seules les écritures dans cette plage seront écrasées.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Début de période <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          value={periodStart}
          onChange={(e) => onPeriodChange(e.target.value, periodEnd)}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border-slate-300"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Fin de période <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          value={periodEnd}
          min={periodStart}
          onChange={(e) => onPeriodChange(periodStart, e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border-slate-300"
          required
        />
        </div>
      </div>

      {periodStart && periodEnd && periodEnd < periodStart && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          La date de fin doit être après la date de début.
        </p>
      )}
    </div>
  )}

  {/* Spinner pendant la vérification */}
  {isCheckingData && (
    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <div className="h-3 w-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      Vérification des données existantes...
    </div>
  )}

      {/* Message si entité non encore sélectionnée */}
      {!selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
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

      {/* Message si aucune entité accessible */}
      {!isLoading && groups.length === 0 && companies.length === 0 && businessUnits.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
          <AlertCircle className="h-3 w-3" />
          <span>Aucune entité accessible dans votre périmètre.</span>
        </div>
      )}

      {/* Message lecture seule pour END_USER */}
      {disabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
          <AlertCircle className="h-3 w-3" />
          <span>Vous n&apos;avez pas les droits pour modifier la sélection.</span>
        </div>
      )}
    </div>
  );
}