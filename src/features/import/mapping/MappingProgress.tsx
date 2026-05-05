import * as React from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

export interface MappingProgressProps {
  mappedRequired: number;
  totalRequired: number;
  totalMapped: number;
  totalFields: number;
  className?: string;
}

export function MappingProgress({
  mappedRequired,
  totalRequired,
  totalMapped,
  totalFields,
  className,
}: MappingProgressProps) {
  const pct = totalRequired === 0 ? 100 : Math.round((mappedRequired / totalRequired) * 100);
  const isComplete = mappedRequired === totalRequired;
  const barColor = isComplete
    ? "bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold)"
    : "bg-linear-to-r from-(--nebula-gold-deep) to-(--nebula-gold)";

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 nebula-blob ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-(--nebula-gold-light)" aria-hidden />
          ) : (
            <CircleDashed className="h-4 w-4 text-white/50" aria-hidden />
          )}
          <span className="text-sm font-medium text-white">
            Champs obligatoires
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white tabular-nums">
            {mappedRequired}/{totalRequired}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
              isComplete
                ? "bg-white/10 border-white/15 text-white"
                : "bg-white/5 border-white/10 text-(--nebula-muted)"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression des champs obligatoires"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 motion-reduce:transition-none ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-(--nebula-muted)">
        {totalMapped} champ{totalMapped > 1 ? "s" : ""} mappé
        {totalMapped > 1 ? "s" : ""} sur {totalFields}
      </p>
    </div>
  );
}
