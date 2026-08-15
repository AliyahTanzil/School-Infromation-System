export type AppRole = 'owner' | 'tenant' | 'administrator' | 'staff';

export type AccountStatus = 'active' | 'pending' | 'suspended';

export type MobileSessionContext = {
  userId: string;
  tenantId: string | null;
  role: AppRole;
  permissions: string[];
  accountStatus: AccountStatus;
  deviceId: string | null;
};
