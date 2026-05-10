// Types pour les données NAF/APE (correspondant aux colonnes du fichier Excel)
export interface NafApeCodeRaw {
  "Code NAF / APE": string;
  "Description": string;
  "Section": number;
  "Description section": string;
}

export interface NafApeCode {
  code: string;
  description: string;
  section: string;
  sectionDescription: string;
}

export interface ApeCodeOption {
  value: string;
  label: string;
  section?: string;
  sectionDescription?: string;
}

// Import direct du fichier JSON local
import nafApeData from '@/components/structure/code_NAF_APE.json';

// Fonction pour charger et transformer les données depuis le fichier JSON local
export function loadNafApeCodes(): NafApeCode[] {
  try {
    // Le fichier est importé directement avec ses noms de colonnes originaux
    const rawData: NafApeCodeRaw[] = nafApeData as NafApeCodeRaw[];
    
    // Transformer les données au format attendu
    return rawData
      .filter(item => item["Code NAF / APE"] && item["Description"])
      .map(item => ({
        code: item["Code NAF / APE"],
        description: item["Description"],
        section: item["Section"].toString(),
        sectionDescription: item["Description section"]
      }));
  } catch (error) {
    console.error('Erreur lors du chargement des codes NAF/APE:', error);
    
    // Retourner une liste par défaut en cas d'erreur
    return [
      { code: "6201Z", description: "Programmation informatique", section: "J", sectionDescription: "Information et communication" },
      { code: "6202Z", description: "Conseil en systèmes et logiciels informatiques", section: "J", sectionDescription: "Information et communication" },
      { code: "6203Z", description: "Gestion d'installations informatiques", section: "J", sectionDescription: "Information et communication" },
      { code: "6311Z", description: "Traitement de données, hébergement et activités connexes", section: "J", sectionDescription: "Information et communication" },
      { code: "6312Z", description: "Portails web", section: "J", sectionDescription: "Information et communication" },
    ];
  }
}

// Fonction pour formater les codes pour le composant ApeCodeSelect
export function formatNafApeForSelect(nafApeCodes: NafApeCode[]): ApeCodeOption[] {
  return nafApeCodes.map(item => ({
    value: item.code,
    label: `${item.code} - ${item.description}`,
    section: item.section,
    sectionDescription: item.sectionDescription
  }));
}

// Export des codes formatés pour utilisation directe
export const APE_CODES = formatNafApeForSelect(loadNafApeCodes());
