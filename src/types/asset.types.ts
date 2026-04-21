export enum AmortizationType {
  LINEAR = 'LINEAR',
  DEGRESSIVE = 'DEGRESSIVE',
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  FULLY_AMORTIZED = 'FULLY_AMORTIZED',
  DISPOSED = 'DISPOSED',
}

export enum EntityType {
  GROUP = 'group',
  COMPANY = 'company',
  BUSINESS_UNIT = 'business unit',
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  acquisitionAmount: number;
  acquisitionDate: string;
  amortizationDurationYears: number;
  amortizationType: AmortizationType;
  status: AssetStatus;
  residualValue: number;
  commissioningDate?: string;
  disposalDate?: string;
  disposalAmount?: number;
  entityType: EntityType;
  entityId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  amortizationSchedules?: AmortizationSchedule[];
}

export interface AmortizationSchedule {
  id: string;
  year: number;
  annualAmortizationAmount: number;
  cumulativeAmortization: number;
  netBookValue: number;
  monthlyAmortizationAmount: number;
  isProrata: boolean;
  monthsUsed?: number;
  assetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  name: string;
  description?: string;
  acquisitionAmount: number;
  acquisitionDate: string;
  amortizationDurationYears: number;
  amortizationType?: AmortizationType;
  status?: AssetStatus;
  residualValue?: number;
  commissioningDate?: string;
  disposalDate?: string;
  disposalAmount?: number;
  entityType?: EntityType;
  entityId: string;
}

export interface UpdateAssetStatusDto {
  status: AssetStatus;
  disposalDate?: string;
  disposalAmount?: number;
}

export interface UpdateAssetDto {
  name?: string;
  description?: string;
  acquisitionAmount?: number;
  acquisitionDate?: string;
  amortizationDurationYears?: number;
  amortizationType?: AmortizationType;
  status?: AssetStatus;
  residualValue?: number;
  commissioningDate?: string;
  disposalDate?: string;
  disposalAmount?: number;
  entityType?: EntityType;
  entityId?: string;
}

export interface TotalAmortizationResponse {
  total: number;
  year: number;
  entityType: string;
  entityId: string;
}

export interface TotalAmortizationsResponse {
  totals: Array<{
    year: number;
    total: number;
  }>;
}

// Types pour le mode global simplifié
export interface GlobalDotation {
  id: string;
  year: number;
  totalAmount: number;
  monthlyAmount: number;
  entityType: EntityType;
  entityId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlobalDotationDto {
  year: number;
  totalAmount: number;
  entityType: EntityType;
  entityId: string;
}

export interface UpdateGlobalDotationDto {
  totalAmount: number;
}
