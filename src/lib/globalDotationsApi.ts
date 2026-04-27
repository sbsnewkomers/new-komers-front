import { apiFetch } from './apiClient';
import {
  GlobalDotation,
  CreateGlobalDotationDto,
  UpdateGlobalDotationDto,
  EntityType,
} from '@/types/asset.types';

export const globalDotationsApi = {
  createGlobalDotation: async (data: CreateGlobalDotationDto): Promise<GlobalDotation> => {
    return apiFetch<GlobalDotation>('/global-dotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAllGlobalDotations: async (
    entityType: EntityType,
    entityId: string,
  ): Promise<GlobalDotation[]> => {
    return apiFetch<GlobalDotation[]>(
      `/global-dotations?entityType=${entityType}&entityId=${entityId}`
    );
  },

  getGlobalDotationById: async (id: string): Promise<GlobalDotation> => {
    return apiFetch<GlobalDotation>(`/global-dotations/${id}`);
  },

  getGlobalDotationsByYear: async (
    entityType: EntityType,
    entityId: string,
    year: number,
  ): Promise<GlobalDotation[]> => {
    return apiFetch<GlobalDotation[]>(
      `/global-dotations/by-year/${year}?entityType=${entityType}&entityId=${entityId}`
    );
  },

  getGlobalDotationsStats: async (
    entityType: EntityType,
    entityId: string,
  ): Promise<{
    totalAmount: number;
    currentYearAmount: number;
    averageMonthlyAmount: number;
    count: number;
  }> => {
    return apiFetch<{
      totalAmount: number;
      currentYearAmount: number;
      averageMonthlyAmount: number;
      count: number;
    }>(`/global-dotations/stats/${entityType}/${entityId}`);
  },

  updateGlobalDotation: async (
    id: string,
    data: UpdateGlobalDotationDto,
  ): Promise<GlobalDotation> => {
    return apiFetch<GlobalDotation>(`/global-dotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  validateGlobalDotation: async (id: string): Promise<GlobalDotation> => {
    return apiFetch<GlobalDotation>(`/global-dotations/${id}/validate`, {
      method: 'PUT',
    });
  },

  invalidateGlobalDotation: async (id: string): Promise<GlobalDotation> => {
    return apiFetch<GlobalDotation>(`/global-dotations/${id}/invalidate`, {
      method: 'PUT',
    });
  },

  deleteGlobalDotation: async (id: string): Promise<void> => {
    return apiFetch<void>(`/global-dotations/${id}`, {
      method: 'DELETE',
    });
  },
};
