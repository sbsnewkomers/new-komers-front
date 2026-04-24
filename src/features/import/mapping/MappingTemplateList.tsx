import * as React from "react";
import { Search, Inbox, Loader2 } from "lucide-react";
import type { SavedMapping } from "../types";
import { isGlobalMapping } from "../MappingUtils";
import { MappingCard } from "./MappingCard";

export type ScopeFilter = "all" | "local" | "global";

export interface MappingTemplateListProps {
  mappings: SavedMapping[];
  loading?: boolean;
  onSelect?: (m: SavedMapping) => void;
  onDelete?: (m: SavedMapping) => void;
  canDelete?: (m: SavedMapping) => boolean;
  workspaceLabel?: (m: SavedMapping) => string | undefined;
  selectedId?: string;
  emptyMessage?: string;
  defaultScope?: ScopeFilter;
  showSearch?: boolean;
  showScopeFilter?: boolean;
  className?: string;
}

const CHIPS: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "local", label: "Locaux" },
  { id: "global", label: "Globaux" },
];

export function MappingTemplateList({
  mappings,
  loading,
  onSelect,
  onDelete,
  canDelete,
  workspaceLabel,
  selectedId,
  emptyMessage = "Aucun mapping enregistré.",
  defaultScope = "all",
  showSearch = true,
  showScopeFilter = true,
  className,
}: MappingTemplateListProps) {
  const [scope, setScope] = React.useState<ScopeFilter>(defaultScope);
  const [query, setQuery] = React.useState("");

  const counts = React.useMemo(() => {
    const local = mappings.filter((m) => !isGlobalMapping(m)).length;
    const global = mappings.filter((m) => isGlobalMapping(m)).length;
    return { all: mappings.length, local, global };
  }, [mappings]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return mappings.filter((m) => {
      if (scope === "local" && isGlobalMapping(m)) return false;
      if (scope === "global" && !isGlobalMapping(m)) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q);
    });
  }, [mappings, scope, query]);

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${className ?? ""}`}>
      {(showSearch || showScopeFilter) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showScopeFilter ? (
            <div
              role="tablist"
              aria-label="Filtrer par portée"
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1"
            >
              {CHIPS.map((chip) => {
                const active = scope === chip.id;
                const count = counts[chip.id];
                return (
                  <button
                    key={chip.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setScope(chip.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {chip.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                        active
                          ? "bg-slate-100 text-slate-700"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          {showSearch ? (
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un mapping…"
                aria-label="Rechercher un mapping"
                className="block h-9 w-full rounded-full border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
          <Inbox className="h-6 w-6 text-slate-400" aria-hidden />
          <p className="text-sm text-slate-600">
            {query.trim()
              ? `Aucun mapping pour « ${query.trim()} ».`
              : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MappingCard
              key={m.id}
              mapping={m}
              onSelect={onSelect}
              onDelete={onDelete}
              canDelete={canDelete ? canDelete(m) : false}
              selected={selectedId === m.id}
              workspaceLabel={workspaceLabel ? workspaceLabel(m) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
