import { apiFetch } from "@/lib/apiClient";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = { message: string; user: { id: string; email: string; role: string } };

export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    snackbar: {
      showSuccess: true,
      successMessage: "Connexion réussie",
      errorMessage: "Identifiants invalides",
    },
  });
}

export async function logout() {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
    snackbar: {
      showSuccess: true,
      successMessage: "Déconnexion réussie",
      showError: true,
    },
  });
}
