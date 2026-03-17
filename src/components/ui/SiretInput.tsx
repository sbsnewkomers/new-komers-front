"use client";

import React from "react";
import { Input } from "@/components/ui/Input";

// Validation du numéro SIRET (14 chiffres)
export const validateSiret = (siret: string): boolean => {
  // Supprimer tous les caractères non numériques
  const siretNumber = siret.replace(/\D/g, '');
  return siretNumber.length === 14;
};

interface SiretInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SiretInput({ 
  value, 
  onChange, 
  className = "",
  placeholder = "14 chiffres"
}: SiretInputProps) {
  const [error, setError] = React.useState<string>("");
  
  const handleChange = (newValue: string) => {
    if (!validateSiret(newValue)) {
      setError("Le SIRET doit contenir exactement 14 chiffres");
    } else {
      setError("");
    }
    onChange(newValue);
  };

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={error ? `border-red-500 ${className}` : className}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
