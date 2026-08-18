import { apiRequest } from '../api/client';
import { ListQuery, Page, Person, Tenant, mobile4Endpoints, queryString } from '../api/contracts';

export const managementData = {
  listTenants: (query?: ListQuery) => apiRequest<Page<Tenant>>(`${mobile4Endpoints.tenants}${queryString(query)}`),
  listPeople: (query?: ListQuery) => apiRequest<Page<Person>>(`${mobile4Endpoints.users}${queryString(query)}`),
};
