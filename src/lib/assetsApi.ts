import { apiFetch } from './apiClient';
import {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  UpdateAssetStatusDto,
  TotalAmortizationResponse,
  TotalAmortizationsResponse,
  EntityType,
} from '@/types/asset.types';

export const assetsApi = {
  createAsset: async (data: CreateAssetDto): Promise<Asset> => {
    return apiFetch<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAllAssets: async (): Promise<Asset[]> => {
    return apiFetch<Asset[]>('/assets');
  },

  getAssetsByEntity: async (entityType: EntityType, entityId: string): Promise<Asset[]> => {
    return apiFetch<Asset[]>(`/assets/entity/${entityType}/${entityId}`);
  },

  getAssetById: async (id: string): Promise<Asset> => {
    return apiFetch<Asset>(`/assets/${id}`);
  },

  getTotalAmortizationForYear: async (
    entityType: EntityType,
    entityId: string,
    year: number,
  ): Promise<TotalAmortizationResponse> => {
    return apiFetch<TotalAmortizationResponse>(
      `/assets/entity/${entityType}/${entityId}/total/${year}`,
    );
  },

  getTotalAmortizationForYears: async (
    entityType: EntityType,
    entityId: string,
    years?: number[],
  ): Promise<TotalAmortizationsResponse> => {
    let url = `/assets/entity/${entityType}/${entityId}/totals`;
    if (years && years.length > 0) {
      const queryString = new URLSearchParams({ years: years.join(',') }).toString();
      url += `?${queryString}`;
    }
    return apiFetch<TotalAmortizationsResponse>(url);
  },

  updateAsset: async (
    id: string,
    data: UpdateAssetDto,
  ): Promise<Asset> => {
    return apiFetch<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateAssetStatus: async (
    id: string,
    data: UpdateAssetStatusDto,
  ): Promise<Asset> => {
    return apiFetch<Asset>(`/assets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAsset: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch<{ success: boolean; message: string }>(`/assets/${id}`, {
      method: 'DELETE',
    });
  },

  getTotalAmortizationForAsset: async (id: string): Promise<{ total: number }> => {
    return apiFetch<{ total: number }>(`/assets/${id}/total-amortization`);
  },
};
