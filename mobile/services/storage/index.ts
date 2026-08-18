export interface SecureStorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const secureStorage: SecureStorageAdapter = {
  get: async () => null,
  set: async () => undefined,
  remove: async () => undefined,
};
