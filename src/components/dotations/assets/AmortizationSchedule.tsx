'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Asset, AmortizationSchedule } from '@/types/asset.types';
import { assetsApi } from '@/lib/assetsApi';

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

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
      <div className="text-center py-8 text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
              Aucun plan d&apos;amortissement disponible pour cet actif.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Dotation annuelle</TableHead>
                    <TableHead>Dotation mensuelle</TableHead>
                    <TableHead>Amortissements cumulés</TableHead>
                    <TableHead>Valeur nette comptable</TableHead>
                    <TableHead>Prorata</TableHead>
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
                          isCurrentYear ? 'bg-blue-50 font-semibold' :
                            isFutureYear ? 'text-gray-400' : ''
                        }
                      >
                        <TableCell>
                          {schedule.year}
                          {isCurrentYear && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Année en cours
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(schedule.annualAmortizationAmount)}</TableCell>
                        <TableCell>
                          {formatCurrency(schedule.monthlyAmortizationAmount)}
                          {schedule.isProrata && (
                            <div className="text-xs text-gray-500">
                              ({schedule.monthsUsed} mois)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(schedule.cumulativeAmortization)}</TableCell>
                        <TableCell>{formatCurrency(schedule.netBookValue)}</TableCell>
                        <TableCell>
                          {schedule.isProrata ? (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Oui ({schedule.monthsUsed} mois)
                            </span>
                          ) : (
                            <span className="text-gray-400">Non</span>
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
                <p className="text-sm text-gray-600">Total des dotations prévues</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingTotal ? 'Chargement...' : formatCurrency(totalDotations)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dotation pour l&apos;année {currentYear}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    sortedSchedules.find(s => s.year === currentYear)?.annualAmortizationAmount || 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valeur nette comptable actuelle</p>
                <p className="text-2xl font-bold text-purple-600">
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
