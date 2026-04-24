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
    ? "bg-emerald-500"
    : pct >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          ) : (
            <CircleDashed className="h-4 w-4 text-slate-400" aria-hidden />
          )}
          <span className="text-sm font-medium text-slate-900">
            Champs obligatoires
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {mappedRequired}/{totalRequired}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
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
      <p className="mt-2 text-xs text-slate-500">
        {totalMapped} champ{totalMapped > 1 ? "s" : ""} mappé
        {totalMapped > 1 ? "s" : ""} sur {totalFields}
      </p>
    </div>
  );
}
