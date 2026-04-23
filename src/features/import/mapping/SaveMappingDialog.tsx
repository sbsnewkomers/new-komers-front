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

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setScope(defaultScope);
      setWorkspaceId(defaultWorkspaceId);
    }
  }, [open, defaultName, defaultScope, defaultWorkspaceId]);

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
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Save className="h-4 w-4" aria-hidden />
            </span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <label
              htmlFor={nameId}
              className="block text-sm font-medium text-slate-700"
            >
              Nom du mapping <span className="text-rose-500">*</span>
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
              className="mt-1.5 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          {allowScopeSelection ? (
            <fieldset>
              <legend
                id={scopeGroupId}
                className="text-sm font-medium text-slate-700"
              >
                Portée
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
                  label="Local"
                  description="Disponible dans un seul espace de travail."
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
                className="block text-sm font-medium text-slate-700"
              >
                Workspace <span className="text-rose-500">*</span>
              </label>
              {isLoadingWorkspaces ? (
                <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Chargement des espaces…
                </div>
              ) : (
                <select
                  id={wsId}
                  value={workspaceId ?? ""}
                  onChange={(e) => setWorkspaceId(e.target.value || null)}
                  className="mt-1.5 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <p className="mt-1 text-xs text-amber-600">
                  Un workspace est requis pour un mapping local.
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
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          checked ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <span
        aria-hidden
        className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? "border-primary bg-primary" : "border-slate-300 bg-white"
        }`}
      >
        {checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
    </label>
  );
}
