import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from '@/lib/countriesData';

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
    return COUNTRIES.find(country => country.value === value);
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
          className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        >
          <span className={!value ? "text-gray-500" : "text-gray-900"}>
            {selectedCountry ? `${selectedCountry.label} (${selectedCountry.code})` : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2">
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  Aucun pays trouvé
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.value}
                    type="button"
                    onClick={() => handleSelect(country.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                      value === country.value ? "bg-blue-50 text-blue-700" : "text-gray-900"
                    }`}
                  >
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ${
                        value === country.value ? "text-blue-600" : "text-transparent"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="truncate">{country.label}</div>
                      <div className="text-xs text-gray-500">
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
