import { CheckCircle2, XCircle, Clock, Ban, Archive, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

type StatusKey = 'active' | 'archived' | 'deleted';

const STATUS_MAP: Record<StatusKey, { bg: string; text: string; icon: ReactNode; ring: string; label: string }> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    ring: "ring-emerald-200",
    label: "Actif",
  },
  archived: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    icon: <Archive className="h-3.5 w-3.5" />,
    ring: "ring-slate-200",
    label: "Archivé",
  },
  deleted: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
    ring: "ring-red-200",
    label: "Supprimé",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusKey] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    icon: <XCircle className="h-3.5 w-3.5" />,
    ring: "ring-slate-200",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}