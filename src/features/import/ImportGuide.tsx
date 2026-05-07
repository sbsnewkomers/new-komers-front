"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileUp,
  Layers,
  ArrowRight,
  Hash,
  Calendar,
  Type,
  Calculator,
  CheckCircle2,
  Circle,
  Lightbulb,
  Upload,
  Wand2,
  Save,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FieldInfo {
  name: string;
  type: "string" | "number" | "date";
  required: boolean;
  description: string;
  example: string;
}

// ─── Données des champs attendus ───────────────────────────────────────────────────

const FIELD_DESCRIPTIONS: FieldInfo[] = [
  {
    name: "JournalCode",
    type: "string",
    required: true,
    description: "Code alphanumérique identifiant le journal comptable.",
    example: "ACH, VTE, BQ",
  },
  {
    name: "JournalLib",
    type: "string",
    required: true,
    description: "Intitulé complet du journal comptable.",
    example: "Journal des achats",
  },
  {
    name: "EcritureNum",
    type: "string",
    required: true,
    description: "Numéro séquentiel unique identifiant l'écriture dans le journal.",
    example: "00001, ACH2024-001",
  },
  {
    name: "EcritureDate",
    type: "date",
    required: true,
    description: "Date de l'écriture comptable au format AAAAMMJJ.",
    example: "20240131",
  },
  {
    name: "CompteNum",
    type: "string",
    required: true,
    description: "Numéro de compte du plan comptable général.",
    example: "401000, 512000",
  },
  {
    name: "CompteLib",
    type: "string",
    required: true,
    description: "Libellé du compte comptable correspondant.",
    example: "Fournisseurs, Banque",
  },
  {
    name: "CompteAuxNum",
    type: "string",
    required: false,
    description: "Numéro du compte auxiliaire (tiers) si applicable.",
    example: "FOURN001",
  },
  {
    name: "CompteAuxLib",
    type: "string",
    required: false,
    description: "Libellé du compte auxiliaire.",
    example: "Fournisseur ABC",
  },
  {
    name: "PieceRef",
    type: "string",
    required: false,
    description: "Référence du document justificatif (facture, avoir…).",
    example: "FAC-2024-0042",
  },
  {
    name: "PieceDate",
    type: "date",
    required: false,
    description: "Date du document justificatif au format AAAAMMJJ.",
    example: "20240128",
  },
  {
    name: "EcritureLib",
    type: "string",
    required: true,
    description: "Libellé descriptif de l'écriture comptable.",
    example: "Facture fournisseur ABC",
  },
  {
    name: "Debit",
    type: "number",
    required: true,
    description: "Montant au débit (0 si l'écriture est créditrice).",
    example: "1500.00",
  },
  {
    name: "Credit",
    type: "number",
    required: true,
    description: "Montant au crédit (0 si l'écriture est débitrice).",
    example: "0.00",
  },
  {
    name: "EcritureLet",
    type: "string",
    required: false,
    description: "Code de lettrage permettant de rapprocher des écritures entre elles.",
    example: "AA, AB",
  },
  {
    name: "DateLet",
    type: "date",
    required: false,
    description: "Date à laquelle le lettrage a été effectué.",
    example: "20240205",
  },
  {
    name: "ValidDate",
    type: "date",
    required: false,
    description: "Date de validation de l'écriture dans le système source.",
    example: "20240131",
  },
  {
    name: "Montantdevise",
    type: "number",
    required: false,
    description: "Montant exprimé dans la devise d'origine de l'écriture.",
    example: "1800.00",
  },
  {
    name: "Idevise",
    type: "string",
    required: false,
    description: "Code ISO de la devise utilisée pour le montant en devise.",
    example: "USD, GBP",
  },
  {
    name: "code_entité",
    type: "string",
    required: false,
    description: "Code interne identifiant l'entité juridique rattachée à l'écriture.",
    example: "ENT001",
  },
];

// ─── Étapes du processus ──────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Upload,
    label: "Déposez votre fichier",
    detail: "Glissez-déposez ou cliquez pour importer un fichier Excel, CSV ou TXT.",
    color: "text-sky-200",
    bg: "bg-sky-500/10",
    border: "border-sky-400/25",
  },
  {
    icon: Wand2,
    label: "Configurez le mapping",
    detail: "Associez chaque colonne de votre fichier au champ de base correspondant. Sauvegardez le mapping pour le réutiliser.",
    color: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-400/25",
  },
  {
    icon: CheckCircle2,
    label: "Importez vos données",
    detail: "Les données sont validées, archivées et intégrées automatiquement par exercice fiscal.",
    color: "text-emerald-200",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/25",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  string: <Type className="h-3 w-3" />,
  number: <Calculator className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
};

const TYPE_LABELS: Record<string, string> = {
  string: "texte",
  number: "nombre",
  date: "date",
};

