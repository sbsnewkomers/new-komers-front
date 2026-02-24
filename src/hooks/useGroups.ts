import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";

type Group = {
  id: string;
  name: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  siret: string;
  mainActivity?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CreateGroupDto = {
  name: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  siret: string;
  mainActivity?: string;
};

type UpdateGroupDto = Partial<CreateGroupDto>;

const defaultSnackbar = {
  showSuccess: true,
  showError: true,
};

export function useGroups() {
  const [list, setList] = useState<Group[] | null>(null);
  const [one, setOne] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Group[]>("/groups", {
        snackbar: { ...defaultSnackbar, showSuccess: false },
      });
      setList(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Group>(`/groups/${id}`, {
        snackbar: { ...defaultSnackbar, showSuccess: false },
      });
      setOne(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (dto: CreateGroupDto) => {
      setLoading(true);
      setError(null);
      try {
        const created = await apiFetch<Group>("/groups", {
          method: "POST",
          body: JSON.stringify(dto),
          snackbar: { ...defaultSnackbar, successMessage: "Groupe créé" },
        });
        setList((prev) => (prev ? [...prev, created] : [created]));
        return created;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const update = useCallback(
    async (id: string, dto: UpdateGroupDto) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await apiFetch<Group>(`/groups/${id}`, {
          method: "PUT",
          body: JSON.stringify(dto),
          snackbar: { ...defaultSnackbar, successMessage: "Groupe mis à jour" },
        });
        setList((prev) =>
          prev ? prev.map((g) => (g.id === id ? updated : g)) : prev,
        );
        if (one?.id === id) setOne(updated);
        return updated;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [one?.id],
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiFetch(`/groups/${id}`, {
          method: "DELETE",
          snackbar: { ...defaultSnackbar, successMessage: "Groupe supprimé" },
        });
        setList((prev) => (prev ? prev.filter((g) => g.id !== id) : prev));
        if (one?.id === id) setOne(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [one?.id],
  );

  return {
    list,
    one,
    loading,
    error,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
  };
}
