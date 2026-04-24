import * as React from "react";
import { AlertCircle, CheckCircle2, ChevronDown, X } from "lucide-react";
import type { ColumnDefinition } from "../types";

export interface MappingFieldRowProps {
  field: ColumnDefinition;
  value?: string;
  sourceColumns: string[];
  usedColumns?: Set<string>;
  onChange?: (value: string) => void;
  disabled?: boolean;
  hint?: string;
}

export function MappingFieldRow({
  field,
  value,
  sourceColumns,
  usedColumns,
  onChange,
  disabled,
  hint,
}: MappingFieldRowProps) {
  const id = React.useId();
  const hasValue = Boolean(value && value.length > 0);
  const isRequired = field.required;
  const isMissing = isRequired && !hasValue;
  const isReadOnly = disabled || !onChange;

  const options = React.useMemo(() => {
    const list = sourceColumns.map((col) => {
      const alreadyUsed =
        usedColumns && usedColumns.has(col) && col !== value;
      return { value: col, label: col, conflicted: alreadyUsed };
    });
    return list;
  }, [sourceColumns, usedColumns, value]);

  return (
    <div
      className={`rounded-xl border px-3 py-3 transition-colors sm:px-4 ${
        isMissing
          ? "border-rose-200 bg-rose-50/40"
          : hasValue
            ? "border-emerald-200 bg-emerald-50/30"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <label
            htmlFor={id}
            className="truncate text-sm font-medium text-slate-900"
          >
            {field.name}
          </label>
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              isRequired
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isRequired ? "Requis" : "Facultatif"}
          </span>
          <span className="hidden rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex">
            {field.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasValue ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          ) : isMissing ? (
            <AlertCircle className="h-4 w-4 text-rose-600" aria-hidden />
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-stretch gap-2">
        <div className="relative flex-1">
          <select
            id={id}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={isReadOnly}
            aria-describedby={hint ? `${id}-hint` : undefined}
            aria-invalid={isMissing || undefined}
            className={`block h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-slate-900 shadow-xs transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
              isMissing
                ? "border-rose-300 focus-visible:ring-rose-300"
                : "border-slate-200 hover:border-slate-300 focus-visible:ring-primary/40"
            }`}
          >
            <option value="">— Non mappé —</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.conflicted}>
                {opt.label}
                {opt.conflicted ? " (déjà utilisée)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
        </div>
        {hasValue && !isReadOnly ? (
          <button
            type="button"
            aria-label={`Retirer le mappage pour ${field.name}`}
            onClick={() => onChange?.("")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
