"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { apiFetch } from "@/lib/apiClient";
import { formatCurrencyEUR, formatDateFR } from "@/lib/format";
import { PageHeader } from "@/components/patterns/PageHeader";
import { FilterBar } from "@/components/patterns/FilterBar";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EntryMovementFilter, ImportEntriesResponse, ImportedAccountingEntry } from "@/features/import/types";

const PAGE_SIZE = 25;

function formatAmount(value: number): string {
  return formatCurrencyEUR(value || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value?: string | null): string {
  return formatDateFR(value, { fallback: "-" });
}

export default function ImportEntriesPage() {
  const router = useRouter();
  const queryFile = router.query.file;
  const selectedFile = useMemo(() => {
    if (Array.isArray(queryFile)) return queryFile[0] ?? "";
    return queryFile ?? "";
  }, [queryFile]);

  const [items, setItems] = useState<ImportedAccountingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [movement, setMovement] = useState<EntryMovementFilter>("all");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ totalRows: 0, totalDebit: 0, totalCredit: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalFilteredRows: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedFile) return;

    const loadEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          file: selectedFile,
          page: String(page),
          pageSize: String(PAGE_SIZE),
          movement,
        });
        if (search) {
          params.set("search", search);
        }

        const response = await apiFetch<ImportEntriesResponse>(`/generic-import/entries?${params.toString()}`, {
          method: "GET",
          snackbar: { showError: false, showSuccess: false },
        });

        setItems(response.items ?? []);
        setSummary(response.summary);
        setPagination(response.pagination);
      } catch (err) {
        console.error("Erreur lors du chargement des ecritures:", err);
        setError("Impossible de charger les ecritures pour cet import.");
      } finally {
        setLoading(false);
      }
    };

    void loadEntries();
  }, [selectedFile, page, movement, search]);

  return (
    <AppLayout title="Ecritures comptables importees">
      <Head>
        <title>Ecritures importees - NewKomers</title>
      </Head>

      <div className="space-y-6 p-1">
        <PageHeader
          title="Écritures importées"
          subtitle="Consultez et filtrez les écritures issues de l’import."
          actions={
            <Button
              variant="outline"
              className="w-full gap-2 border-primary text-primary hover:border-primary! hover:bg-primary/10 sm:w-auto"
              onClick={() => void router.push("/import")}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux imports
            </Button>
          }
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            Fichier:
            <span
              className="max-w-full truncate rounded-lg border border-primary bg-primary/70 text-white! shadow-lg shadow-primary/50 px-3 py-2 text-sm font-medium sm:max-w-[420px]"
              title={selectedFile || "-"}
            >
              {selectedFile || "-"}
            </span>
          </div>
        </PageHeader>

        {!selectedFile ? (
          <Card className="nebula-glass shadow-sm ring-1 ring-primary">
            <CardContent className="py-10! text-center text-slate-500">
              Aucun fichier selectionne. Revenez sur la page d&apos;import et cliquez sur &quot;Voir ecritures&quot;.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="nebula-glass nebula-blob rounded-3xl p-6 relative overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                  § Lignes
                </p>
                <p className="mt-3 text-3xl font-bold font-mono nebula-grad-text tabular-nums">
                  {summary.totalRows}
                </p>
              </div>

              <div className="nebula-glass nebula-blob rounded-3xl p-6 relative overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                  § Total débit
                </p>
                <p className="mt-3 text-3xl font-bold font-mono nebula-grad-text tabular-nums">
                  {formatAmount(summary.totalDebit)}
                </p>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-5 -right-40 h-full w-full rounded-full bg-green-600 blur-3xl"
                />
              </div>

              <div className="nebula-glass nebula-blob rounded-3xl p-6 relative overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                  § Total crédit
                </p>
                <p className="mt-3 text-3xl font-bold font-mono nebula-grad-text tabular-nums">
                  {formatAmount(summary.totalCredit)}
                </p>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-5 -right-40 h-full w-full rounded-full bg-red-500 blur-3xl"
                />
              </div>
            </div>

            <Card className="nebula-glass drop-shadow-lg ring-1 ring-primary">
              <CardContent className="p-5!">
                <FilterBar
                  search={
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 border-slate-200 bg-white shadow-sm focus-visible:ring-sky-400"
                        placeholder="Rechercher par libelle, piece, compte, journal..."
                      />
                    </div>
                  }
                  filters={
                    <div className="w-full md:w-56">
                      <Select
                        value={movement}
                        onValueChange={(nextValue) => {
                          setMovement((nextValue as EntryMovementFilter) || "all");
                          setPage(1);
                        }}
                        options={[
                          { value: "all", label: "Tous les mouvements" },
                          { value: "debit", label: "Debits uniquement" },
                          { value: "credit", label: "Credits uniquement" },
                        ]}
                      />
                    </div>
                  }
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden nebula-glass drop-shadow-lg ring-1 ring-primary">
              {error ? (
                <CardContent className="py-10! text-center text-red-600">{error}</CardContent>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary/10 hover:bg-primary/10">
                          <TableHead className="font-semibold text-primary">Date</TableHead>
                          <TableHead className="font-semibold text-primary">N. ecriture</TableHead>
                          <TableHead className="font-semibold text-primary">Libelle</TableHead>
                          <TableHead className="font-semibold text-primary">Journal</TableHead>
                          <TableHead className="font-semibold text-primary">Compte</TableHead>
                          <TableHead className="font-semibold text-primary">Piece</TableHead>
                          <TableHead className="text-right font-semibold text-emerald-700!">Debit</TableHead>
                          <TableHead className="text-right font-semibold text-rose-700">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-primary">
                              Chargement des ecritures...
                            </TableCell>
                          </TableRow>
                        ) : items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-primary">
                              Aucune ecriture ne correspond a vos filtres.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((entry) => (
                            <TableRow key={entry.id} className="hover:bg-primary/5">
                              <TableCell>{formatDate(entry.writingDate)}</TableCell>
                              <TableCell className="font-medium text-primary">{entry.writingNumber || "-"}</TableCell>
                              <TableCell>{entry.writingLib || "-"}</TableCell>
                              <TableCell>{entry.journalCode || "-"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{entry.accountNumber || "-"}</span>
                                  <span className="text-xs">{entry.accountLib || "-"}</span>
                                </div>
                              </TableCell>
                              <TableCell>{entry.pieceReference || "-"}</TableCell>
                              <TableCell className="text-right font-semibold text-emerald-700">
                                {entry.debit > 0 ? formatAmount(entry.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-rose-700">
                                {entry.credit > 0 ? formatAmount(entry.credit) : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                      <div className="border-t border-primary nebula-glass px-5 py-4">
                    <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
                      <p className="text-sm text-primary">
                        {pagination.totalFilteredRows} ligne(s) trouvee(s) - page {pagination.page} / {pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 nebula-glass border-primary text-primary hover:border-primary! hover:bg-primary/10"
                          disabled={pagination.page <= 1 || loading}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Precedent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 nebula-glass border-primary text-primary hover:border-primary! hover:bg-primary/10"
                          disabled={pagination.page >= pagination.totalPages || loading}
                          onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
