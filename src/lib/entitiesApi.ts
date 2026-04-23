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

    async getGroups(): Promise<Group[]> {
        return apiFetch<Group[]>('/groups');
    }

    async getCompany(id: string): Promise<Company> {
        return apiFetch<Company>(`/companies/${id}`);
    }

    async getCompanies(): Promise<Company[]> {
        return apiFetch<Company[]>('/companies');
    }

    async getBusinessUnit(companyId: string, buId: string): Promise<BusinessUnit> {
        return apiFetch<BusinessUnit>(`/companies/${companyId}/business-units/${buId}`);
    }

    async getBusinessUnits(companyId: string): Promise<BusinessUnit[]> {
        return apiFetch<BusinessUnit[]>(`/companies/${companyId}/business-units`);
    }

    async getBusinessUnitsForUser(): Promise<BusinessUnit[]> {
        return apiFetch<BusinessUnit[]>(`/business-units/user`);
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
                    // Pour les business units, l'ID est probablement au format "companyId:buId"
                    const [companyId, buId] = entityId.split(':');
                    if (companyId && buId) {
                        try {
                            const businessUnit = await this.getBusinessUnit(companyId, buId);
                            return businessUnit?.name || `Business Unit #${buId}`;
                        } catch (error) {
                            console.error('Erreur lors de la récupération de la business unit:', error);
                            return `Business Unit #${buId}`;
                        }
                    } else {
                        // Fallback: essayer avec l'ID direct si le format est différent
                        try {
                            // Tenter de récupérer toutes les business units et chercher celle qui correspond
                            const companies = await this.getCompanies();
                            for (const company of companies) {
                                try {
                                    const businessUnits = await this.getBusinessUnits(company.id);
                                    const foundBu = businessUnits.find(bu => bu.id === entityId);
                                    if (foundBu) {
                                        return foundBu.name || `Business Unit #${foundBu.id}`;
                                    }
                                } catch (e) {
                                    continue; // Ignorer les erreurs pour cette entreprise
                                }
                            }
                        } catch (error) {
                            console.error('Erreur lors de la recherche de business unit:', error);
                        }
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
export type { Group, Company, BusinessUnit };
