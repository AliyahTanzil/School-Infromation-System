import { can } from '../services/auth/permissions';
import { isSafeNotificationPath } from '../services/communication/contracts';

if (!can('student', 'communication.read')) throw new Error('Students should read notifications');
if (!isSafeNotificationPath('/notifications/notice-1')) throw new Error('Internal notification path should be safe');
if (isSafeNotificationPath('https://example.com')) throw new Error('External notification path should be rejected');
if (isSafeNotificationPath('//example.com')) throw new Error('Protocol-relative notification path should be rejected');
