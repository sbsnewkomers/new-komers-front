'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Asset, AmortizationSchedule } from '@/types/asset.types';
import { assetsApi } from '@/lib/assetsApi';
import { formatCurrencyEUR } from '@/lib/format';

// Utility functions
const formatCurrency = (amount: number) => formatCurrencyEUR(amount, { fallback: "0,00 €" });

interface AmortizationScheduleProps {
  asset?: Asset;
  schedules?: AmortizationSchedule[];
}

export function AmortizationScheduleDisplay({ asset, schedules }: AmortizationScheduleProps) {
  const [totalDotations, setTotalDotations] = useState<number>(0);
  const [isLoadingTotal, setIsLoadingTotal] = useState(false);

  // Charger le total des dotations depuis le backend
  useEffect(() => {
    if (!asset?.id) return;

    const fetchTotalDotations = async () => {
      setIsLoadingTotal(true);
      try {
        const result = await assetsApi.getTotalAmortizationForAsset(asset.id);
        setTotalDotations(result.total);
      } catch (error) {
        console.error('Erreur lors du chargement du total des dotations:', error);
        // En cas d'erreur, calculer localement comme fallback
        const scheduleData = schedules || asset?.amortizationSchedules || [];
        const sortedSchedules = [...scheduleData].sort((a, b) => a.year - b.year);
        const localTotal = sortedSchedules.reduce((sum, s) => {
          const amount = s.annualAmortizationAmount;
          return (typeof amount === 'number' && !isNaN(amount)) ? sum + amount : sum;
        }, 0);
        setTotalDotations(localTotal);
      } finally {
        setIsLoadingTotal(false);
      }
    };

    fetchTotalDotations();
  }, [asset?.id, schedules, asset?.amortizationSchedules]);

  if (!asset) {
    return (
      <div className="text-center py-8 text-(--nebula-muted)">
        Aucun actif sélectionné.
      </div>
    );
  }

  const scheduleData = schedules || asset.amortizationSchedules || [];

  const sortedSchedules = [...scheduleData].sort((a, b) => a.year - b.year);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">

      {/* Amortization Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan d&apos;amortissement</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-8 text-(--nebula-muted)">
              Aucun plan d&apos;amortissement disponible pour cet actif.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-(--nebula-muted) border-white/10">Année</TableHead>
                    <TableHead className="text-(--nebula-muted) border-white/10">Dotation annuelle</TableHead>
                    <TableHead className="text-(--nebula-muted) border-white/10">Dotation mensuelle</TableHead>
                    <TableHead className="text-(--nebula-muted) border-white/10">Amortissements cumulés</TableHead>
                    <TableHead className="text-(--nebula-muted) border-white/10">Valeur nette comptable</TableHead>
                    <TableHead className="text-(--nebula-muted) border-white/10">Prorata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSchedules.map((schedule) => {
                    const isCurrentYear = schedule.year === currentYear;
                    const isFutureYear = schedule.year > currentYear;

                    return (
                      <TableRow
                        key={schedule.id}
                        className={
                          isCurrentYear ? 'bg-sky-500/10 border-white/10 font-semibold' :
                            isFutureYear ? 'text-white/40 border-white/10' : 'border-white/10'
                        }
                      >
                        <TableCell className="text-white">
                          {schedule.year}
                          {isCurrentYear && (
                            <span className="ml-2 text-xs border border-sky-400/30 bg-sky-500/15 text-sky-100 px-2 py-1 rounded-lg">
                              Année en cours
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-white">{formatCurrency(schedule.annualAmortizationAmount)}</TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(schedule.monthlyAmortizationAmount)}
                          {schedule.isProrata && (
                            <div className="text-xs text-(--nebula-muted)">
                              ({schedule.monthsUsed} mois)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white">{formatCurrency(schedule.cumulativeAmortization)}</TableCell>
                        <TableCell className="text-white">{formatCurrency(schedule.netBookValue)}</TableCell>
                        <TableCell>
                          {schedule.isProrata ? (
                            <span className="text-xs border border-amber-400/30 bg-amber-500/15 text-amber-100 px-2 py-1 rounded-lg">
                              Oui ({schedule.monthsUsed} mois)
                            </span>
                          ) : (
                            <span className="text-white/40">Non</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {sortedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques d&apos;amortissement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-(--nebula-muted)">Total des dotations prévues</p>
                <p className="text-2xl font-bold text-emerald-200">
                  {isLoadingTotal ? 'Chargement...' : formatCurrency(totalDotations)}
                </p>
              </div>
              <div>
                <p className="text-sm text-(--nebula-muted)">Dotation pour l&apos;année {currentYear}</p>
                <p className="text-2xl font-bold text-sky-200">
                  {formatCurrency(
                    sortedSchedules.find(s => s.year === currentYear)?.annualAmortizationAmount || 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-(--nebula-muted)">Valeur nette comptable actuelle</p>
                <p className="text-2xl font-bold text-violet-200">
                  {formatCurrency(
                    sortedSchedules.find(s => s.year === currentYear)?.netBookValue ||
                    sortedSchedules[sortedSchedules.length - 1]?.netBookValue ||
                    asset.acquisitionAmount
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
