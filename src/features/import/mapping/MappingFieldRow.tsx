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
      className={`rounded-2xl border px-3 py-3 transition-colors sm:px-4 nebula-blob ${
        isMissing
          ? "border-white/20 bg-white/10"
          : hasValue
            ? "border-white/15 bg-white/5"
            : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <label
            htmlFor={id}
            className="truncate text-sm font-medium text-white"
          >
            {field.name}
          </label>
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] border ${
              isRequired
                ? "bg-white/10 border-white/15 text-white"
                : "bg-white/5 border-white/10 text-(--nebula-muted)"
            }`}
          >
            {isRequired ? "Requis" : "Facultatif"}
          </span>
          <span className="hidden rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-(--nebula-muted) sm:inline-flex">
            {field.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasValue ? (
            <CheckCircle2 className="h-4 w-4 text-(--nebula-gold-light)" aria-hidden />
          ) : isMissing ? (
            <AlertCircle className="h-4 w-4 text-(--nebula-gold)" aria-hidden />
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
            className={`block h-10 w-full appearance-none rounded-xl border bg-white/5 px-3 pr-9 text-[13px] text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) disabled:cursor-not-allowed disabled:opacity-50 ${
              isMissing
                ? "border-white/20"
                : "border-white/10 hover:border-white/15"
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
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
            aria-hidden
          />
        </div>
        {hasValue && !isReadOnly ? (
          <button
            type="button"
            aria-label={`Retirer le mappage pour ${field.name}`}
            onClick={() => onChange?.("")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light)"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-(--nebula-muted)">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
