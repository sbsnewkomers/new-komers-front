"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { SiretInput, validateSiret } from "@/components/ui/SiretInput";
const STEPS = [
  { id: 1, title: "Informations Générales" },
  { id: 2, title: "Détails Administratifs" },
  { id: 3, title: "Classification" },
];

const TAILLE_OPTIONS = [
  { value: "SMALL", label: "TPE" },
  { value: "MEDIUM", label: "PME" },
  { value: "MEDIUM_ETI", label: "ETI" },
  { value: "LARGE", label: "Grand Groupe" },
];

const MODELE_OPTIONS = [
  { value: "HOLDING", label: "Holding" },
  { value: "SUBSIDIARY", label: "Filiale" },
  { value: "INDEPENDANT", label: "Indépendant" },
];

export type CompanyWizardForm = {
  name: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  siret: string;
  address: string;
  groupId: string;
  workspaceId: string;
  ape_code: string;
  main_activity: string;
  size: string;
  model: string;
};

const defaultForm: CompanyWizardForm = {
  name: "",
  fiscal_year_start: "",
  fiscal_year_end: "",
  siret: "",
  address: "",
  groupId: "",
  workspaceId: "",
  ape_code: "",
  main_activity: "",
  size: "SMALL",
  model: "SUBSIDIARY",
};

type CompanyCreateWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: { id: string; name: string; workspaceId: string }[];
  workspaces: { id: string; name: string }[];
  onSubmit: (data: CompanyWizardForm) => Promise<void>;
};

export function CompanyCreateWizard({ open, onOpenChange, groups, workspaces, onSubmit }: CompanyCreateWizardProps) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<CompanyWizardForm>(defaultForm);
  const [loading, setLoading] = React.useState(false);

  // Fonction pour trouver l'workspace d'un groupe
  const getworkspaceFromGroup = React.useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.workspaceId || "";
  }, [groups]);

  const handleGroupChange = React.useCallback((groupId: string) => {
    setForm((f) => ({ 
      ...f, 
      groupId,
      workspaceId: groupId ? getworkspaceFromGroup(groupId) : ""
    }));
  }, [getworkspaceFromGroup]);

  const reset = React.useCallback(() => {
    setStep(1);
    setForm(defaultForm);
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const canNextStep1 = form.name.trim() && form.fiscal_year_start && form.fiscal_year_end;
  const canNextStep2 = form.siret.trim() && validateSiret(form.siret) && (form.groupId || form.workspaceId); // Workspace requise si pas de groupe

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Nouvelle entreprise</DialogTitle>
        </DialogHeader>

        <nav aria-label="Progression" className="mb-6">
          <ol className="flex items-center">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <li key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors " +
                        (isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? "bg-slate-900 text-white ring-4 ring-slate-900/10"
                            : "bg-slate-100 text-slate-400")
                      }
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.id
                      )}
                    </div>
                    <span
                      className={
                        "text-[11px] font-medium text-center leading-tight " +
                        (isCurrent ? "text-slate-900" : isCompleted ? "text-emerald-600" : "text-slate-400")
                      }
                    >
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={
                        "h-0.5 flex-1 -mt-5 mx-1 rounded-full transition-colors " +
                        (step > s.id ? "bg-emerald-500" : "bg-slate-200")
                      }
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <Input
              placeholder="Nom de l&apos;entreprise"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de début d&apos;exercice</label>
              <Input
                type="date"
                value={form.fiscal_year_start}
                onChange={(e) => setForm((f) => ({ ...f, fiscal_year_start: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de fin d&apos;exercice</label>
              <Input
                type="date"
                value={form.fiscal_year_end}
                onChange={(e) => setForm((f) => ({ ...f, fiscal_year_end: e.target.value }))}
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <SiretInput
              value={form.siret}
              onChange={(value) => setForm((f) => ({ ...f, siret: value }))}
            />
            <Textarea
              placeholder="Adresse"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Rattachement à un groupe</label>
              <Select
                value={form.groupId}
                onValueChange={handleGroupChange}
              >
                <option value="">Sélectionner un groupe (optionnel)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
            {!form.groupId && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Workspace *</label>
                <Select
                  value={form.workspaceId}
                  onValueChange={(v) => setForm((f) => ({ ...f, workspaceId: v }))}
                  required
                >
                  <option value="">Sélectionner une workspace</option>
                  {workspaces.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <Input
              placeholder="Code APE"
              value={form.ape_code}
              onChange={(e) => setForm((f) => ({ ...f, ape_code: e.target.value }))}
            />
            <Input
              placeholder="Activité principale"
              value={form.main_activity}
              onChange={(e) => setForm((f) => ({ ...f, main_activity: e.target.value }))}
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Taille</label>
              <Select
                value={form.size}
                onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}
              >
                {TAILLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Modèle</label>
              <Select
                value={form.model}
                onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
              >
                {MODELE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={handlePrev}>
              Précédent
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !canNextStep1 || step === 2 && !canNextStep2}
            >
              Suivant
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} disabled={loading}>
              Terminer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
