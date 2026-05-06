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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <DialogTitle className="text-emerald-700">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Badges résumé */}
          <div className="flex flex-wrap gap-2">
            {totalProcessed !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                <FileUp className="h-3.5 w-3.5" />
                {totalProcessed} ligne{totalProcessed > 1 ? "s" : ""} importée{totalProcessed > 1 ? "s" : ""}
              </span>
            )}
            {!!skippedLines && skippedLines > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                <SkipForward className="h-3.5 w-3.5" />
                {skippedLines} ligne{skippedLines > 1 ? "s" : ""} ignorée{skippedLines > 1 ? "s" : ""}
              </span>
            )}
            {!!newFiscalYearsCount && newFiscalYearsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                <Calendar className="h-3.5 w-3.5" />
                {newFiscalYearsCount} exercice{newFiscalYearsCount > 1 ? "s" : ""} créé{newFiscalYearsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {simpleMessage && !fiscalYears?.length && !dataImports?.length ? (
            <p className="text-sm text-slate-600 py-2">{simpleMessage}</p>
            ) : null}

          {/* Lignes par entité */}
          {dataImports && dataImports.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Lignes importées par entité
              </p>
              <div className="space-y-1.5">
                {dataImports.map((di, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800">
                        {di.entityName ?? "—"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {ENTITY_LABEL[di.entityType] ?? di.entityType}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">
                      {di.linesCount} ligne{di.linesCount > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          

          {/* Exercices fiscaux */}
          {fiscalYears && fiscalYears.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Exercices fiscaux
              </p>
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {fiscalYears.map((fy, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-800">
                          {fy.entityName ?? "—"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {ENTITY_LABEL[fy.entityType] ?? fy.entityType}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {fy.calendarYear}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-700">
                          {fy.linesCount} ligne{fy.linesCount > 1 ? "s" : ""}
                        </span>
                        {fy.isNew && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 ml-6 text-xs text-slate-400">
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