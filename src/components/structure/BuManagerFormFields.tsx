import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { BUManagerFormFields, BUManagerKindUi } from "@/types/business-unit";

export type BuUserOption = { id: string; label: string; secondary?: string };

type Props = {
  value: BUManagerFormFields;
  onChange: (next: BUManagerFormFields) => void;
  userOptions: BuUserOption[];
  disabled?: boolean;
};

export function BuManagerFormFields({ value, onChange, userOptions, disabled }: Props) {
  const setKind = (kind: BUManagerKindUi) => {
    onChange({
      ...value,
      managerKind: kind,
      ...(kind !== "USER" ? { manager_user_id: "" } : {}),
      ...(kind !== "EXTERNAL_PERSON"
        ? {
            manager_last_name: "",
            manager_first_name: "",
            manager_email: "",
            manager_phone: "",
          }
        : {}),
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)">
        Responsable
      </p>
      <div>
        <label className="mb-1 block text-xs text-(--nebula-muted)">Type</label>
        <Select
          value={value.managerKind}
          onValueChange={(v) => setKind(v as BUManagerKindUi)}
          disabled={disabled}
        >
          <option value="none">Aucun responsable</option>
          <option value="USER">Utilisateur plateforme</option>
          <option value="EXTERNAL_PERSON">Personne externe</option>
        </Select>
      </div>
      {value.managerKind === "USER" && (
        <div>
          <label className="mb-1 block text-xs text-(--nebula-muted)">Utilisateur *</label>
          <Select
            value={value.manager_user_id}
            onValueChange={(id) => onChange({ ...value, manager_user_id: id })}
            disabled={disabled}
          >
            <option value="">Sélectionner un utilisateur</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
                {u.secondary ? ` (${u.secondary})` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}
      {value.managerKind === "EXTERNAL_PERSON" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-(--nebula-muted)">Nom *</label>
            <Input
              value={value.manager_last_name}
              onChange={(e) => onChange({ ...value, manager_last_name: e.target.value })}
              disabled={disabled}
              placeholder="Nom"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-(--nebula-muted)">Prénom *</label>
            <Input
              value={value.manager_first_name}
              onChange={(e) => onChange({ ...value, manager_first_name: e.target.value })}
              disabled={disabled}
              placeholder="Prénom"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-(--nebula-muted)">Email</label>
            <Input
              type="email"
              value={value.manager_email}
              onChange={(e) => onChange({ ...value, manager_email: e.target.value })}
              disabled={disabled}
              placeholder="email@exemple.fr"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-(--nebula-muted)">Téléphone</label>
            <Input
              value={value.manager_phone}
              onChange={(e) => onChange({ ...value, manager_phone: e.target.value })}
              disabled={disabled}
              placeholder="+33…"
            />
          </div>
        </div>
      )}
    </div>
  );
}
