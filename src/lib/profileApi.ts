import { apiFetch } from "@/lib/apiClient";

export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
};

export type UpdatePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export async function updateProfile(data: UpdateProfileDto) {
  return apiFetch("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
    snackbar: { 
      successMessage: "Profil mis à jour avec succès",
      showError: true 
    },
  });
}

export async function updatePassword(data: UpdatePasswordDto) {
  return apiFetch("/auth/update-password", {
    method: "PUT",
    body: JSON.stringify(data),
    snackbar: { 
      successMessage: "Mot de passe mis à jour avec succès",
      showError: true 
    },
  });
}
