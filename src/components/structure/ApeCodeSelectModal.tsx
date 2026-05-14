import React, { useState, useMemo, useCallback } from 'react';
import { Check, Search } from 'lucide-react';
import { APE_CODES } from '@/lib/nafApeData';
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

interface ApeCodeSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onChange: (value: string) => void;
  onDescriptionChange?: (description: string) => void;
  title?: string;
}

export function ApeCodeSelectModal({
  open,
  onOpenChange,
  value,
  onChange,
  onDescriptionChange,
  title = "Sélectionner un code APE"
}: ApeCodeSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodes = useMemo(() => {
    if (!searchTerm) return APE_CODES;

    const term = searchTerm.toLowerCase();
    return APE_CODES.filter(code =>
      code.label.toLowerCase().includes(term) ||
      code.value.toLowerCase().includes(term) ||
      (code.section && code.section.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const selectedCode = useMemo(() => {
    return APE_CODES.find(code =>
      code.value === value || code.label === value
    );
  }, [value]);

  const handleSelect = useCallback((codeValue: string) => {
    onChange(codeValue);
    onOpenChange(false);
    setSearchTerm("");
    
    // Extraire la description du code sélectionné
    if (onDescriptionChange) {
      const selected = APE_CODES.find(code => code.value === codeValue);
      if (selected) {
        // Extraire juste la description (après "CODE - ")
        const description = selected.label.replace(/^[^-]+-\s*/, '');
        onDescriptionChange(description);
      }
    }
  }, [onChange, onDescriptionChange, onOpenChange]);

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
              placeholder="Rechercher un code APE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="pl-10"
            />
          </div>

          {/* Code sélectionné */}
          {selectedCode && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-(--nebula-gold-light)" />
                <span className="text-sm font-medium text-white">
                  {selectedCode.label}
                </span>
              </div>
              {selectedCode.section && (
                <div className="ml-6 text-xs text-(--nebula-muted)">
                  Section {selectedCode.section}: {selectedCode.sectionDescription}
                </div>
              )}
            </div>
          )}

          {/* Liste des codes */}
          <div className="max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
            {filteredCodes.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-(--nebula-muted)/50" />
                <p className="mt-2 text-sm text-(--nebula-muted)">
                  Aucun code APE trouvé pour &ldquo;{searchTerm}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredCodes.map((code) => {
                  const isSelected = value === code.value || value === code.label;
                  return (
                    <button
                      key={code.value}
                      type="button"
                      onClick={() => handleSelect(code.value)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${isSelected
                        ? "bg-(--nebula-gold)/20 text-(--nebula-gold-light) border border-(--nebula-gold)/30"
                        : "text-white hover:bg-white/10"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{code.label}</div>
                          {code.section && (
                            <div className="text-xs text-(--nebula-muted)">
                              Section {code.section}: {code.sectionDescription}
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
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {selectedCode && (
            <Button
              onClick={() => handleSelect(selectedCode.value)}
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
