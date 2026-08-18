import * as SecureStore from 'expo-secure-store';

const keys = {
  applicationToken: 'sais.application-token',
  accessToken: 'sais.access-token',
} as const;

export const secureAuthStorage = {
  async getApplicationToken() {
    return SecureStore.getItemAsync(keys.applicationToken);
  },
  async setApplicationToken(value: string) {
    await SecureStore.setItemAsync(keys.applicationToken, value);
  },
  async getAccessToken() {
    return SecureStore.getItemAsync(keys.accessToken);
  },
  async setAccessToken(value: string) {
    await SecureStore.setItemAsync(keys.accessToken, value);
  },
  async clear() {
    await Promise.all(Object.values(keys).map((key) => SecureStore.deleteItemAsync(key)));
  },
};
