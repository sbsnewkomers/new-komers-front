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
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Landmark, TrendingUp, TrendingDown } from "lucide-react";
import { EntryMovementFilter, ImportEntriesResponse, ImportedAccountingEntry } from "@/features/import/types";

const PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR");

function formatAmount(value: number): string {
  return currencyFormatter.format(value || 0);
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
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

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            variant="outline"
            className="w-full gap-2 border-slate-200 bg-white/90 shadow-sm hover:shadow-md sm:w-auto"
            onClick={() => void router.push("/import")}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux imports
          </Button>
          <div className="flex min-w-0 items-center gap-2 text-sm">Fichier:
            <span className="max-w-full truncate rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 shadow-sm sm:max-w-[420px]" title={selectedFile || "-"}>
              {selectedFile || "-"}
            </span>
          </div>
        </div>

        {!selectedFile ? (
          <Card className="bg-white shadow-sm ring-1 ring-slate-100">
            <CardContent className="py-10! text-center text-slate-500">
              Aucun fichier selectionne. Revenez sur la page d&apos;import et cliquez sur &quot;Voir ecritures&quot;.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="bg-linear-to-l from-blue-200 to-white drop-shadow-lg drop-shadow-blue-100 ring-1 ring-blue-100">
                <CardContent className="p-5!">
                  <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Lignes</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{summary.totalRows}</p>
                </CardContent>
              </Card>
              <Card className="bg-linear-to-l from-green-200 to-white drop-shadow-lg drop-shadow-green-100 ring-1 ring-green-100">
                <CardContent className="p-5!">
                  <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Total debit</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-800">{formatAmount(summary.totalDebit)}</p>
                </CardContent>
              </Card>
              <Card className="bg-linear-to-l from-red-200 to-white drop-shadow-lg drop-shadow-red-100 ring-1 ring-red-100 ">
                <CardContent className="p-5!">
                  <div className="mb-2 inline-flex rounded-lg bg-rose-100 p-2 text-rose-700">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-rose-700">Total credit</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-800">{formatAmount(summary.totalCredit)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/95 drop-shadow-lg ring-1 ring-slate-100">
              <CardContent className="p-5!">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 border-slate-200 bg-white shadow-sm focus-visible:ring-sky-400"
                      placeholder="Rechercher par libelle, piece, compte, journal..."
                    />
                  </div>
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
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-white drop-shadow-lg ring-1 ring-slate-100">
              {error ? (
                <CardContent className="py-10! text-center text-red-600">{error}</CardContent>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-linear-to-t from-slate-200 to-white">
                          <TableHead className="font-semibold text-slate-600">Date</TableHead>
                          <TableHead className="font-semibold text-slate-600">N. ecriture</TableHead>
                          <TableHead className="font-semibold text-slate-600">Libelle</TableHead>
                          <TableHead className="font-semibold text-slate-600">Journal</TableHead>
                          <TableHead className="font-semibold text-slate-600">Compte</TableHead>
                          <TableHead className="font-semibold text-slate-600">Piece</TableHead>
                          <TableHead className="text-right font-semibold text-emerald-700!">Debit</TableHead>
                          <TableHead className="text-right font-semibold text-rose-700">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                              Chargement des ecritures...
                            </TableCell>
                          </TableRow>
                        ) : items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                              Aucune ecriture ne correspond a vos filtres.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((entry) => (
                            <TableRow key={entry.id} className="hover:bg-slate-50/70">
                              <TableCell>{formatDate(entry.writingDate)}</TableCell>
                              <TableCell className="font-medium text-slate-700">{entry.writingNumber || "-"}</TableCell>
                              <TableCell>{entry.writingLib || "-"}</TableCell>
                              <TableCell>{entry.journalCode || "-"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-700">{entry.accountNumber || "-"}</span>
                                  <span className="text-xs text-slate-500">{entry.accountLib || "-"}</span>
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

                      <div className="border-t border-slate-100 bg-linear-to-b from-slate-200 to-white px-5 py-4">
                    <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
                      <p className="text-sm text-slate-500">
                        {pagination.totalFilteredRows} ligne(s) trouvee(s) - page {pagination.page} / {pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-white shadow-sm hover:shadow"
                          disabled={pagination.page <= 1 || loading}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Precedent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-white shadow-sm hover:shadow"
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
