import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";

type BusinessUnit = {
  id: string;
  name: string;
  code: string;
  activity: string;
  siret: string;
  country: string;
  logo?: string;
  company_id?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CreateBusinessUnitDto = {
  name: string;
  code: string;
  activity: string;
  siret: string;
  country: string;
};

type UpdateBusinessUnitDto = Partial<CreateBusinessUnitDto>;

const defaultSnackbar = {
  showSuccess: true,
  showError: true,
};

export function useBusinessUnits(companyId: string | null) {
  const [list, setList] = useState<BusinessUnit[] | null>(null);
  const [one, setOne] = useState<BusinessUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = companyId
    ? `/companies/${companyId}/business-units`
    : null;

  const fetchList = useCallback(async () => {
    if (!basePath) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BusinessUnit[]>(basePath, {
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
  }, [basePath]);

  const fetchOne = useCallback(
    async (buId: string) => {
      if (!basePath) throw new Error("companyId required");
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<BusinessUnit>(`${basePath}/${buId}`, {
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
    },
    [basePath],
  );

  const create = useCallback(
    async (dto: CreateBusinessUnitDto) => {
      if (!basePath) throw new Error("companyId required");
      setLoading(true);
      setError(null);
      try {
        const created = await apiFetch<BusinessUnit>(basePath, {
          method: "POST",
          body: JSON.stringify(dto),
          snackbar: {
            ...defaultSnackbar,
            successMessage: "Business unit créée",
          },
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
    [basePath],
  );

  const update = useCallback(
    async (buId: string, dto: UpdateBusinessUnitDto) => {
      if (!basePath) throw new Error("companyId required");
      setLoading(true);
      setError(null);
      try {
        const updated = await apiFetch<BusinessUnit>(`${basePath}/${buId}`, {
          method: "PUT",
          body: JSON.stringify(dto),
          snackbar: {
            ...defaultSnackbar,
            successMessage: "Business unit mise à jour",
          },
        });
        setList((prev) =>
          prev ? prev.map((b) => (b.id === buId ? updated : b)) : prev,
        );
        if (one?.id === buId) setOne(updated);
        return updated;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [basePath, one?.id],
  );

  const remove = useCallback(
    async (buId: string) => {
      if (!basePath) throw new Error("companyId required");
      setLoading(true);
      setError(null);
      try {
        await apiFetch(`${basePath}/${buId}`, {
          method: "DELETE",
          snackbar: {
            ...defaultSnackbar,
            successMessage: "Business unit supprimée",
          },
        });
        setList((prev) => (prev ? prev.filter((b) => b.id !== buId) : prev));
        if (one?.id === buId) setOne(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [basePath, one?.id],
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
