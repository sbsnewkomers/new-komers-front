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
      className={`group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) nebula-blob ${
        selected
          ? "border-white/20 bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10"
      } ${onSelect ? "cursor-pointer" : ""} ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-white/10 border border-white/15 text-white"
            >
              {global ? (
                <>
                  <Globe className="h-3 w-3 text-(--nebula-gold-light)" aria-hidden /> Global
                </>
              ) : (
                <>
                  <Building2 className="h-3 w-3 text-(--nebula-gold-light)" aria-hidden /> Workspace
                </>
              )}
            </span>
            {workspaceLabel ? (
              <span
                className="truncate rounded-full bg-white/10 border border-white/15 px-2 py-0.5 text-[11px] font-mono text-(--nebula-muted)"
                title={workspaceLabel}
              >
                {workspaceLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-white">
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
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light)"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-(--nebula-muted)">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" aria-hidden />
          <span className="font-medium text-white font-mono tabular-nums">
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
