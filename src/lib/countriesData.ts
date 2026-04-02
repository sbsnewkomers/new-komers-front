// Types pour les données pays
export interface CountryRaw {
  id: number;
  name: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: number;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  flag: string;
}

export interface Country {
  id: number;
  name: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

export interface CountryOption {
  value: string;
  label: string;
  code: string;
}

// Import direct du fichier JSON local
import countriesData from '@/components/structure/countries.json';

// Fonction pour charger et transformer les données depuis le fichier JSON local
export function loadCountries(): Country[] {
  try {
    // Le fichier est importé directement avec ses noms de colonnes originaux
    const rawData: CountryRaw[] = countriesData as CountryRaw[];
    
    // Transformer les données au format attendu
    return rawData
      .filter(item => item.name && item.isoAlpha2)
      .map(item => ({
        id: item.id,
        name: item.name,
        isoAlpha2: item.isoAlpha2,
        isoAlpha3: item.isoAlpha3,
        isoNumeric: item.isoNumeric,
        currencyCode: item.currency.code,
        currencyName: item.currency.name,
        currencySymbol: item.currency.symbol
      }));
  } catch (error) {
    console.error('Erreur lors du chargement des pays:', error);
    
    // Retourner une liste par défaut en cas d'erreur
    return [
      { id: 76, name: "France", isoAlpha2: "FR", isoAlpha3: "FRA", isoNumeric: 250, currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
      { id: 840, name: "États-Unis", isoAlpha2: "US", isoAlpha3: "USA", isoNumeric: 840, currencyCode: "USD", currencyName: "Dollar américain", currencySymbol: "$" },
      { id: 124, name: "Canada", isoAlpha2: "CA", isoAlpha3: "CAN", isoNumeric: 124, currencyCode: "CAD", currencyName: "Dollar canadien", currencySymbol: "$" },
      { id: 826, name: "Royaume-Uni", isoAlpha2: "GB", isoAlpha3: "GBR", isoNumeric: 826, currencyCode: "GBP", currencyName: "Livre sterling", currencySymbol: "£" },
      { id: 380, name: "Italie", isoAlpha2: "IT", isoAlpha3: "ITA", isoNumeric: 380, currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    ];
  }
}

// Fonction pour formater les pays pour le composant CountrySelect
export function formatCountriesForSelect(countries: Country[]): CountryOption[] {
  return countries.map(item => ({
    value: item.isoAlpha2,
    label: item.name,
    code: item.isoAlpha2
  }));
}

// Export des pays formatés pour utilisation directe
export const COUNTRIES = formatCountriesForSelect(loadCountries());
