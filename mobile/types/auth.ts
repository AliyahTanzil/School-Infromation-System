export type AppRole = 'administrator' | 'staff';

export type AccountStatus = 'active' | 'pending' | 'suspended';

export type MobileSessionContext = {
  userId: string;
  schoolId: string | null;
  role: AppRole;
  permissions: string[];
  accountStatus: AccountStatus;
  deviceId: string | null;
};
