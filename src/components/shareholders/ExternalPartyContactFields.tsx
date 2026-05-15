"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Input } from "@/components/ui/Input";
import { CountrySelectModal } from "@/components/City-Country/CountrySelectModal";
import { locationService } from "@/lib/locationService";
import type { ExternalContactFields } from "@/lib/shareholdersApi";

type Props = {
  value: ExternalContactFields;
  onChange: (next: ExternalContactFields) => void;
  countryModalTitle?: string;
};

function countryLabel(code: string): string {
  if (!code) return "";
  const country = locationService.getCountryByCode(code);
  return country ? `${country.label} (${country.code})` : code;
}

/** Adresse (rue, CP, ville, pays) + téléphones fixe / mobile — actionnaires externes. */
export function ExternalPartyContactFields({
  value,
  onChange,
  countryModalTitle = "Sélectionner un pays",
}: Props) {
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  const patch = (partial: Partial<ExternalContactFields>) =>
    onChange({ ...value, ...partial });

  return (
    <>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground">Rue</label>
        <Input
          value={value.street ?? ""}
          onChange={(e) => patch({ street: e.target.value })}
          placeholder="Rue"
          autoComplete="street-address"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Code postal</label>
        <Input
          value={value.postalCode ?? ""}
          onChange={(e) => patch({ postalCode: e.target.value })}
          placeholder="Code postal"
          autoComplete="postal-code"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Ville</label>
        <Input
          value={value.city ?? ""}
          onChange={(e) => patch({ city: e.target.value })}
          placeholder="Ville"
          autoComplete="address-level2"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground">Pays</label>
        <button
          type="button"
          onClick={() => setCountryModalOpen(true)}
          className="min-h-10 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
        >
          <span className={value.country ? "text-foreground" : "text-muted-foreground"}>
            {value.country ? countryLabel(value.country) : "Sélectionner un pays"}
          </span>
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Téléphone fixe</label>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry="FR"
          value={value.phoneLandline ?? ""}
          onChange={(v) => patch({ phoneLandline: v ?? "" })}
          numberInputProps={{
            className:
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          }}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Téléphone mobile</label>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry="FR"
          value={value.phoneMobile ?? ""}
          onChange={(v) => patch({ phoneMobile: v ?? "" })}
          numberInputProps={{
            className:
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          }}
        />
      </div>
      <CountrySelectModal
        open={countryModalOpen}
        onOpenChange={setCountryModalOpen}
        value={value.country ?? ""}
        onChange={(country) => patch({ country })}
        title={countryModalTitle}
      />
    </>
  );
}
