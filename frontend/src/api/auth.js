import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalApiUrl = configuredApiUrl && /localhost|127\.0\.0\.1/.test(configuredApiUrl);
const api = axios.create({
  // Production must use the deployed same-origin function, never a localhost URL from local development.
  baseURL: configuredApiUrl && !isLocalApiUrl ? configuredApiUrl.replace(/\/$/, '') : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const accessTokenStorageKey = 'sais.accessToken';
let accessToken =
  typeof window !== 'undefined' ? window.sessionStorage.getItem(accessTokenStorageKey) : null;

export const setAccessToken = (token) => {
  accessToken = token || null;
  if (typeof window === 'undefined') return;
  if (accessToken) window.sessionStorage.setItem(accessTokenStorageKey, accessToken);
  else window.sessionStorage.removeItem(accessTokenStorageKey);
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      !accessToken ||
      error.response?.status !== 401 ||
      originalRequest?._authRetry ||
      originalRequest?.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }
    originalRequest._authRetry = true;
    try {
      await refresh();
      return api(originalRequest);
    } catch {
      setAccessToken(null);
      return Promise.reject(error);
    }
  }
);

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  setAccessToken(data.data.accessToken);
  return data.data;
}
export async function register(values) {
  const { data } = await api.post('/auth/register', values);
  setAccessToken(data.data.accessToken);
  return data.data;
}
export async function refresh() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.data.accessToken);
  return data.data;
}
export async function logout() {
  await api.post('/auth/logout');
  setAccessToken(null);
}
export async function me() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
export async function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email });
}
export async function resetPassword(values) {
  return api.post('/auth/reset-password', values);
}
export async function verifyEmail(token) {
  return api.post('/auth/verify-email', { token });
}
export async function listActivationRequests() {
  const { data } = await api.get('/activation-requests');
  return data.data;
}
export async function decideActivationRequest(id, decision) {
  const { data } = await api.post(`/activation-requests/${id}/decision`, { decision });
  return data.data;
}
export async function listDevelopmentOutbox() {
  const { data } = await api.get('/activation-requests/outbox');
  return data.data;
}
export default api;
