import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { APE_CODES } from '@/lib/nafApeData';
import { Input } from '@/components/ui/Input';

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
          className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] shadow-sm outline-none transition-colors hover:border-white/15 focus-visible:ring-2 focus-visible:ring-(--nebula-gold-light) disabled:pointer-events-none disabled:opacity-50"
        >
          <span className={`min-w-0 flex-1 truncate ${!value ? "text-muted-foreground" : "text-foreground"}`}>
            {selectedCode ? selectedCode.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-popover backdrop-blur-xl text-popover-foreground shadow-xl">
            <div className="border-b border-white/10 bg-white/5 p-2">
              <Input
                type="text"
                placeholder="Rechercher un code APE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="h-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredCodes.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Aucun code APE trouvé
                </div>
              ) : (
                filteredCodes.map((code) => (
                  <button
                    key={code.value}
                    type="button"
                    onClick={() => handleSelect(code.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                      value === code.value
                        ? "bg-muted/80 text-(--nebula-gold-light)"
                        : "text-popover-foreground"
                    }`}
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        value === code.value ? "text-(--nebula-gold-light)" : "text-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{code.label}</div>
                      {code.section && (
                        <div className="text-xs text-muted-foreground">
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
