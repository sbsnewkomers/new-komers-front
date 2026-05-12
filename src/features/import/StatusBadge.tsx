import { CheckCircle2, XCircle, Clock, Ban, Archive, RotateCcw, AlertCircle,Loader2  } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ReactNode } from "react";

type StatusKey = 'active' | 'archived' | 'deleted' | 'failed' | 'processing';

const STATUS_MAP: Record<StatusKey, { variant: BadgeVariant; icon: ReactNode; label: string }> = {
  active: {
    variant: "success",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Actif",
  },
  archived: {
    variant: "neutral",
    icon: <Archive className="h-3.5 w-3.5" />,
    label: "Archivé",
  },
  deleted: {
    variant: "danger",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Supprimé",
  },
  failed: {
    variant: "warning",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Échoué",
  },
  processing: {
    variant: "info",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    label: "En cours",
  },
  
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusKey];
  return <Badge variant={s?.variant ?? "neutral"} size="md" icon={s?.icon}>{s?.label ?? status}</Badge>;
}