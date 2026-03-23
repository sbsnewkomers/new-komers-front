import { apiFetch } from "@/lib/apiClient";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "HEAD_MANAGER" | "MANAGER" | "END_USER";
export type NodeType = "GROUP" | "COMPANY" | "BUSINESS_UNIT";

export type DataPerimeterItem = {
  nodeType: NodeType;
  nodeId: string;
};

export type InvitationItem = {
  id: string;
  email: string;
  token: string;
  role?: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  groupId?: string;
  dataPerimeter?: DataPerimeterItem[];
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  invitedBy?: { id: string; email: string; firstName?: string; lastName?: string };
  acceptedBy?: { id: string; email: string; firstName?: string; lastName?: string } | null;
  rejectedBy?: { id: string; email: string; firstName?: string; lastName?: string } | null;
};

export type InviteUserPayload = {
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  dataPerimeter?: DataPerimeterItem[];
};

const snackbar = { showSuccess: true, showError: true };

export async function sendInvitation(data: InviteUserPayload) {
  return apiFetch<{ message: string; invitation: { id: string; token: string; email: string; role: UserRole; expiresAt: string } }>(
    "/invitations/invite-user",
    { method: "POST", body: JSON.stringify(data), snackbar: { successMessage: "Invitation envoy\u00e9e avec succ\u00e8s." } },
  );
}

export async function fetchAllInvitations(): Promise<InvitationItem[]> {
  return apiFetch<InvitationItem[]>("/invitations/invitations", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function fetchPendingInvitations(): Promise<InvitationItem[]> {
  return apiFetch<InvitationItem[]>("/invitations/pending-invitations", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function fetchAcceptedInvitations(): Promise<InvitationItem[]> {
  return apiFetch<InvitationItem[]>("/invitations/accepted-invitations", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function fetchRejectedInvitations(): Promise<InvitationItem[]> {
  return apiFetch<InvitationItem[]>("/invitations/rejected-invitations", {
    snackbar: { ...snackbar, showSuccess: false },
  });
}

export async function acceptInvitation(invitationToken: string) {
  return apiFetch<{ message: string }>("/invitations/accept-invitation", {
    method: "POST",
    body: JSON.stringify({ invitationToken }),
    snackbar: { successMessage: "Invitation accept\u00e9e." },
  });
}

export async function rejectInvitation(invitationToken: string) {
  return apiFetch<{ message: string }>("/invitations/reject-invitation", {
    method: "POST",
    body: JSON.stringify({ invitationToken }),
    snackbar: { successMessage: "Invitation rejet\u00e9e." },
  });
}

export const INVITATION_STATUSES: InvitationStatus[] = ["PENDING", "ACCEPTED", "REJECTED"];

export function invitationStatusLabel(s: InvitationStatus): string {
  const labels: Record<InvitationStatus, string> = {
    PENDING: "En attente",
    ACCEPTED: "Accept\u00e9e",
    REJECTED: "Rejet\u00e9e",
  };
  return labels[s] ?? s;
}

export function invitationStatusColor(s: InvitationStatus): string {
  const colors: Record<InvitationStatus, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
  };
  return colors[s] ?? "";
}

export function allowedInviteRoles(currentRole: UserRole): UserRole[] {
  switch (currentRole) {
    case "SUPER_ADMIN":
      return ["ADMIN", "HEAD_MANAGER", "MANAGER", "END_USER"];
    case "ADMIN":
      return ["ADMIN", "HEAD_MANAGER", "MANAGER", "END_USER"];
    case "HEAD_MANAGER":
      return ["MANAGER", "END_USER"];
    case "MANAGER":
      return ["MANAGER", "END_USER"];
    default:
      return [];
  }
}
