import { CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { ImportHistoryRow } from './types';

export function StatusBadge({ status }: { status: ImportHistoryRow["status"] }) {
  const map: Record<ImportHistoryRow["status"], {
    bg: string;
    text: string;
    icon: React.ReactElement;
    ring: string;
  }> = {
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
      text: "text-slate-600",
      icon: <Ban className="h-3.5 w-3.5" />,
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