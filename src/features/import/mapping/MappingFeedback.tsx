import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";

export interface MappingFeedbackProps {
  tone: Tone;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const TONE_STYLES: Record<
  Tone,
  {
    container: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    titleColor: string;
    messageColor: string;
    live: "polite" | "assertive";
  }
> = {
  success: {
    container: "nebula-glass border border-white/10",
    icon: CheckCircle2,
    iconColor: "text-(--nebula-gold-light)",
    titleColor: "text-white",
    messageColor: "text-(--nebula-muted)",
    live: "polite",
  },
  error: {
    container: "nebula-glass border border-white/15",
    icon: AlertCircle,
    iconColor: "text-(--nebula-gold)",
    titleColor: "text-white",
    messageColor: "text-(--nebula-muted)",
    live: "assertive",
  },
  info: {
    container: "nebula-glass border border-white/10",
    icon: Info,
    iconColor: "text-(--nebula-gold-light)",
    titleColor: "text-white",
    messageColor: "text-(--nebula-muted)",
    live: "polite",
  },
};

export function MappingFeedback({
  tone,
  title,
  message,
  onDismiss,
  className,
}: MappingFeedbackProps) {
  const style = TONE_STYLES[tone];
  const Icon = style.icon;
  return (
    <div
      role="alert"
      aria-live={style.live}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${style.container} ${className ?? ""}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className={`text-sm font-medium ${style.titleColor}`}>{title}</p>
        ) : null}
        <p
          className={`${title ? "mt-0.5" : ""} text-sm leading-relaxed ${style.messageColor}`}
        >
          {message}
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Masquer"
          onClick={onDismiss}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) ${style.iconColor}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
