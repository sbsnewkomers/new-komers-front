// features/import/EntitySelector.tsx
import { Building, Briefcase, AlertCircle, Layers, Unlink } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fetchStructureTree } from "@/lib/structureApi";
import { apiFetch } from "@/lib/apiClient";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

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
  selectedEntityType: 'Company' | 'BusinessUnit' | null;
  onEntityChange: (
    entityId: string,
    entityType: 'Company' | 'BusinessUnit',
    entity?: Entity | BusinessUnit,
  ) => void;
  disabled?: boolean;
  periodStart: string;
  periodEnd: string;
  onPeriodChange: (start: string, end: string) => void;
  hasData: boolean | null;
  onHasDataChange: (hasData: boolean | null) => void;
}

// ── Types internes ─────────────────────────────────────────────────────────────
interface GroupNode {
  id: string;
  name: string;
  workspaceId: string;
  companies: Entity[];
  bus: BusinessUnit[];
}

// ── Helper CSS ─────────────────────────────────────────────────────────────────
function selectClass(isDisabled: boolean) {
  return [
    'w-full px-3 py-2 text-[13px] rounded-xl transition-all',
    'nebula-glass border border-white/10 text-white',
    'hover:border-white/15 hover:bg-white/5',
    'focus-visible:outline-none',
    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
  ].join(' ');
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
}: EntitySelectorProps) {
  const { user } = usePermissionsContext();
  const isSuperAdminOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // ── Mode : groupe vs standalone ────────────────────────────────────────────
  const [mode, setMode] = useState<'group' | 'standalone'>('group');

  // ── Tree state ─────────────────────────────────────────────────────────────
  const [workspaces, setWorkspaces] = useState<Entity[]>([]);
  const [allGroups, setAllGroups] = useState<GroupNode[]>([]);
  // Standalone indexés par workspaceId ('' = hors workspace)
  const [standaloneByWorkspace, setStandaloneByWorkspace] = useState<
    Record<string, { companies: Entity[]; bus: BusinessUnit[] }>
  >({});

  // ── Cascade state (mode groupe) ────────────────────────────────────────────
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  // ── Dérivés de la cascade (mode groupe) ───────────────────────────────────
  const filteredGroups = allGroups.filter(
    g => !isSuperAdminOrAdmin || !selectedWorkspaceId || g.workspaceId === selectedWorkspaceId,
  );
  const selectedGroup = allGroups.find(g => g.id === selectedGroupId);
  const companies: Entity[] = selectedGroup?.companies ?? [];
  const businessUnits: BusinessUnit[] = selectedGroup?.bus ?? [];

  // ── Dérivés standalone filtrés par workspace (admins) ─────────────────────
  // Pour les admins : on utilise le workspace sélectionné comme clé.
  // Pour les autres rôles : clé '' (standalone globaux).
  const standaloneKey = isSuperAdminOrAdmin ? selectedWorkspaceId : '';
  const standaloneCompanies: Entity[] = standaloneByWorkspace[standaloneKey]?.companies ?? [];
  const standaloneBus: BusinessUnit[] = standaloneByWorkspace[standaloneKey]?.bus ?? [];

  // Un admin doit d'abord choisir un workspace avant d'accéder au mode standalone
  const standaloneAvailable = true;

  // ── Fetch de l'arbre ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const tree = await fetchStructureTree();

        if (isSuperAdminOrAdmin && tree.workspaces?.length) {
          setWorkspaces(tree.workspaces.map((ws: any) => ({ id: ws.id, name: ws.name })));
        }

        const groups: GroupNode[] = [];

        const collectGroup = (
          group: {
            id: string;
            name: string;
            companies?: Array<{
              id: string;
              name: string;
              businessUnits?: Array<{ id: string; name: string; code?: string | null }>;
            }>;
          },
          workspaceId: string,
        ) => {
          const cos: Entity[] = [];
          const bus: BusinessUnit[] = [];
          for (const company of group.companies ?? []) {
            cos.push({ id: company.id, name: company.name });
            for (const bu of company.businessUnits ?? []) {
              bus.push({ id: bu.id, name: bu.name, code: bu.code ?? undefined });
            }
          }
          groups.push({ id: group.id, name: group.name, workspaceId, companies: cos, bus });
        };

        for (const ws of tree.workspaces ?? []) {
          for (const group of ws.groups ?? []) collectGroup(group, ws.id);
        }
        for (const group of tree.groups ?? []) collectGroup(group, '');

        setAllGroups(groups);

        // ── Standalone : indexés par workspaceId ──────────────────────────────
        const byWs: Record<string, { companies: Entity[]; bus: BusinessUnit[] }> = {};

        const addToWs = (wsId: string, company: any) => {
          if (!byWs[wsId]) byWs[wsId] = { companies: [], bus: [] };
          byWs[wsId].companies.push({ id: company.id, name: company.name });
          for (const bu of company.businessUnits ?? []) {
            byWs[wsId].bus.push({ id: bu.id, name: bu.name, code: bu.code ?? undefined });
          }
        };

        for (const ws of tree.workspaces ?? []) {
          for (const company of ws.standaloneCompanies ?? []) addToWs(ws.id, company);
        }
        for (const company of tree.standaloneCompanies ?? []) addToWs('', company);

        setStandaloneByWorkspace(byWs);

      } catch (err) {
        console.error('Erreur chargement entités:', err);
        setWorkspaces([]);
        setAllGroups([]);
        setStandaloneByWorkspace({});
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isSuperAdminOrAdmin]);

  // ── Resets ─────────────────────────────────────────────────────────────────
  const resetAll = useCallback((keepWorkspace = false) => {
    setSelectedGroupId('');
    if (!keepWorkspace) setSelectedWorkspaceId('');
    onEntityChange('', selectedEntityType ?? 'Company');
    onHasDataChange(null);
    onPeriodChange('', '');
  }, [selectedEntityType, onEntityChange, onHasDataChange, onPeriodChange]);

  const resetFromWorkspace = useCallback(() => {
    setSelectedGroupId('');
    onEntityChange('', selectedEntityType ?? 'Company');
    onHasDataChange(null);
    onPeriodChange('', '');
  }, [selectedEntityType, onEntityChange, onHasDataChange, onPeriodChange]);

  const resetFromGroup = useCallback(() => {
    onEntityChange('', selectedEntityType ?? 'Company');
    onHasDataChange(null);
    onPeriodChange('', '');
  }, [selectedEntityType, onEntityChange, onHasDataChange, onPeriodChange]);

  const resetFromType = useCallback(() => {
    onEntityChange('', selectedEntityType ?? 'Company');
    onHasDataChange(null);
    onPeriodChange('', '');
  }, [selectedEntityType, onEntityChange, onHasDataChange, onPeriodChange]);

  // ── Sélection d'une entité avec vérification hasData ──────────────────────
  const handleEntitySelect = useCallback(async (
    value: string,
    entityType: 'Company' | 'BusinessUnit',
    entityList: Entity[] | BusinessUnit[],
  ) => {
    if (!value || disabled) return;
    const entity = (entityList as Array<Entity | BusinessUnit>).find(e => e.id === value);
    onEntityChange(value, entityType, entity);
    setIsCheckingData(true);
    onHasDataChange(null);
    onPeriodChange('', '');

    try {
      const response = await apiFetch<{ hasData: boolean }>(
        `/generic-import/entityType/${value}/has-data?entityType=${entityType}`,
        { snackbar: { showSuccess: false, showError: false } },
      );
      onHasDataChange(response.hasData);
    } catch {
      onHasDataChange(false);
    } finally {
      setIsCheckingData(false);
    }
  }, [disabled, onEntityChange, onHasDataChange, onPeriodChange]);

  // ── Label de l'entité sélectionnée ────────────────────────────────────────
  const selectedLabel = () => {
    if (!selectedEntityId || !selectedEntityType) return null;
    if (mode === 'standalone') {
      if (selectedEntityType === 'Company')
        return standaloneCompanies.find(c => c.id === selectedEntityId)?.name ?? null;
      return standaloneBus.find(b => b.id === selectedEntityId)?.name ?? null;
    }
    if (selectedEntityType === 'Company')
      return companies.find(c => c.id === selectedEntityId)?.name ?? null;
    return businessUnits.find(b => b.id === selectedEntityId)?.name ?? null;
  };

  // ── Grille (mode groupe) ───────────────────────────────────────────────────
  const gridCols = isSuperAdminOrAdmin
    ? 'grid-cols-1 md:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="nebula-glass rounded-3xl border border-white/10 p-4 mb-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
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

      {/* ── Toggle mode ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            if (mode !== 'group') {
              setMode('group');
              resetAll(true);
            }
          }}
          disabled={disabled}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all',
            mode === 'group'
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
              : 'border-white/10 bg-white/5 text-(--nebula-muted) hover:bg-white/10',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          <Layers className="h-3 w-3" />
          Avec groupe
        </button>

        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            if (mode !== 'standalone') {
              setMode('standalone');
              resetAll(true);
    
            }
          }}
          disabled={disabled}
          title={!standaloneAvailable ? 'Sélectionnez d\'abord un workspace' : undefined}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all',
            mode === 'standalone'
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
              : 'border-white/10 bg-white/5 text-(--nebula-muted) hover:bg-white/10',
            disabled || !standaloneAvailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          <Unlink className="h-3 w-3" />
          Entreprise indépendante
        </button>
      </div>

      {/* ── Selects ───────────────────────────────────────────────────────── */}
      {mode === 'group' ? (
        /* ── Mode GROUPE : cascade complète ──────────────────────────────── */
        <div className={`grid gap-4 ${gridCols}`}>

          {/* 1. Workspace — admins uniquement */}
          {isSuperAdminOrAdmin && (
            <div>
              <label className="block text-xs font-medium mb-1.5">Workspace</label>
              <select
                value={selectedWorkspaceId}
                onChange={e => {
                  setSelectedWorkspaceId(e.target.value);
                  resetFromWorkspace();
                }}
                disabled={disabled || isLoading}
                className={selectClass(disabled || isLoading)}
              >
                <option value="">
                  {isLoading ? 'Chargement...' : 'Sélectionner un workspace'}
                </option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Groupe */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Groupe</label>
            <select
              value={selectedGroupId}
              onChange={e => {
                setSelectedGroupId(e.target.value);
                resetFromGroup();
              }}
              disabled={disabled || isLoading || (isSuperAdminOrAdmin && !selectedWorkspaceId)}
              className={selectClass(disabled || isLoading || (isSuperAdminOrAdmin && !selectedWorkspaceId))}
            >
              <option value="">
                {isLoading
                  ? 'Chargement...'
                  : isSuperAdminOrAdmin && !selectedWorkspaceId
                    ? "Sélectionnez d'abord un workspace"
                    : 'Sélectionner un groupe'}
              </option>
              {filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Type d'entité */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Type d&apos;entité</label>
            <select
              value={selectedEntityType || ''}
              onChange={e => {
                const value = e.target.value as 'Company' | 'BusinessUnit';
                if (value && !disabled && selectedGroupId) {
                  resetFromType();
                  onEntityChange('', value);
                }
              }}
              disabled={disabled || !selectedGroupId || isLoading}
              className={selectClass(disabled || !selectedGroupId || isLoading)}
            >
              <option value="">
                {!selectedGroupId ? "Sélectionnez d'abord un groupe" : 'Sélectionner un type'}
              </option>
              <option value="Company">Entreprise</option>
              <option value="BusinessUnit" disabled={businessUnits.length === 0}>
                Business Unit{businessUnits.length === 0 ? ' (aucune)' : ''}
              </option>
            </select>
          </div>

          {/* 4. Entité cible */}
          <div>
            <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
              {selectedEntityType === 'Company'
                ? 'Entreprise'
                : selectedEntityType === 'BusinessUnit'
                  ? 'Business Unit'
                  : 'Entité'}
            </label>
            <select
              value={selectedEntityId || ''}
              onChange={e => handleEntitySelect(
                e.target.value,
                selectedEntityType!,
                selectedEntityType === 'Company' ? companies : businessUnits,
              )}
              disabled={disabled || !selectedEntityType || !selectedGroupId || isLoading}
              className={selectClass(disabled || !selectedEntityType || !selectedGroupId || isLoading)}
            >
              <option value="">
                {!selectedGroupId
                  ? "Sélectionnez d'abord un groupe"
                  : !selectedEntityType
                    ? "Sélectionnez d'abord le type"
                    : selectedEntityType === 'Company'
                      ? 'Sélectionner une entreprise'
                      : 'Sélectionner une BU'}
              </option>
              {selectedEntityType === 'Company' &&
                companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {selectedEntityType === 'BusinessUnit' &&
                businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
        </div>
      ) : (
        /* ── Mode STANDALONE : workspace (admins) + type + entité ──────────── */
        <div className="space-y-4">

          {/* Workspace — admins uniquement, requis avant tout */}
          {isSuperAdminOrAdmin && (
            <div>
              <label className="block text-xs font-medium mb-1.5">Workspace</label>
              <select
                value={selectedWorkspaceId}
                onChange={e => {
                  setSelectedWorkspaceId(e.target.value);
                  resetFromWorkspace();
                }}
                disabled={disabled || isLoading}
                className={selectClass(disabled || isLoading)}
              >
                <option value="">
                  {isLoading ? 'Chargement...' : 'Sélectionner un workspace'}
                </option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">

          {/* 1. Type d'entité */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Type d&apos;entité</label>
            <select
              value={selectedEntityType || ''}
              onChange={e => {
                const value = e.target.value as 'Company' | 'BusinessUnit';
                if (!disabled) {
                  onEntityChange('', value);
                  onHasDataChange(null);
                  onPeriodChange('', '');
                }
              }}
              disabled={disabled || isLoading || !standaloneAvailable}
              className={selectClass(disabled || isLoading || !standaloneAvailable)}
            >
              <option value="">
                {isLoading ? 'Chargement...' : !standaloneAvailable ? "Sélectionnez d'abord un workspace" : 'Sélectionner un type'}
              </option>
              <option value="Company">Entreprise</option>
              <option value="BusinessUnit" disabled={standaloneBus.length === 0}>
                Business Unit{standaloneBus.length === 0 ? ' (aucune)' : ''}
              </option>
            </select>
          </div>

          {/* 2. Entité */}
          <div>
            <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
              {selectedEntityType === 'BusinessUnit' ? 'Business Unit' : 'Entreprise'}
            </label>
            <select
              value={selectedEntityId || ''}
              onChange={e => handleEntitySelect(
                e.target.value,
                selectedEntityType ?? 'Company',
                selectedEntityType === 'BusinessUnit' ? standaloneBus : standaloneCompanies,
              )}
              disabled={disabled || !selectedEntityType || isLoading || !standaloneAvailable}
              className={selectClass(disabled || !selectedEntityType || isLoading || !standaloneAvailable)}
            >
              <option value="">
                {isLoading
                  ? 'Chargement...'
                  : !selectedEntityType
                    ? "Sélectionnez d'abord le type"
                    : selectedEntityType === 'Company'
                      ? 'Sélectionner une entreprise'
                      : 'Sélectionner une BU'}
              </option>
              {selectedEntityType === 'Company' &&
                standaloneCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              {selectedEntityType === 'BusinessUnit' &&
                standaloneBus.map(bu => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
            </select>
          </div>
          </div>
        </div>
      )}

      {/* ── Confirmation entité sélectionnée ──────────────────────────────── */}
      {selectedEntityId && selectedEntityType && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-900 border border-emerald-400 bg-emerald-100 p-2 rounded-xl">
          <div className="rounded-full bg-white dark:bg-emerald-500/10 border border-emerald-400 p-1.5">
            <Building className="h-4 w-4 text-emerald-400 dark:text-black" />
          </div>
          <span>
            Les données seront importées pour{' '}
            {selectedEntityType === 'Company' ? "l'entreprise" : 'la BU'}{' '}
            <span className="font-semibold text-emerald-800">{selectedLabel()}</span>
          </span>
        </div>
      )}

      {/* ── Période de remplacement ───────────────────────────────────────── */}
      {selectedEntityId && selectedEntityType && hasData === true && (
        <div className="mt-3 space-y-3">
          <div
            className="flex items-start gap-2 text-xs p-3 rounded-xl border dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30"
            style={{
              backgroundColor: 'rgb(254, 243, 199)',
              color: 'rgb(120, 53, 15)',
              borderColor: 'rgb(251, 191, 36)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'rgb(180, 83, 9)' }} />
            <div className="space-y-1">
              <p className="font-medium">Cette entité contient déjà des données comptables.</p>
              <p>
                <span className="font-semibold">Sans période sélectionnée&nbsp;:</span>{' '}
                toutes les données existantes de cette entité seront remplacées par le contenu du nouveau fichier.
              </p>
              <p>
                <span className="font-semibold">Avec une période sélectionnée&nbsp;:</span>{' '}
                seules les écritures comprises entre les deux dates seront remplacées. Le reste sera conservé.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
                Début de période{' '}
                <span className="italic font-normal">(optionnel)</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={e => onPeriodChange(e.target.value, periodEnd)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/40 focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-(--nebula-muted) mb-1.5">
                Fin de période{' '}
                <span className="italic font-normal">(optionnel)</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                min={periodStart}
                onChange={e => onPeriodChange(periodStart, e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-(--nebula-gold-light)/40 focus:border-white/20"
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

      {/* ── Spinner vérification données ──────────────────────────────────── */}
      {isCheckingData && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted)">
          <div className="h-3 w-3 border-2 border-white/20 border-t-(--nebula-gold-light) rounded-full animate-spin" />
          Vérification des données existantes...
        </div>
      )}

      {/* ── Type sélectionné mais pas encore d'entité ─────────────────────── */}
      {!selectedEntityId && selectedEntityType && (mode === 'group' ? !!selectedGroupId : true) && (
        <div
          className="mt-3 flex items-center gap-2 text-xs p-2 rounded-xl border"
          style={{
            backgroundColor: 'rgb(254, 243, 199)',
            color: 'rgb(120, 53, 15)',
            borderColor: 'rgb(251, 191, 36)',
          }}
        >
          <AlertCircle className="h-3 w-3" style={{ color: 'rgb(180, 83, 9)' }} />
          <span>
            Veuillez sélectionner{' '}
            {selectedEntityType === 'Company' ? 'une entreprise' : 'une business unit'}
          </span>
        </div>
      )}

      {/* ── Aucune entité standalone accessible ───────────────────────────── */}
      {mode === 'standalone' && !isLoading && standaloneAvailable && standaloneCompanies.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted) border border-white/10 bg-white/5 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>Aucune entreprise indépendante dans ce workspace.</span>
        </div>
      )}

      {/* ── Aucune entité groupe accessible ───────────────────────────────── */}
      {mode === 'group' && !isLoading && allGroups.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted) border border-white/10 bg-white/5 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>Aucune entité accessible dans votre périmètre.</span>
        </div>
      )}

      {/* ── Lecture seule END_USER ────────────────────────────────────────── */}
      {disabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--nebula-muted) border border-white/10 bg-white/5 p-2 rounded-xl">
          <AlertCircle className="h-3 w-3" />
          <span>Vous n&apos;avez pas les droits pour modifier la sélection.</span>
        </div>
      )}
    </div>
  );
}