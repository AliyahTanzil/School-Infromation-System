import crypto from 'node:crypto';
import XLSX from 'xlsx';
import prisma from '../src/infrastructure/orm/prismaClient.js';
import passwordService from '../src/infrastructure/hash/passwordService.js';

const accounts = [
  { role: 'APPLICATION_MANAGER', accountType: 'APPLICATION_MANAGER', firstName: 'Amara', lastName: 'Kamara', email: 'owner@demo.sais.local', password: 'OwnerDemo!2026' },
  { role: 'SCHOOL_ADMIN', accountType: 'TENANT_ADMIN', firstName: 'Fatmata', lastName: 'Conteh', email: 'school-admin@demo.sais.local', password: 'SchoolAdmin!2026' },
  { role: 'TEACHER', accountType: 'TENANT_ADMIN', firstName: 'Mohamed', lastName: 'Koroma', email: 'teacher@demo.sais.local', password: 'TeacherDemo!2026' },
  { role: 'STUDENT', accountType: 'TENANT_ADMIN', firstName: 'Mariama', lastName: 'Sesay', email: 'student@demo.sais.local', password: 'StudentDemo!2026' },
  { role: 'PARENT', accountType: 'TENANT_ADMIN', firstName: 'Kadiatu', lastName: 'Bangura', email: 'parent@demo.sais.local', password: 'ParentDemo!2026' },
  { role: 'ACCOUNTANT', accountType: 'TENANT_ADMIN', firstName: 'Ibrahim', lastName: 'Turay', email: 'accountant@demo.sais.local', password: 'AccountantDemo!2026' },
  { role: 'LIBRARIAN', accountType: 'TENANT_ADMIN', firstName: 'Hawa', lastName: 'Jalloh', email: 'librarian@demo.sais.local', password: 'LibrarianDemo!2026' },
  { role: 'TRANSPORT_MANAGER', accountType: 'TENANT_ADMIN', firstName: 'Sorie', lastName: 'Foray', email: 'transport@demo.sais.local', password: 'TransportDemo!2026' },
  { role: 'HR_MANAGER', accountType: 'TENANT_ADMIN', firstName: 'Adama', lastName: 'Lamin', email: 'hr@demo.sais.local', password: 'HrDemo!2026' },
];

async function main() {
  const now = new Date();
  const tenantKey = 'demo-tenant-2026';
  const roleIds = new Map();
  for (const account of accounts) {
    const role = await prisma.role.upsert({
      where: { code: account.role },
      update: { name: account.role.replaceAll('_', ' '), updatedAt: now },
      create: { id: crypto.randomUUID(), code: account.role, name: account.role.replaceAll('_', ' '), isSystem: true, isAssignable: true, updatedAt: now },
    });
    roleIds.set(account.role, role.id);
  }

  const workbookRows = [];
  for (const account of accounts) {
    const passwordHash = await passwordService.hashPassword(account.password);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, status: 'ACTIVE', accountType: account.accountType, emailVerifiedAt: now, updatedAt: now },
      create: { id: crypto.randomUUID(), email: account.email, passwordHash, status: 'ACTIVE', accountType: account.accountType, emailVerifiedAt: now, updatedAt: now },
    });
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { firstName: account.firstName, lastName: account.lastName, preferredName: account.firstName, completionPct: 100, updatedAt: now },
      create: { id: crypto.randomUUID(), userId: user.id, firstName: account.firstName, lastName: account.lastName, preferredName: account.firstName, completionPct: 100, updatedAt: now },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId_scopeKey: { userId: user.id, roleId: roleIds.get(account.role), scopeKey: account.accountType === 'APPLICATION_MANAGER' ? 'global' : tenantKey } },
      update: { revokedAt: null, updatedAt: now },
      create: { id: crypto.randomUUID(), userId: user.id, roleId: roleIds.get(account.role), scopeKey: account.accountType === 'APPLICATION_MANAGER' ? 'global' : tenantKey, updatedAt: now },
    });
    workbookRows.push({ Environment: 'isolated demo tenant', Role: account.role, Name: `${account.firstName} ${account.lastName}`, Email: account.email, Password: account.password, Scope: account.accountType === 'APPLICATION_MANAGER' ? 'global' : tenantKey, Login: account.accountType === 'APPLICATION_MANAGER' ? '/owner/login' : '/tenant/login' });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(workbookRows), 'Demo Logins');
  XLSX.writeFile(workbook, new URL('../../demo-logins.xlsx', import.meta.url));
  console.log(`Seeded ${accounts.length} isolated demo accounts and wrote demo-logins.xlsx`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
