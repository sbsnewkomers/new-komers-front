import React, { useState, useMemo, useCallback } from 'react';
import { Check, Search } from 'lucide-react';
import { COUNTRIES } from '@/lib/countriesData';
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

interface CountrySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onChange: (value: string) => void;
  title?: string;
}

export function CountrySelectModal({
  open,
  onOpenChange,
  value,
  onChange,
  title = "Sélectionner un pays"
}: CountrySelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return COUNTRIES;

    const term = searchTerm.toLowerCase();
    return COUNTRIES.filter(country =>
      country.label.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const selectedCountry = useMemo(() => {
    return COUNTRIES.find(country =>
      country.value === value || country.label === value
    );
  }, [value]);

  const handleSelect = useCallback((countryValue: string) => {
    onChange(countryValue);
    onOpenChange(false);
    setSearchTerm("");
  }, [onChange, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSearchTerm("");
  }, [onOpenChange]);

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
          {/* Champ de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--nebula-muted)" />
            <Input
              type="text"
              placeholder="Rechercher un pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="pl-10"
            />
          </div>

          {/* Pays sélectionné */}
          {selectedCountry && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-(--nebula-gold-light)" />
                <span className="text-sm font-medium text-white">
                  {selectedCountry.label} ({selectedCountry.code})
                </span>
              </div>
            </div>
          )}

          {/* Liste des pays */}
          <div className="max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
            {filteredCountries.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-(--nebula-muted)/50" />
                <p className="mt-2 text-sm text-(--nebula-muted)">
                  Aucun pays trouvé pour &ldquo;{searchTerm}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredCountries.map((country) => {
                  const isSelected = value === country.value || value === country.label;
                  return (
                    <button
                      key={country.value}
                      type="button"
                      onClick={() => handleSelect(country.value)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${isSelected
                        ? "bg-(--nebula-gold)/20 text-(--nebula-gold-light) border border-(--nebula-gold)/30"
                        : "text-white hover:bg-white/10"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{country.label}</div>
                          <div className="text-xs text-(--nebula-muted)">
                            Code: {country.code}
                          </div>
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
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {selectedCountry && (
            <Button
              onClick={() => handleSelect(selectedCountry.value)}
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