const TYPE_COLORS: Record<string, string> = {
  string: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  number: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  date: "border-violet-400/30 bg-violet-500/15 text-violet-100",
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light)/40"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
        <Icon className="h-4 w-4 text-(--nebula-gold-light)" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-(--nebula-muted)">{subtitle}</p>
      </div>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-(--nebula-muted) transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function FieldRow({ field }: { field: FieldInfo }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/15 sm:flex-row sm:items-start sm:gap-3">
      {/* Nom + badges */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:w-44">
        <code className="text-xs font-bold text-white">{field.name}</code>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[field.type]}`}
        >
          {TYPE_ICONS[field.type]}
          {TYPE_LABELS[field.type]}
        </span>
        {field.required ? (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-100">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Requis
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-(--nebula-muted)">
            <Circle className="h-2.5 w-2.5" />
            Optionnel
          </span>
        )}
      </div>

      {/* Description + exemple */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-(--nebula-muted)">{field.description}</p>
        <p className="mt-0.5 text-[11px] text-white/50">
          <span className="font-medium">Ex :</span> {field.example}
        </p>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ImportGuide() {
  const [openSection, setOpenSection] = useState<"none" | "flow" | "fields" | "templates">("none");

  const toggle = (section: "flow" | "fields" | "templates") =>
    setOpenSection((prev) => (prev === section ? "none" : section));

  const requiredFields = FIELD_DESCRIPTIONS.filter((f) => f.required);
  const optionalFields = FIELD_DESCRIPTIONS.filter((f) => !f.required);

  return (
    <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
      {/* En-tête global */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-3">
        <BookOpen className="h-4 w-4 text-(--nebula-gold-light)" />
        <span className="text-sm font-semibold text-white">
          Guide d&apos;utilisation
        </span>
        <span className="ml-auto text-[11px] text-(--nebula-muted)">
          Cliquez sur une section pour en savoir plus
        </span>
      </div>

      {/* ── Section 1 : Fonctionnement ── */}
      <div className="border-b border-white/10">
        <SectionHeader
          icon={Lightbulb}
          title="Comment ça fonctionne ?"
          subtitle="Le processus d'import en 3 étapes"
          open={openSection === "flow"}
          onToggle={() => toggle("flow")}
        />
        {openSection === "flow" && (
          <div className="px-5 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                  <div className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${step.bg} ${step.border}`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <div className="sm:px-1">
                    <p className="text-xs font-semibold text-white">{step.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-(--nebula-muted)">{step.detail}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-white/25 sm:block" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" />
                <p className="text-xs text-amber-100/95">
                  <span className="font-semibold">Bon à savoir : </span>
                  Si l&apos;entité cible contient déjà des données, un message de confirmation vous sera présenté avant tout remplacement. Les données précédentes sont archivées et peuvent être restaurées depuis l&apos;historique.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2 : Champs attendus ── */}
      <div className="border-b border-white/10">
        <SectionHeader
          icon={FileUp}
          title="Champs attendus dans le fichier"
          subtitle={`${requiredFields.length} champs requis · ${optionalFields.length} champs optionnels`}
          open={openSection === "fields"}
          onToggle={() => toggle("fields")}
        />
        {openSection === "fields" && (
          <div className="px-5 pb-5 space-y-4">
            {/* Requis */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Champs obligatoires
                </span>
                <span className="text-[11px] text-(--nebula-muted)">L&apos;import échouera si l&apos;un d&apos;eux est absent.</span>
              </div>
              <div className="space-y-1.5">
                {requiredFields.map((f) => (
                  <FieldRow key={f.name} field={f} />
                ))}
              </div>
            </div>

            {/* Optionnels */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-(--nebula-muted)">
                  <Circle className="h-3 w-3" />
                  Champs optionnels
                </span>
                <span className="text-[11px] text-(--nebula-muted)">Enrichissent la donnée si disponibles.</span>
              </div>
              <div className="space-y-1.5">
                {optionalFields.map((f) => (
                  <FieldRow key={f.name} field={f} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-3">
              <div className="flex items-start gap-2">
                <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-200" />
                <p className="text-xs text-sky-100/95">
                  <span className="font-semibold">Format des dates : </span>
                  Toutes les dates doivent être au format <code className="rounded border border-white/10 bg-white/10 px-1 font-mono text-[11px] text-white">AAAAMMJJ</code> (ex : <code className="rounded border border-white/10 bg-white/10 px-1 font-mono text-[11px] text-white">20240131</code> pour le 31 janvier 2024).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3 : Templates de mapping ── */}
      <div>
        <SectionHeader
          icon={Layers}
          title="Utiliser les modèles de mapping"
          subtitle="Sauvegardez et réutilisez vos configurations"
          open={openSection === "templates"}
          onToggle={() => toggle("templates")}
        />
        {openSection === "templates" && (
          <div className="px-5 pb-5 space-y-3">
            <p className="text-xs leading-relaxed text-(--nebula-muted)">
              Un <span className="font-semibold text-white">modèle de mapping</span> enregistre la correspondance entre les colonnes de votre fichier et les champs comptables attendus. Vous n&apos;avez ainsi plus besoin de reconfigurer manuellement à chaque import.
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  icon: Save,
                  color: "text-emerald-200",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-400/25",
                  title: "Enregistrer",
                  desc: "Après avoir configuré votre mapping, cliquez sur « Enregistrer » pour le sauvegarder sous un nom.",
                },
                {
                  icon: RefreshCw,
                  color: "text-violet-200",
                  bg: "bg-violet-500/10",
                  border: "border-violet-400/25",
                  title: "Réutiliser",
                  desc: "Au prochain import, sélectionnez un modèle existant depuis le modal de sélection — aucune reconfiguration nécessaire.",
                },
                {
                  icon: Layers,
                  color: "text-sky-200",
                  bg: "bg-sky-500/10",
                  border: "border-sky-400/25",
                  title: "Portée",
                  desc: "Un mapping peut être global (visible par tous) ou local à un workspace (visible seulement par les membres).",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`rounded-xl border ${item.border} ${item.bg} p-3`}
                >
                  <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-(--nebula-muted)">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-3">
              <div className="flex items-start gap-2">
                <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-200" />
                <p className="text-xs text-violet-100/95">
                  <span className="font-semibold">Astuce : </span>
                  Si votre fichier possède les mêmes noms de colonnes que les champs attendus (ex : colonne nommée <code className="rounded border border-white/10 bg-white/10 px-1 font-mono text-[11px] text-white">JournalCode</code>), le mapping est détecté automatiquement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}