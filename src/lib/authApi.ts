import { apiFetch } from "@/lib/apiClient";

export type LoginPayload = { email: string; password: string };
export type TokenPair = { accessToken: string; refreshToken: string };
export type LoginResponse = {
  message: string;
  user: { id: string; email: string; role: string };
  tokens: TokenPair;
};

export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    snackbar: {
      showSuccess: true,
      successMessage: "Connexion réussie",
      showError: false,
    },
  });
}

export async function refreshTokens(refreshToken: string) {
  return apiFetch<TokenPair>("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    snackbar: { showSuccess: false, showError: false },
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
