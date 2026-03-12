import { apiFetch } from "@/lib/apiClient";

export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
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
