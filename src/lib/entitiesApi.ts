import { apiFetch } from './apiClient';
import type { BusinessUnitApi } from '@/types/business-unit';

interface Group {
    id: string;
    name: string;
    // autres champs du groupe...
}

interface Company {
    id: string;
    name: string;
    // autres champs de l'entreprise...
}

class EntitiesApi {
    async getGroup(id: string): Promise<Group> {
        return apiFetch<Group>(`/groups/${id}`);
    }

    async getGroups(): Promise<Group[]> {
        return apiFetch<Group[]>('/groups');
    }

    async getCompany(id: string): Promise<Company> {
        return apiFetch<Company>(`/companies/${id}`);
    }

    async getCompanies(): Promise<Company[]> {
        return apiFetch<Company[]>('/companies');
    }

    async getBusinessUnit(companyId: string, buId: string): Promise<BusinessUnitApi> {
        return apiFetch<BusinessUnitApi>(`/companies/${companyId}/business-units/${buId}`);
    }

    async getBusinessUnits(companyId: string): Promise<BusinessUnitApi[]> {
        return apiFetch<BusinessUnitApi[]>(`/companies/${companyId}/business-units`);
    }

    async getBusinessUnitsForUser(): Promise<BusinessUnitApi[]> {
        return apiFetch<BusinessUnitApi[]>(`/business-units/user`);
    }

    async getEntityName(entityType: string, entityId: string): Promise<string> {
        try {
            switch (entityType) {
                case 'group':
                    const group = await this.getGroup(entityId);
                    return group?.name || `${entityType} #${entityId.slice(0, 8)}...`;
                case 'company':
                    const company = await this.getCompany(entityId);
                    return company?.name || `${entityType} #${entityId.slice(0, 8)}...`;
                case 'business unit':
                    try {
                        // Utiliser le nouvel endpoint direct pour récupérer la business unit par son ID
                        const businessUnit = await apiFetch<BusinessUnitApi>(`/business-units/${entityId}`);
                        return businessUnit?.name || `Business Unit #${entityId.slice(0, 8)}...`;
                    } catch (error) {
                        console.error('Erreur lors de la récupération de la business unit:', error);
                        return `Business Unit #${entityId.slice(0, 8)}...`;
                    }
                default:
                    return `${entityType} #${entityId.slice(0, 8)}...`;
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'entité ${entityType}:${entityId}`, error);
            return `${entityType} #${entityId.slice(0, 8)}...`;
        }
    }
}

export const entitiesApi = new EntitiesApi();
export type { Group, Company, BusinessUnitApi as BusinessUnit };
