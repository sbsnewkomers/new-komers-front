// components/ui/Toast.tsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X, Building, Calendar, FileUp, SkipForward } from 'lucide-react';

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

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
  details?: {
    totalProcessed?: number;
    skippedLines?: number;
    newFiscalYearsCount?: number;
    fiscalYears?: FiscalYearDetail[];
    dataImports?: DataImportDetail[];
  };
}

const ENTITY_LABEL: Record<string, string> = {
  Group: 'Groupe',
  Company: 'Entreprise',
  BusinessUnit: 'Business Unit',
};

export function Toast({
  message,
  type = 'success',
  duration = 15000,
  onClose,
  details,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />,
  };

  const styles = {
    success: { wrapper: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', row: 'border-green-100', count: 'text-green-700' },
    error:   { wrapper: 'bg-red-50 border-red-200',     badge: 'bg-red-100 text-red-800',     row: 'border-red-100',   count: 'text-red-700'   },
    info:    { wrapper: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-800',   row: 'border-blue-100',  count: 'text-blue-700'  },
    warning: { wrapper: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', row: 'border-yellow-100', count: 'text-yellow-700' },
  };

  const s = styles[type];
  const hasDetails = details && (
    details.totalProcessed !== undefined ||
    (details.dataImports && details.dataImports.length > 0) ||
    (details.fiscalYears && details.fiscalYears.length > 0)
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className={`rounded-xl shadow-xl border p-4 w-[440px] max-w-[calc(100vw-2rem)] ${s.wrapper}`}>
        
        {/* Titre */}
        <div className="flex items-start gap-3">
          {icons[type]}
          <p className="flex-1 text-sm font-semibold text-gray-900">{message}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {hasDetails && (
          <div className="mt-3 ml-8 space-y-3">

            {/* Badges résumé */}
            <div className="flex flex-wrap gap-2">
              {details.totalProcessed !== undefined && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}>
                  <FileUp className="h-3 w-3" />
                  {details.totalProcessed} ligne{details.totalProcessed > 1 ? 's' : ''} importée{details.totalProcessed > 1 ? 's' : ''}
                </span>
              )}
              {!!details.skippedLines && details.skippedLines > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <SkipForward className="h-3 w-3" />
                  {details.skippedLines} ignorée{details.skippedLines > 1 ? 's' : ''}
                </span>
              )}
              {!!details.newFiscalYearsCount && details.newFiscalYearsCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <Calendar className="h-3 w-3" />
                  {details.newFiscalYearsCount} exercice{details.newFiscalYearsCount > 1 ? 's' : ''} créé{details.newFiscalYearsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Lignes par entité */}
            {details.dataImports && details.dataImports.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                  Lignes importées par entité
                </p>
                <div className="space-y-1">
                  {details.dataImports.map((di, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg bg-white border px-3 py-2 ${s.row}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {di.entityName ?? '—'}
                        </span>
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {ENTITY_LABEL[di.entityType] ?? di.entityType}
                        </span>
                      </div>
                      <span className={`shrink-0 ml-3 text-xs font-semibold ${s.count}`}>
                        {di.linesCount} ligne{di.linesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercices fiscaux */}
            {details.fiscalYears && details.fiscalYears.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                  Exercices fiscaux
                </p>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {details.fiscalYears.map((fy, i) => (
                    <div key={i} className={`rounded-lg bg-white border px-3 py-2 ${s.row}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {fy.entityName ?? '—'} — {fy.calendarYear}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={`text-xs font-semibold ${s.count}`}>
                            {fy.linesCount} ligne{fy.linesCount > 1 ? 's' : ''}
                          </span>
                          {fy.isNew && (
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 ml-5">
                        {fy.startDate} → {fy.endDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}