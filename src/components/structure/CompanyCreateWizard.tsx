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
import { Progress } from "@/components/ui/Progress";

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
  ape_code: "",
  main_activity: "",
  size: "SMALL",
  model: "SUBSIDIARY",
};

type CompanyCreateWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: { id: string; name: string }[];
  onSubmit: (data: CompanyWizardForm) => Promise<void>;
};

export function CompanyCreateWizard({ open, onOpenChange, groups, onSubmit }: CompanyCreateWizardProps) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<CompanyWizardForm>(defaultForm);
  const [loading, setLoading] = React.useState(false);

  const progress = (step / 3) * 100;

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
  const canNextStep2 = form.siret.trim() && form.groupId;
  const canFinish = true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Nouvelle entreprise</DialogTitle>
        </DialogHeader>
        <Progress value={progress} max={100} className="mb-4" />

        {step === 1 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Étape 1 — Informations Générales</p>
            <Input
              placeholder="Nom de l'entreprise"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de début d'exercice</label>
              <Input
                type="date"
                value={form.fiscal_year_start}
                onChange={(e) => setForm((f) => ({ ...f, fiscal_year_start: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de fin d'exercice</label>
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
            <p className="text-sm text-muted-foreground">Étape 2 — Détails Administratifs</p>
            <Input
              placeholder="SIRET"
              value={form.siret}
              onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
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
                onValueChange={(v) => setForm((f) => ({ ...f, groupId: v }))}
                placeholder="Choisir un groupe"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Étape 3 — Classification</p>
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
