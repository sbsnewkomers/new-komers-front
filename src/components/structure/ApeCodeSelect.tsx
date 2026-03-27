import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { APE_CODES, type ApeCodeOption } from '@/lib/nafApeData';

interface ApeCodeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onDescriptionChange?: (description: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ApeCodeSelect({ 
  value, 
  onChange, 
  onDescriptionChange,
  placeholder = "Sélectionner un code APE", 
  disabled 
}: ApeCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodes = useMemo(() => {
    if (!searchTerm) return APE_CODES;
    
    const term = searchTerm.toLowerCase();
    return APE_CODES.filter(code => 
      code.value.toLowerCase().includes(term) || 
      code.label.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const selectedCode = useMemo(() => {
    return APE_CODES.find(code => code.value === value);
  }, [value]);

  const handleSelect = useCallback((codeValue: string) => {
    onChange(codeValue);
    setIsOpen(false);
    setSearchTerm("");
    
    // Extraire la description du code sélectionné et la mettre dans l'activité principale
    const selected = APE_CODES.find(code => code.value === codeValue);
    if (selected && onDescriptionChange) {
      // Extraire juste la description (après "CODE - ")
      const description = selected.label.replace(/^[^-]+-\s*/, '');
      onDescriptionChange(description);
    }
  }, [onChange, onDescriptionChange]);

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
            {selectedCode ? selectedCode.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2">
              <input
                type="text"
                placeholder="Rechercher un code APE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredCodes.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  Aucun code APE trouvé
                </div>
              ) : (
                filteredCodes.map((code) => (
                  <button
                    key={code.value}
                    type="button"
                    onClick={() => handleSelect(code.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                      value === code.value ? "bg-blue-50 text-blue-700" : "text-gray-900"
                    }`}
                  >
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ${
                        value === code.value ? "text-blue-600" : "text-transparent"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="truncate">{code.label}</div>
                      {code.section && (
                        <div className="text-xs text-gray-500">
                          Section {code.section}: {code.sectionDescription}
                        </div>
                      )}
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
