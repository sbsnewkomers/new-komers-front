"use client";

import { useState, useCallback, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { Eye, X, ChevronRight } from "lucide-react";
import {
  downloadStructureTemplate,
  executeStructureImport,
  ImportReport,
  ImportExecuteResult,
  validateStructureFile,
} from "@/lib/structureImportApi";
import { getWorkspaces, Workspace } from "@/lib/workspaceApi";
import { Download, Upload } from "lucide-react";
// Mettez à jour TEMPLATE_SHEETS avec les nouvelles colonnes
const TEMPLATE_SHEETS = [
  {
    id: "groups",
    label: "1. Groupes",
    desc: "Un groupe peut contenir plusieurs entreprises.",
    cols: [
      { name: "Nom du groupe", key: "name", req: true, type: "Texte", note: "Unique" },
      { name: "Début exercice (DD-MM)", key: "fiscal_year_start", req: true, type: "Date", note: "ex: 01-01" },
      { name: "Pays", key: "country", req: true, type: "Texte", note: "ex: France" },
      { name: "Code entité", key: "entity_code", req: false, type: "Texte", note: "Code unique optionnel" },
      { name: "Date immatriculation", key: "registrationDate", req: false, type: "Date", note: "ex: 15/06/2010" },
      { name: "Rue", key: "street", req: false, type: "Texte", note: "Adresse" },
      { name: "Code postal", key: "postal_code", req: false, type: "Texte", note: "ex: 75001" },
      { name: "Ville", key: "city", req: false, type: "Texte", note: "ex: Paris" },
      { name: "Téléphone fixe", key: "phone_landline", req: false, type: "Texte", note: "ex: 0123456789" },
      { name: "Téléphone mobile", key: "phone_mobile", req: false, type: "Texte", note: "ex: 0612345678" },
      { name: "Email de contact", key: "contact_email", req: false, type: "Email", note: "ex: contact@exemple.com" },
    ],
    example: { name: "Groupe Alpha", fiscal_year_start: "01-01", country: "France", entity_code: "GRP-ALPHA", registrationDate: "15/06/2010", street: "15 Rue Paix", postal_code: "75001", city: "Paris", phone_landline: "0123456789", phone_mobile: "0612345678", contact_email: "contact@groupealpha.com" },
  },
  {
    id: "companies",
    label: "2. Entreprises",
    desc: "Rattachées à un groupe (optionnel). Taille : SMALL / MEDIUM / LARGE.",
    cols: [
      { name: "Nom entreprise", key: "name", req: true, type: "Texte", note: "Unique" },
      { name: "Début exercice (DD-MM)", key: "fiscal_year_start", req: true, type: "Date", note: "ex: 01-01" },
      { name: "SIRET", key: "siret", req: true, type: "Numérique", note: "14 chiffres" },
      { name: "Rue", key: "street", req: false, type: "Texte", note: "Adresse" },
      { name: "Code postal", key: "postal_code", req: false, type: "Texte", note: "ex: 75001" },
      { name: "Ville", key: "city", req: false, type: "Texte", note: "ex: Paris" },
      { name: "Téléphone fixe", key: "phone_landline", req: false, type: "Texte", note: "ex: 0123456789" },
      { name: "Téléphone mobile", key: "phone_mobile", req: false, type: "Texte", note: "ex: 0612345678" },
      { name: "Email de contact", key: "contact_email", req: false, type: "Email", note: "ex: contact@exemple.com" },
      { name: "Code APE", key: "ape_code", req: true, type: "Texte", note: "ex: 6201Z" },
      { name: "Activité", key: "main_activity", req: true, type: "Texte", note: "" },
      { name: "Taille", key: "size", req: false, type: "Enum", note: "SMALL / MEDIUM / LARGE" },
      { name: "Modèle", key: "model", req: false, type: "Enum", note: "HOLDING / SUBSIDIARY" },
      { name: "Pays", key: "country", req: true, type: "Texte", note: "ex: France" },
      { name: "Nom du groupe", key: "group_name", req: false, type: "Référence", note: "Doit exister dans onglet 1" },
      { name: "Code entité", key: "entity_code", req: false, type: "Texte", note: "Code unique optionnel" },
      { name: "Date immatriculation", key: "registrationDate", req: false, type: "Date", note: "ex: 01/03/2015" },
    ],
    example: { name: "Alpha Digital SAS", fiscal_year_start: "01-01", siret: "98765432100012", street: "15 Rue Paix", postal_code: "75001", city: "Paris", phone_landline: "0123456789", phone_mobile: "0612345678", contact_email: "contact@alphadigital.com", ape_code: "6201Z", main_activity: "Édition logiciels", size: "MEDIUM", model: "SUBSIDIARY", country: "France", group_name: "Groupe Alpha", entity_code: "ENT-ALPHA", registrationDate: "01/03/2015" },
  },
  {
    id: "bu",
    label: "3. Business Units",
    desc: "Liées à une entreprise existante dans l'onglet 2.",
    cols: [
      { name: "Nom business unit", key: "name", req: true, type: "Texte", note: "Unique par entreprise" },
      { name: "Nom entreprise", key: "company_name", req: true, type: "Référence", note: "Doit exister dans onglet 2" },
      { name: "Code BU", key: "code", req: true, type: "Texte", note: "ex: BU-FINANCE" },
      { name: "Activité", key: "activity", req: false, type: "Texte", note: "" },
      { name: "SIRET", key: "siret", req: true, type: "Numérique", note: "14 chiffres" },
      { name: "Date immatriculation", key: "registrationDate", req: false, type: "Date", note: "ex: 20/09/2018" },
      { name: "Rue", key: "street", req: false, type: "Texte", note: "Adresse" },
      { name: "Code postal", key: "postal_code", req: false, type: "Texte", note: "ex: 75001" },
      { name: "Ville", key: "city", req: false, type: "Texte", note: "ex: Paris" },
      { name: "Téléphone fixe", key: "phone_landline", req: false, type: "Texte", note: "ex: 0123456789" },
      { name: "Téléphone mobile", key: "phone_mobile", req: false, type: "Texte", note: "ex: 0612345678" },
      { name: "Email de contact", key: "contact_email", req: false, type: "Email", note: "ex: contact@exemple.com" },
      { name: "Pays", key: "country", req: true, type: "Texte", note: "ex: France" },
      { name: "Code entité", key: "entity_code", req: false, type: "Texte", note: "Code unique optionnel" },
    ],
    example: { name: "Finance Alpha", company_name: "Alpha Digital SAS", code: "BU-FINANCE", activity: "Gestion Comptable", siret: "98765432100012", registrationDate: "20/09/2018", street: "15 Rue Paix", postal_code: "75001", city: "Paris", phone_landline: "0123456789", phone_mobile: "0612345678", contact_email: "finance@alphadigital.com", country: "France", entity_code: "BU-FIN-ALPHA" },
  },
] as const;

export default function StructureImportUploadPage() {
  const { accessToken, user } = usePermissionsContext();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [executeResult, setExecuteResult] =
    useState<ImportExecuteResult | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Check if user is super admin or admin
  const canSelectWorkspace = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Load workspaces for super admin and admin users
  useEffect(() => {
    if (canSelectWorkspace && accessToken) {
      setIsLoadingWorkspaces(true);
      getWorkspaces(accessToken)
        .then((data) => {
          setWorkspaces(data);
        })
        .catch((err) => {
          console.error("Failed to load workspaces:", err);
          setError("Impossible de charger la liste des workspaces");
        })
        .finally(() => {
          setIsLoadingWorkspaces(false);
        });
    }
  }, [canSelectWorkspace, accessToken]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) {
      setError("Veuillez déposer un fichier Excel (.xlsx).");
      setFile(null);
      setReport(null);
      setExecuteResult(null);
      return;
    }
    setFile(f);
    setReport(null);
    setExecuteResult(null);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.name.endsWith(".xlsx")) {
        setError("Veuillez sélectionner un fichier Excel (.xlsx).");
        setFile(null);
        setReport(null);
        setExecuteResult(null);
        return;
      }
      setFile(f);
      setReport(null);
      setExecuteResult(null);
      setError(null);
    },
    [],
  );

  const handleDownloadTemplate = async () => {
    try {
      setError(null);
      await downloadStructureTemplate(accessToken);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Échec du téléchargement du modèle.";
      setError(msg);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    // Validate workspace selection for super admin and admin
    if (canSelectWorkspace && !selectedWorkspaceId) {
      setError("Veuillez sélectionner un workspace avant de valider le fichier.");
      return;
    }

    try {
      setIsValidating(true);
      setError(null);
      setExecuteResult(null);
      const workspaceId = canSelectWorkspace ? selectedWorkspaceId : undefined;
      const rep = await validateStructureFile(file, accessToken, workspaceId);
      setReport(rep);
      if (rep.errors.length > 0) {
        // Marquer clairement qu'il y a des erreurs
        setError(
          "Le fichier contient des erreurs. Corrigez-les puis réimportez si nécessaire.",
        );
        // Réinitialiser le fichier pour forcer un nouveau choix après correction
        setFile(null);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la validation.";
      setError(msg);
      setReport(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;

    if (canSelectWorkspace && !selectedWorkspaceId) {
      setError("Veuillez sélectionner un workspace avant de lancer l'import.");
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);
      const workspaceId = canSelectWorkspace ? selectedWorkspaceId : undefined;
      const rep = await executeStructureImport(file, accessToken, workspaceId);

      // La réponse est { success, message, data: { created: { ... } } }
      const result =
        (rep as { data?: ImportExecuteResult | null } | null | undefined)?.data ??
        rep;
      if (result && result.created) {
        setExecuteResult(result);
      } else {
        setError("Réponse inattendue du serveur.");
      }
    } catch (err: unknown) {
      const details =
        err && typeof err === "object" && "details" in err
          ? (err as { details?: { originalResponse?: unknown } }).details
            ?.originalResponse
          : undefined;

      if (
        details &&
        typeof details === "object" &&
        "errors" in details &&
        "summary" in details
      ) {
        setReport({
          summary: (details as { summary: ImportReport["summary"] }).summary,
          errors: (details as { errors: ImportReport["errors"] }).errors,
        });
        setError("L'import a échoué : des erreurs de validation ont été détectées.");
      } else {
        const msg =
          err && typeof err === "object" && "details" in err
            ? String(
              (err as { details?: { message?: unknown } }).details?.message ??
              "",
            )
            : err instanceof Error
              ? err.message
              : "";
        setError(msg || "Erreur lors de l'import.");
      }

      setExecuteResult(null);
    } finally {
      setIsExecuting(false);
    }
  };


  const hasNoErrors = report && report.errors.length === 0;

  return (
    <AppLayout
      title="Structure"
      companies={[]}
      selectedCompanyId=""
      onCompanyChange={() => { }}
    >
      <Head>
        <title>Import structure — Fichier Excel</title>
      </Head>
      <div className="mx-auto w-full space-y-6">
        <div className="flex items-center gap-1">
          <Link
            href="/structure"
            className="text-sm text-(--nebula-muted) hover:text-white"
          >
            ← Structure /
          </Link>
          <Link
            href="/structure/import/upload"
            className="text-sm font-medium text-white"
          >
            Import
          </Link>
        </div>
        <div className="nebula-glass nebula-blob rounded-3xl p-6 space-y-4 flex items-center justify-between">
          <div className="flex flex-col gap-2 ">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Upload className="h-5 w-5 text-(--nebula-gold-light)" />
              </div>
              <span>
                <span className="nebula-grad-text">Import</span> en masse de la structure
              </span>
            </h1>
            <p className="text-[13px] text-(--nebula-muted)">
              Utilisez le modèle Excel pour créer ou mettre à jour groupes,
              entreprises et business units.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplatePreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu du modèle
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-5 w-5" style={{ color: 'white' }} />
              Télécharger le modèle Excel
            </Button>
          </div>
        </div>

        {/* Workspace Selector for Super Admin and Admin */}
        {canSelectWorkspace && (
          <div className="nebula-glass nebula-blob rounded-3xl p-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                § Sélectionner un workspace
              </label>
              <p className="text-[13px] text-(--nebula-muted)">
                En tant que {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}, vous pouvez importer la structure dans un workspace spécifique.
              </p>
              {isLoadingWorkspaces ? (
                <div className="text-[13px] text-(--nebula-muted)">Chargement des workspaces...</div>
              ) : workspaces.length > 0 ? (
                <Select
                  value={selectedWorkspaceId}
                  onValueChange={setSelectedWorkspaceId}
                  placeholder="Sélectionner un workspace"
                >
                  <option value="">-- Sélectionner un workspace --</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="text-[13px] text-(--nebula-muted)">Aucun workspace disponible</div>
              )}
            </div>
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={
            "nebula-glass nebula-blob rounded-3xl border-2 border-dashed p-8 text-center transition-all " +
            (dragOver
              ? "border-(--nebula-gold-light) bg-white/10"
              : "border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5")
          }
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />

          {file ? (
            // Affichage quand un fichier est sélectionné
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-medium text-(--nebula-gold-light)">
                <Upload className="h-5 w-5" />
                <span className="font-mono break-all">{file.name}</span>
              </div>
              <div className="flex gap-3">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Changer de fichier
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setReport(null);
                    setExecuteResult(null);
                    setError(null);
                    // Reset l'input file
                    const input = document.getElementById('file-upload') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            // Affichage quand aucun fichier n'est sélectionné
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-(--nebula-gold)/20 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-(--nebula-gold-light)" />
                </div>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-(--nebula-gold-light) px-6 py-3 text-sm font-semibold text-black hover:bg-(--nebula-gold) transition-colors"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Sélectionner un fichier Excel
                </label>
                <p className="text-gray-600 dark:text-(--nebula-muted) text-sm">
                  Format .xlsx uniquement
                </p>
              </div>
              <div className="mt-4 text-center text-xs text-(--nebula-muted)">
                ou glissez-déposez votre fichier ici
              </div>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!file || isValidating || (canSelectWorkspace && !selectedWorkspaceId)}
          >
            {isValidating ? "Validation en cours…" : "Valider le fichier"}
          </Button>
          <Button
            type="button"
            onClick={handleExecute}
            disabled={!file || !hasNoErrors || isExecuting || (canSelectWorkspace && !selectedWorkspaceId)}
          >
            {isExecuting ? "Import en cours…" : "Lancer l'import"}
          </Button>
        </div>

        {executeResult && executeResult.created && (
          <div className="nebula-glass nebula-blob rounded-3xl p-6 text-sm">
            <p className="font-semibold mb-1 text-white">Import terminé avec succès.</p>
            <p>
              Groupes créés : <strong>{executeResult.created.groups}</strong>,{" "}
              Entreprises créées :{" "}
              <strong>{executeResult.created.companies}</strong>, Business units
              créées : <strong>{executeResult.created.businessUnits}</strong>.
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="nebula-glass nebula-blob rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted) mb-3">
                § Résumé de la validation
              </p>
              <ul className="text-[13px] text-(--nebula-muted) space-y-1">
                <li>
                  <span className="font-medium text-white">
                    Lignes totales :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.totalRows}</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Lignes valides :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.validRows}</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Lignes en erreur :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.errorRows}</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Groupes à créer :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.entitiesToCreate.groups}</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Entreprises à créer :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.entitiesToCreate.companies}</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Business units à créer :
                  </span>{" "}
                  <span className="font-mono text-white tabular-nums">{report.summary.entitiesToCreate.businessUnits}</span>
                </li>
              </ul>
            </div>

            <div className="nebula-glass rounded-3xl overflow-hidden border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-left font-medium">Feuille</th>
                    <th className="p-3 text-left font-medium">Ligne</th>
                    <th className="p-3 text-left font-medium">Colonne</th>
                    <th className="p-3 text-left font-medium">Valeur</th>
                    <th className="p-3 text-left font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-(--nebula-muted)"
                      >
                        Aucune erreur détectée.
                      </td>
                    </tr>
                  ) : (
                    report.errors.map((err, idx) => (
                      <tr key={idx} className="border-b border-white/10">
                        <td className="p-3">{err.sheet}</td>
                        <td className="p-3 font-mono">{err.row}</td>
                        <td className="p-3">{err.column}</td>
                        <td className="p-3 text-xs text-(--nebula-muted)">
                          {err.value !== undefined ? String(err.value) : ""}
                        </td>
                        <td className="p-3 text-red-400">{err.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── Modal aperçu template ── */}
        {showTemplatePreview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowTemplatePreview(false)}
          >
            <div
              className="bg-background rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Aperçu du modèle Excel</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    3 onglets à remplir — respectez l'ordre des colonnes et les valeurs autorisées.
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <TemplatePreviewTabs
                sheets={TEMPLATE_SHEETS}
                onDownload={handleDownloadTemplate}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
// ── Composant TemplatePreviewTabs  ──
function TemplatePreviewTabs({
  sheets,
  onDownload,
}: {
  sheets: typeof TEMPLATE_SHEETS;
  onDownload: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sheet = sheets[activeIdx];

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-2 px-6 pt-4 pb-0 border-b border-border bg-muted">
        {sheets.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${i === activeIdx
              ? "bg-background border-border text-foreground -mb-px"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{sheet.desc}</p>

        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Structure des colonnes
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border/30">
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Colonne Excel</th>
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-24">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-32">Note</th>
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-20">Statut</th>
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-36">Valeur exemple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sheet.cols.map((col, i) => (
                <tr key={col.key} className="hover:bg-muted/20 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground/70 font-medium">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-foreground/40"></div>
                      <span className="text-sm font-medium text-foreground">{col.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-200 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300 text-xs font-semibold border border-blue-400 dark:border-blue-500/20">
                      {col.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground/80">{col.note || <span className="text-muted-foreground/40">—</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${col.req
                      ? "bg-red-200 dark:bg-red-500/10 text-red-900 dark:text-red-300 border-red-400 dark:border-red-500/20"
                      : "bg-gray-200 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-500/20"
                      }`}>
                      {col.req ? "Requis" : "Facultatif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border/30">
                      <code className="text-xs text-muted-foreground font-mono">
                        {(sheet.example as Record<string, string>)[col.key] || <span className="text-muted-foreground/40">—</span>}
                      </code>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
            Champ requis — l'import échoue si absent
          </span>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted">
        <p className="text-xs text-muted-foreground">
          Respectez l'ordre des onglets : Groupes → Entreprises → Business Units
        </p>
        <Button onClick={onDownload} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Télécharger le modèle
        </Button>
      </div>
    </>
  );
}