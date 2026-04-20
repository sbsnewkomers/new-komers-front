import { CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { ImportHistoryRow } from './types';
import type { ReactNode } from "react";

export function StatusBadge({ status }: { status: ImportHistoryRow["status"] }) {
<<<<<<< HEAD:src/pages/import/StatusBadge.tsx
  const map: Record<ImportHistoryRow["status"], {
    bg: string;
    text: string;
    icon: React.ReactElement;
    ring: string;
  }> = {
=======
  const map: Record<ImportHistoryRow["status"], { bg: string; text: string; icon: ReactNode; ring: string }> = {
>>>>>>> staging:src/features/import/StatusBadge.tsx
    Terminé: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      ring: "ring-emerald-200",
    },
    "En cours": {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <Clock className="h-3.5 w-3.5" />,
      ring: "ring-amber-200",
    },
    Échoué: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
      ring: "ring-red-200",
    },
    Annulé: {
      bg: "bg-slate-50",
<<<<<<< HEAD:src/pages/import/StatusBadge.tsx
      text: "text-slate-600",
      icon: <Ban className="h-3.5 w-3.5" />,
=======
      text: "text-slate-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
>>>>>>> staging:src/features/import/StatusBadge.tsx
      ring: "ring-slate-200",
    },
  };

  const s = map[status] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    icon: <XCircle className="h-3.5 w-3.5" />,
    ring: "ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      {s.icon}
      {status}
    </span>
  );
}