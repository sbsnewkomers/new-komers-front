import { getApiBaseUrl } from "@/lib/apiClient";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  logo?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

type AuthHeaders = { accessToken: string | null };

function authHeaders({ accessToken }: AuthHeaders): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function getWorkspaces(accessToken: string | null): Promise<Workspace[]> {
  const res = await fetch(`${getApiBaseUrl()}/workspaces`, {
    method: "GET",
    headers: {
      ...authHeaders({ accessToken }),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Échec de la récupération des workspaces (${res.status})`);
  }

  return (await res.json()) as Workspace[];
}
