import * as React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Building2, Globe, Loader2, Save } from "lucide-react";

export type Scope = "LOCAL" | "GLOBAL";

export interface SaveMappingDialogWorkspace {
  id: string;
  name: string;
}

export interface SaveMappingDialogValue {
  name: string;
  scope: Scope;
  workspaceId: string | null;
}

export interface SaveMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultName?: string;
  defaultScope?: Scope;
  defaultWorkspaceId?: string | null;
  /** When true shows the scope selector (admin-only flow). */
  allowScopeSelection?: boolean;
  /** When true shows the workspace selector. */
  needsWorkspace?: boolean;
  workspaces?: SaveMappingDialogWorkspace[];
  isLoadingWorkspaces?: boolean;
  isSaving?: boolean;
  onConfirm: (value: SaveMappingDialogValue) => void | Promise<void>;
}

export function SaveMappingDialog({
  open,
  onOpenChange,
  title = "Enregistrer le mapping",
  description = "Donnez un nom à votre mapping et choisissez où il sera disponible.",
  submitLabel = "Enregistrer",
  defaultName = "",
  defaultScope = "LOCAL",
  defaultWorkspaceId = null,
  allowScopeSelection = false,
  needsWorkspace = false,
  workspaces = [],
  isLoadingWorkspaces,
  isSaving,
  onConfirm,
}: SaveMappingDialogProps) {
  const [name, setName] = React.useState(defaultName);
  const [scope, setScope] = React.useState<Scope>(defaultScope);
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(
    defaultWorkspaceId,
  );

  // Reset state by remounting dialog content when reopened.
  // (This repo enforces no setState inside effects.)

  const nameId = React.useId();
  const wsId = React.useId();
  const scopeGroupId = React.useId();

  const workspaceRequired =
    needsWorkspace && scope === "LOCAL";
  const canSubmit =
    name.trim().length > 0 &&
    !isSaving &&
    (!workspaceRequired || Boolean(workspaceId));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm({
      name: name.trim(),
      scope,
      workspaceId: scope === "LOCAL" ? workspaceId : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        key={[
          open ? "open" : "closed",
          defaultName,
          defaultScope,
          defaultWorkspaceId ?? "",
        ].join("|")}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-(--nebula-gold-light)">
              <Save className="h-4 w-4" aria-hidden />
            </span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 bg-transparent">
          <div>
            <label
              htmlFor={nameId}
              className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
            >
              § Nom du mapping <span className="text-(--nebula-gold-light)">*</span>
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit();
              }}
              placeholder="Ex. Mapping fournisseur A"
              className="mt-2 block h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] text-white placeholder:text-(--nebula-muted) focus-visible:outline-none"
            />
          </div>

          {allowScopeSelection ? (
            <fieldset>
              <legend
                id={scopeGroupId}
                className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
              >
                § Portée
              </legend>
              <div
                role="radiogroup"
                aria-labelledby={scopeGroupId}
                className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                <ScopeRadio
                  checked={scope === "LOCAL"}
                  onChange={() => setScope("LOCAL")}
                  icon={<Building2 className="h-4 w-4" aria-hidden />}
                  label="Workspace"
                  description="Disponible dans un seul workspace."
                />
                <ScopeRadio
                  checked={scope === "GLOBAL"}
                  onChange={() => setScope("GLOBAL")}
                  icon={<Globe className="h-4 w-4" aria-hidden />}
                  label="Global"
                  description="Partagé avec toute la plateforme."
                />
              </div>
            </fieldset>
          ) : null}

          {workspaceRequired ? (
            <div>
              <label
                htmlFor={wsId}
                className="block text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)"
              >
                § Workspace <span className="text-(--nebula-gold-light)">*</span>
              </label>
              {isLoadingWorkspaces ? (
                <div className="mt-2 flex items-center gap-2 text-[13px] text-(--nebula-muted)">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Chargement des espaces…
                </div>
              ) : (
                <select
                  id={wsId}
                  value={workspaceId ?? ""}
                  onChange={(e) => setWorkspaceId(e.target.value || null)}
                  className="mt-2 block h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] text-white focus-visible:outline-none"
                >
                  <option value="">— Choisir un workspace —</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              )}
              {!workspaceId ? (
                <p className="mt-2 text-[12px] text-(--nebula-muted)">
                  Un workspace est requis pour un mapping de workspace.
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScopeRadio({
  checked,
  onChange,
  icon,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
        checked
          ? "border-white/20 bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10"
      }`}
    >
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          checked
            ? "bg-white/10 border-white/15 text-(--nebula-gold-light)"
            : "bg-white/5 border-white/10 text-(--nebula-muted)"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-(--nebula-muted)">{description}</span>
      </span>
      <span
        aria-hidden
        className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? "border-(--nebula-gold-light) bg-(--nebula-gold)" : "border-white/20 bg-white/5"
        }`}
      >
        {checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
    </label>
  );
}
