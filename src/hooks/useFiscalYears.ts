import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiClient";

type FiscalYear = {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "CLOSED" | "PENDING";
  company_id?: string;
  group_id?: string;
  createdAt?: string;
  updatedAt?: string;
};

const defaultSnackbar = {
  showSuccess: true,
  showError: true,
};

export function useFiscalYears() {
  const [list, setList] = useState<FiscalYear[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCompany = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<FiscalYear[]>(`/companies/${companyId}/fiscal-years`, {
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

  const fetchByGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<FiscalYear[]>(`/groups/${groupId}/fiscal-years`, {
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
      const data = await apiFetch<FiscalYear>(`/fiscal-years/${id}`, {
        snackbar: { ...defaultSnackbar, showSuccess: false },
      });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    list,
    loading,
    error,
    fetchByCompany,
    fetchByGroup,
    fetchOne,
  };
}
