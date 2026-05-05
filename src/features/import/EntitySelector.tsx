// pages/import/EntitySelector.tsx
import { Building, Users, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchStructureTree } from "@/lib/structureApi";

interface Entity {
  id: string;
  name: string;
  last_closed_fiscal_year?: number | null;
}

interface EntitySelectorProps {
  selectedEntityId: string | null;
  selectedEntityType: 'Group' | 'Company' | null;
  onEntityChange: (
    entityId: string,
    entityType: 'Group' | 'Company',
    entity?: Entity,
  ) => void;
  disabled?: boolean;
}

export function EntitySelector({
  selectedEntityId,
  selectedEntityType,
  onEntityChange,
  disabled = false,
}: EntitySelectorProps) {
  const [groups, setGroups] = useState<Entity[]>([]);
  const [companies, setCompanies] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      setIsLoading(true);
      try {
        const tree = await fetchStructureTree();

        const allGroups: Entity[] = [];
        const allCompanies: Entity[] = [];

        if (tree.workspaces?.length) {
          for (const ws of tree.workspaces) {
            for (const group of ws.groups ?? []) {
              allGroups.push({ id: group.id, name: group.name });
              for (const company of group.companies ?? []) {
                allCompanies.push({ id: company.id, name: company.name });
              }
            }
            for (const company of ws.standaloneCompanies ?? []) {
              allCompanies.push({ id: company.id, name: company.name });
            }
          }
        }

        if (tree.groups?.length) {
          for (const group of tree.groups) {
            allGroups.push({ id: group.id, name: group.name });
            for (const company of group.companies ?? []) {
              allCompanies.push({ id: company.id, name: company.name });
            }
          }
        }

        if (tree.standaloneCompanies?.length) {
          for (const company of tree.standaloneCompanies) {
            allCompanies.push({ id: company.id, name: company.name });
          }
        }

        setGroups(Array.from(new Map(allGroups.map(g => [g.id, g])).values()));
        setCompanies(Array.from(new Map(allCompanies.map(c => [c.id, c])).values()));
      } catch (error) {
        console.error("Erreur chargement entités:", error);
        setGroups([]);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntities();
  }, []);

  return (
    <div className="nebula-glass rounded-xl border border-primary p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Building className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">
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
          <label className="block text-xs font-medium mb-1.5">
            Type d&apos;entité
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => !disabled && onEntityChange('', 'Company')}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-primary/10 border-primary text-primary'
                  : selectedEntityType === 'Company'
                    ? 'bg-primary/10 border-primary text-primary font-medium ring-2 ring-primary/20 cursor-pointer'
                    : 'nebula-glass border-primary text-primary hover:border-primary! hover:bg-primary/10 cursor-pointer'
              }`}
            >
              <Building className="h-4 w-4" />
              Entreprise
            </button>
            <button
              type="button"
              onClick={() => !disabled && onEntityChange('', 'Group')}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-primary/10 border-primary text-primary'
                  : selectedEntityType === 'Group'
                    ? 'bg-primary/10 border-primary text-primary font-medium ring-2 ring-primary/20 cursor-pointer'
                    : 'nebula-glass border-primary text-primary hover:border-primary! hover:bg-primary/10 cursor-pointer'
              }`}
            >
              <Users className="h-4 w-4" />
              Groupe
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
                : 'Entité'}
          </label>
          <select
            value={selectedEntityId || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value && selectedEntityType && !disabled) {
                const selectedEntity =
                  selectedEntityType === 'Company'
                    ? companies.find((company) => company.id === value)
                    : groups.find((group) => group.id === value);
                onEntityChange(value, selectedEntityType, selectedEntity);
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
                ? "Chargement..."
                : !selectedEntityType
                  ? "Sélectionnez d'abord le type"
                  : `Sélectionner ${selectedEntityType === 'Company' ? 'une entreprise' : 'un groupe'}`
              }
            </option>
            {selectedEntityType === 'Company' && companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {selectedEntityType === 'Group' && groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
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
            {selectedEntityType === 'Company' ? "l'entreprise" : 'le groupe'}{' '}
            <span className="font-semibold">
              {selectedEntityType === 'Company'
                ? companies.find(c => c.id === selectedEntityId)?.name
                : groups.find(g => g.id === selectedEntityId)?.name}
            </span>
          </span>
        </div>
      )}

      {/* Message si entité non encore sélectionnée */}
      {!selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-primary bg-primary/30 p-2 rounded-lg">
          <AlertCircle className="h-3 w-3" />
          <span>
            Veuillez sélectionner{' '}
            {selectedEntityType === 'Company' ? 'une entreprise' : 'un groupe'}
          </span>
        </div>
      )}

      {/* Message si aucune entité accessible */}
      {!isLoading && groups.length === 0 && companies.length === 0 && (
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