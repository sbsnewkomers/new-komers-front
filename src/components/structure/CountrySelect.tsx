import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from '@/lib/countriesData';
import { Input } from '@/components/ui/Input';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CountrySelect({ 
  value, 
  onChange, 
  placeholder = "Sélectionner un pays", 
  disabled 
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    setSearchTerm("");
  }, [onChange]);

  return (
    <div className="relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm outline-none transition-colors hover:border-white/15 focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) disabled:pointer-events-none disabled:opacity-50"
        >
          <span className={`min-w-0 flex-1 truncate ${!value ? "text-muted-foreground" : "text-foreground"}`}>
            {selectedCountry ? `${selectedCountry.label} (${selectedCountry.code})` : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-popover backdrop-blur-xl text-popover-foreground shadow-xl">
            <div className="border-b border-white/10 bg-white/5 p-2">
              <Input
                type="text"
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="h-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Aucun pays trouvé
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.value}
                    type="button"
                    onClick={() => handleSelect(country.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                      value === country.value || value === country.label
                        ? "bg-muted/80 text-(--nebula-gold-light)"
                        : "text-popover-foreground"
                    }`}
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        value === country.value || value === country.label 
                        ? "text-(--nebula-gold-light)" 
                        : "text-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{country.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Code: {country.code}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Fermer le dropdown quand on clique ailleurs */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
