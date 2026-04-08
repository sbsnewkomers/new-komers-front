import { apiFetch } from './apiClient';

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

interface BusinessUnit {
    id: string;
    name: string;
    // autres champs de l'unité commerciale...
}

class EntitiesApi {
    async getGroup(id: string): Promise<Group> {
        return apiFetch<Group>(`/groups/${id}`);
    }

    async getCompany(id: string): Promise<Company> {
        return apiFetch<Company>(`/companies/${id}`);
    }

    async getBusinessUnit(companyId: string, buId: string): Promise<BusinessUnit> {
        return apiFetch<BusinessUnit>(`/companies/${companyId}/business-units/${buId}`);
    }

    async getEntityName(entityType: string, entityId: string): Promise<string> {
        try {
            switch (entityType) {
                case 'group':
                    const group = await this.getGroup(entityId);
                    return group.name;
                case 'company':
                    const company = await this.getCompany(entityId);
                    return company.name;
                case 'business unit':
                    // Pour les business units, l'ID est probablement au format "companyId:buId"
                    const [companyId, buId] = entityId.split(':');
                    if (companyId && buId) {
                        const businessUnit = await this.getBusinessUnit(companyId, buId);
                        return businessUnit.name;
                    } else {
                        // Fallback: essayer avec l'ID direct si le format est différent
                        const businessUnit = await this.getBusinessUnit(entityId, entityId);
                        return businessUnit.name;
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
export type { Group, Company, BusinessUnit };
