import * as React from "react";
import { Globe, Trash2, Building2, Calendar, Layers } from "lucide-react";
import type { SavedMapping } from "../types";
import { isGlobalMapping, formatMappingDate } from "../MappingUtils";

export interface MappingCardProps {
  mapping: SavedMapping;
  onSelect?: (mapping: SavedMapping) => void;
  onDelete?: (mapping: SavedMapping) => void;
  canDelete?: boolean;
  selected?: boolean;
  workspaceLabel?: string;
  className?: string;
}

export function MappingCard({
  mapping,
  onSelect,
  onDelete,
  canDelete,
  selected,
  workspaceLabel,
  className,
}: MappingCardProps) {
  const global = isGlobalMapping(mapping);
  const mappedCount = Object.values(mapping.rules ?? {}).filter(
    (v) => v && v !== "",
  ).length;

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(mapping);
    }
  };

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(mapping) : undefined}
      onKeyDown={onSelect ? handleKey : undefined}
      aria-label={onSelect ? `Ouvrir le mapping ${mapping.name}` : undefined}
      aria-pressed={selected || undefined}
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      } ${onSelect ? "cursor-pointer" : ""} ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                global
                  ? "bg-violet-100 text-violet-700"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              {global ? (
                <>
                  <Globe className="h-3 w-3" aria-hidden /> Global
                </>
              ) : (
                <>
                  <Building2 className="h-3 w-3" aria-hidden /> Local
                </>
              )}
            </span>
            {workspaceLabel ? (
              <span
                className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                title={workspaceLabel}
              >
                {workspaceLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-slate-900">
            {mapping.name}
          </h3>
        </div>
        {canDelete && onDelete ? (
          <button
            type="button"
            aria-label={`Supprimer le mapping ${mapping.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(mapping);
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" aria-hidden />
          <span className="font-medium text-slate-700 tabular-nums">
            {mappedCount}
          </span>{" "}
          champ{mappedCount > 1 ? "s" : ""} mappé{mappedCount > 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <span>
            Modifié&nbsp;
            {formatMappingDate(mapping.updatedAt || mapping.createdAt)}
          </span>
        </span>
      </div>
    </div>
  );
}
