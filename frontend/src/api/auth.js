import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

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
export default api;
