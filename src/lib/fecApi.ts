import { apiFetch, getApiBaseUrl, setAccessTokenGetter } from "./apiClient";

export interface FecUploadRequest {
  entityId: string;
  entityType: 'Group' | 'Company'; // Limité à Group et Company comme dans le backend
  file: File;
  userId: string;
}

export interface FecValidationError {
  line: number;
  column: string;
  value: string;
  reason: string;
}

export interface FecImportResponse {
  success: boolean;
  totalLines: number;
  validLinesCount: number;
  errors: FecValidationError[];
  message: string;
  importId?: string;
}

export async function uploadFecFile(data: FecUploadRequest): Promise<FecImportResponse> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('entityId', data.entityId);
  formData.append('entityType', data.entityType);

  return apiFetch<FecImportResponse>('/fec/import', {
    method: 'POST',
    body: formData,
    snackbar: {
      showSuccess: true,
      successMessage: 'Fichier FEC importé avec succès',
      showError: true,
    },
  });
}

export async function downloadErrorReport(errors: FecValidationError[]): Promise<void> {
  try {
    // Utiliser la même approche que PermissionsProvider pour récupérer le token
    const token = (() => {
      try {
        // Vérifier si on peut accéder à la variable globale du PermissionsProvider
        if (typeof window !== 'undefined') {
          const authData = localStorage.getItem('nk-auth-tokens'); // BONNE CLE !
          if (authData) {
            const parsed = JSON.parse(authData);
            return parsed.accessToken || null;
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    })();
    
    console.log('Download report - Token exists:', !!token);
    
    // Debug: voir ce qu'il y a dans le localStorage
    if (typeof window !== 'undefined') {
      console.log('Download report - localStorage keys:', Object.keys(localStorage));
      console.log('Download report - nk-auth content:', localStorage.getItem('nk-auth'));
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    
    console.log('Download report - Headers sent:', headers);
    
    const response = await fetch(`${getApiBaseUrl()}/fec/download-errors`, {
      method: 'POST',
      headers: headers,
      credentials: 'same-origin',
      body: JSON.stringify(errors),
    });

    if (!response.ok) {
      // Essayer de récupérer plus de détails sur l'erreur
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      } catch (e) {
        // Ignorer si on ne peut pas lire le corps de l'erreur
      }
      throw new Error(errorMessage);
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport_erreurs_fec.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    
    // Afficher plus de détails dans l'erreur
    if (error instanceof Error) {
      throw new Error(`Erreur lors du téléchargement du rapport: ${error.message}`);
    } else {
      throw new Error('Erreur lors du téléchargement du rapport');
    }
  }
}
