import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import { ListQuery, Page, Person, Tenant, mobile4Endpoints, queryString } from '../api/contracts';

const options = async () => ({ accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined });

export const managementData = {
  listTenants: async (query?: ListQuery) => apiRequest<Page<Tenant>>(`${mobile4Endpoints.tenants}${queryString(query)}`, await options()),
  listPeople: async (query?: ListQuery) => apiRequest<Page<Person>>(`${mobile4Endpoints.users}${queryString(query)}`, await options()),
};
