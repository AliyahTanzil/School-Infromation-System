export type AppEnvironment = 'development' | 'staging' | 'production';

const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development') as AppEnvironment;
const defaultBaseUrls: Record<AppEnvironment, string> = {
  development: 'http://localhost:3000/api/v1',
  staging: 'https://staging-api.sais.example.com/api/v1',
  production: 'https://api.sais.example.com/api/v1',
};

export const appConfig = {
  environment,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrls[environment],
  requestTimeoutMs: 15_000,
  isProduction: environment === 'production',
} as const;

if (appConfig.isProduction && appConfig.apiBaseUrl.includes('localhost')) {
  throw new Error('Production mobile builds cannot use localhost as their API base URL.');
}
