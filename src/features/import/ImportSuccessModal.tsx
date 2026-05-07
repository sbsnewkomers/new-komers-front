// features/import/ImportSuccessModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Building, Calendar, FileUp, SkipForward } from "lucide-react";

interface FiscalYearDetail {
  entityName: string | null;
  entityType: string;
  calendarYear: number;
  startDate: string;
  endDate: string;
  isNew: boolean;
  linesCount: number;
}

interface DataImportDetail {
  entityName: string | null;
  entityType: string;
  linesCount: number;
}

interface ImportSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  totalProcessed?: number;
  skippedLines?: number;
  newFiscalYearsCount?: number;
  fiscalYears?: FiscalYearDetail[];
  dataImports?: DataImportDetail[];
  simpleMessage?: string | null;
}

const ENTITY_LABEL: Record<string, string> = {
  Group: "Groupe",
  Company: "Entreprise",
  BusinessUnit: "Business Unit",
};

export function ImportSuccessModal({
  open,
  onOpenChange,
  title,
  totalProcessed,
  skippedLines,
  newFiscalYearsCount,
  fiscalYears,
  dataImports,
  simpleMessage,
}: ImportSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <DialogTitle className="text-emerald-100">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {totalProcessed !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-100">
                <FileUp className="h-3.5 w-3.5" />
                {totalProcessed} ligne{totalProcessed > 1 ? "s" : ""} importée{totalProcessed > 1 ? "s" : ""}
              </span>
            )}
            {!!skippedLines && skippedLines > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-(--nebula-muted)">
                <SkipForward className="h-3.5 w-3.5" />
                {skippedLines} ligne{skippedLines > 1 ? "s" : ""} ignorée{skippedLines > 1 ? "s" : ""}
              </span>
            )}
            {!!newFiscalYearsCount && newFiscalYearsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-sm font-medium text-sky-100">
                <Calendar className="h-3.5 w-3.5" />
                {newFiscalYearsCount} exercice{newFiscalYearsCount > 1 ? "s" : ""} créé{newFiscalYearsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {simpleMessage && !fiscalYears?.length && !dataImports?.length ? (
            <p className="text-sm text-(--nebula-muted) py-2">{simpleMessage}</p>
          ) : null}

          {dataImports && dataImports.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--nebula-muted)">
                Lignes importées par entité
              </p>
              <div className="space-y-1.5">
                {dataImports.map((di, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-(--nebula-muted) shrink-0" />
                      <span className="text-sm font-medium text-white">
                        {di.entityName ?? "—"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-(--nebula-muted)">
                        {ENTITY_LABEL[di.entityType] ?? di.entityType}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-200">
                      {di.linesCount} ligne{di.linesCount > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fiscalYears && fiscalYears.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--nebula-muted)">
                Exercices fiscaux
              </p>
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {fiscalYears.map((fy, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-(--nebula-muted) shrink-0" />
                        <span className="text-sm font-medium text-white">
                          {fy.entityName ?? "—"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-(--nebula-muted)">
                          {ENTITY_LABEL[fy.entityType] ?? fy.entityType}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {fy.calendarYear}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-200">
                          {fy.linesCount} ligne{fy.linesCount > 1 ? "s" : ""}
                        </span>
                        {fy.isNew && (
                          <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 ml-6 text-xs text-(--nebula-muted)">
                      {fy.startDate} → {fy.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
