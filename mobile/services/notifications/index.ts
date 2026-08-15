export type NotificationRegistration = { deviceId: string; platform: 'ios' | 'android' | 'web'; token: string };

export interface NotificationService {
  register(registration: NotificationRegistration): Promise<void>;
}

export const notifications: NotificationService = {
  register: async () => undefined,
};
