import React, { useState, useMemo, useCallback } from 'react';
import { Check, Search } from 'lucide-react';
import { locationService, CityOption } from '@/lib/locationService';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface CitySelectModalProps {
  countryCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onChange: (value: string) => void;
  title?: string;
  stateCode?: string; // Optionnel, pour filtrer par état/région
}

export function CitySelectModal({
  countryCode,
  open,
  onOpenChange,
  value,
  onChange,
  title = "Sélectionner une ville",
  stateCode
}: CitySelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const cities = useMemo(() => {
    if (!countryCode) return [];
    return locationService.getCities(countryCode, stateCode);
  }, [countryCode, stateCode]);

  const filteredCities = useMemo(() => {
    if (!searchTerm) return cities;

    return locationService.searchCities(countryCode, searchTerm, stateCode);
  }, [searchTerm, cities, countryCode, stateCode]);

  const selectedCity = useMemo(() => {
    return cities.find(city =>
      city.value === value || city.label === value
    );
  }, [value, cities]);

  const handleSelect = useCallback((cityValue: string) => {
    onChange(cityValue);
    onOpenChange(false);
    setSearchTerm("");
  }, [onChange, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSearchTerm("");
  }, [onOpenChange]);

  const isDisabled = !countryCode;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <Search className="h-5 w-5 shrink-0 text-(--nebula-gold-light)" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {isDisabled ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-(--nebula-muted)/50" />
              <p className="mt-2 text-sm text-(--nebula-muted)">
                Veuillez sélectionner un pays avant de choisir une ville
              </p>
            </div>
          ) : (
            <>
              {/* Champ de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--nebula-muted)" />
                <Input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="pl-10"
                />
              </div>

              {/* Ville sélectionnée */}
              {selectedCity && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-(--nebula-gold-light)" />
                    <span className="text-sm font-medium text-white">
                      {selectedCity.label}
                      {selectedCity.stateCode && ` (${selectedCity.stateCode})`}
                    </span>
                  </div>
                </div>
              )}

              {/* Liste des villes */}
              <div className="max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
                {filteredCities.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="mx-auto h-12 w-12 text-(--nebula-muted)/50" />
                    <p className="mt-2 text-sm text-(--nebula-muted)">
                      {searchTerm ? "Aucune ville trouvée" : "Aucune ville disponible"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredCities.map((city: CityOption) => {
                      const isSelected = value === city.value || value === city.label;
                      return (
                        <button
                          key={`${city.countryCode}-${city.stateCode}-${city.value}`}
                          type="button"
                          onClick={() => handleSelect(city.value)}
                          className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${isSelected
                            ? "bg-(--nebula-gold)/20 text-(--nebula-gold-light) border border-(--nebula-gold)/30"
                            : "text-white hover:bg-white/10"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{city.label}</div>
                              {city.stateCode && (
                                <div className="text-xs text-(--nebula-muted)">
                                  Région: {city.stateCode}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-(--nebula-gold-light)" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {selectedCity && !isDisabled && (
            <Button
              onClick={() => handleSelect(selectedCity.value)}
              className="bg-(--nebula-gold) text-white hover:bg-(--nebula-gold-deep)"
            >
              Confirmer la sélection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
