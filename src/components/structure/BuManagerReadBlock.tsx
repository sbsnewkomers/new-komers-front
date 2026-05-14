import { Users } from "lucide-react";
import type { BusinessUnitApi } from "@/types/business-unit";
import { formatBuManagerDisplay } from "@/types/business-unit";

type Props = { bu: BusinessUnitApi };

export function BuManagerReadBlock({ bu }: Props) {
  const summary = formatBuManagerDisplay(bu);
  const hasManager = bu.manager_type === "USER" || bu.manager_type === "EXTERNAL_PERSON";

  if (!hasManager || !summary) {
    return (
      <p className="text-sm text-white/60">
        Aucun responsable renseigné pour cette unité.
      </p>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-(--nebula-gold-light)">
        <Users className="h-4 w-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-primary">{summary}</p>
        <p className="text-[11px] uppercase tracking-wide text-white/45">
          {bu.manager_type === "USER" ? "Utilisateur plateforme" : "Personne externe"}
        </p>
        {bu.manager_type === "EXTERNAL_PERSON" && bu.managerExternalPerson && (
          <dl className="mt-2 grid gap-1 text-xs text-(--nebula-muted) sm:grid-cols-2">
            {(() => {
              const ep = bu.managerExternalPerson as Record<string, unknown>;
              const email = String(ep.contact_email ?? ep.email ?? "").trim();
              const phone = String(ep.phone ?? "").trim();
              return (
                <>
                  {email ? (
                    <>
                      <dt>Email</dt>
                      <dd className="text-primary">{email}</dd>
                    </>
                  ) : null}
                  {phone ? (
                    <>
                      <dt>Téléphone</dt>
                      <dd className="text-primary">{phone}</dd>
                    </>
                  ) : null}
                </>
              );
            })()}
          </dl>
        )}
      </div>
    </div>
  );
}
