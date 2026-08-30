import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import { ListQuery, Page, Person, mobile4Endpoints, queryString } from '../api/contracts';

const options = async () => ({ accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined });

export const managementData = {
  listPeople: async (query?: ListQuery) => apiRequest<Page<Person>>(`${mobile4Endpoints.users}${queryString(query)}`, await options()),
};
