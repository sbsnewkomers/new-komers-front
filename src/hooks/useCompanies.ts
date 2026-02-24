import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";

type CompanySize = "SMALL" | "MEDIUM" | "LARGE";
type CompanyModel = "HOLDING" | "SUBSIDIARY";

type Company = {
  id: string;
  name: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  siret: string;
  address?: string;
  ape_code?: string;
  main_activity?: string;
  size?: CompanySize;
  model?: CompanyModel;
  group_id: string;
  createdAt?: string;
  updatedAt?: string;
};

type CreateCompanyDto = {
  groupId: string;
  name: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  siret: string;
  address?: string;
  ape_code?: string;
  main_activity?: string;
  size?: CompanySize;
  model?: CompanyModel;
};

type UpdateCompanyDto = Partial<CreateCompanyDto>;

const defaultSnackbar = {
  showSuccess: true,
  showError: true,
};

export function useCompanies() {
  const [list, setList] = useState<Company[] | null>(null);
  const [one, setOne] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Company[]>("/companies", {
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

  const fetchListByGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Company[]>("/companies", {
        snackbar: { ...defaultSnackbar, showSuccess: false },
      });
      const filtered = data.filter((c) => c.group_id === groupId);
      setList(filtered);
      return filtered;
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
      const data = await apiFetch<Company>(`/companies/${id}`, {
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
    async (dto: CreateCompanyDto) => {
      setLoading(true);
      setError(null);
      try {
        const created = await apiFetch<Company>("/companies", {
          method: "POST",
          body: JSON.stringify(dto),
          snackbar: { ...defaultSnackbar, successMessage: "Entreprise créée" },
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
    async (id: string, dto: UpdateCompanyDto) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await apiFetch<Company>(`/companies/${id}`, {
          method: "PUT",
          body: JSON.stringify(dto),
          snackbar: {
            ...defaultSnackbar,
            successMessage: "Entreprise mise à jour",
          },
        });
        setList((prev) =>
          prev ? prev.map((c) => (c.id === id ? updated : c)) : prev,
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
        await apiFetch(`/companies/${id}`, {
          method: "DELETE",
          snackbar: { ...defaultSnackbar, successMessage: "Entreprise supprimée" },
        });
        setList((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
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
    fetchListByGroup,
    fetchOne,
    create,
    update,
    remove,
  };
}
