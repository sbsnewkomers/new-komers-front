import { Country, State, City, ICity } from 'country-state-city';

export interface CountryOption {
  value: string;
  label: string;
  code: string;
  flag?: string;
}

export interface StateOption {
  value: string;
  label: string;
  countryCode: string;
}

export interface CityOption {
  value: string;
  label: string;
  stateCode: string;
  countryCode: string;
}

class LocationService {
  // Cache pour éviter de recharger les données à chaque appel
  private countriesCache: CountryOption[] | null = null;
  private statesCache: Map<string, StateOption[]> = new Map();
  private citiesCache: Map<string, CityOption[]> = new Map();

  /**
   * Récupère tous les pays
   */
  getCountries(): CountryOption[] {
    if (this.countriesCache) {
      return this.countriesCache;
    }

    try {
      let displayNames: Intl.DisplayNames | null = null;
      try {
        displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });
      } catch {
        // Fallback si non supporté
      }

      const countries = Country.getAllCountries().map(country => ({
        value: country.isoCode,
        label: displayNames ? (displayNames.of(country.isoCode) ?? country.name) : country.name,
        code: country.isoCode,
        flag: country.flag
      }));

      // Trier par nom en français
      this.countriesCache = countries.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      return this.countriesCache;
    } catch (error) {
      console.error('Erreur lors du chargement des pays:', error);
      return [];
    }
  }

  /**
   * Récupère les états/régions d'un pays
   */
  getStates(countryCode: string): StateOption[] {
    if (this.statesCache.has(countryCode)) {
      return this.statesCache.get(countryCode)!;
    }

    try {
      const states = State.getStatesOfCountry(countryCode).map(state => ({
        value: state.isoCode,
        label: state.name,
        countryCode: state.countryCode
      }));

      // Trier par nom
      const sortedStates = states.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      this.statesCache.set(countryCode, sortedStates);
      return sortedStates;
    } catch (error) {
      console.error(`Erreur lors du chargement des états pour ${countryCode}:`, error);
      return [];
    }
  }

  /**
   * Récupère les villes d'un état
   */
  getCities(countryCode: string, stateCode?: string): CityOption[] {
    const cacheKey = stateCode ? `${countryCode}-${stateCode}` : countryCode;

    if (this.citiesCache.has(cacheKey)) {
      return this.citiesCache.get(cacheKey)!;
    }

    try {
      let cities: ICity[];

      if (stateCode) {
        // Villes d'un état spécifique
        cities = City.getCitiesOfState(countryCode, stateCode) || [];
      } else {
        // Toutes les villes du pays
        cities = City.getCitiesOfCountry(countryCode) || [];
      }

      const cityOptions = cities.map(city => ({
        value: city.name,
        label: city.name,
        stateCode: city.stateCode,
        countryCode: city.countryCode
      }));

      // Trier par nom et limiter à 1000 villes pour la performance
      const sortedCities = cityOptions
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
        .slice(0, 1000);

      this.citiesCache.set(cacheKey, sortedCities);
      return sortedCities;
    } catch (error) {
      console.error(`Erreur lors du chargement des villes pour ${cacheKey}:`, error);
      return [];
    }
  }

  /**
   * Recherche de pays avec filtre
   */
  searchCountries(query: string): CountryOption[] {
    const countries = this.getCountries();
    if (!query) return countries;

    const searchTerm = query.toLowerCase();
    return countries.filter(country =>
      country.label.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Recherche de villes avec filtre
   */
  searchCities(countryCode: string, query: string, stateCode?: string): CityOption[] {
    const cities = this.getCities(countryCode, stateCode);
    if (!query) return cities;

    const searchTerm = query.toLowerCase();
    return cities.filter(city =>
      city.label.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Récupère un pays par son code
   */
  getCountryByCode(countryCode: string): CountryOption | undefined {
    const countries = this.getCountries();
    return countries.find(country => country.code === countryCode);
  }

  /**
   * Vide les caches (utile pour les tests ou rechargement)
   */
  clearCache(): void {
    this.countriesCache = null;
    this.statesCache.clear();
    this.citiesCache.clear();
  }
}

// Export singleton
export const locationService = new LocationService();
