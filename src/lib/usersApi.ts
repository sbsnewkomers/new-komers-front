import { apiFetch } from "@/lib/apiClient";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "HEAD_MANAGER" | "MANAGER" | "END_USER";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type UserItem = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
};

const snackbar = { showSuccess: true, showError: true };

export async function fetchUsers(): Promise<UserItem[]> {
  return apiFetch<UserItem[]>("/users", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function fetchUser(id: string): Promise<UserItem> {
  return apiFetch<UserItem>(`/users/${id}`, {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: UserStatus;
  }
): Promise<UserItem> {
  return apiFetch<UserItem>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    snackbar: { successMessage: "Utilisateur mis à jour." },
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, {
    method: "DELETE",
    snackbar: { successMessage: "Utilisateur supprimé." },
  });
}

export const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "HEAD_MANAGER", "MANAGER", "END_USER"];
export const ALL_STATUSES: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED"];

export function roleLabel(r: UserRole): string {
  const labels: Record<UserRole, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    HEAD_MANAGER: "Head Manager",
    MANAGER: "Manager",
    END_USER: "Utilisateur",
  };
  return labels[r] ?? r;
}

export function statusLabel(s: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    PENDING: "En attente",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
  };
  return labels[s] ?? s;
}
