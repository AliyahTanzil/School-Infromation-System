CREATE TABLE IF NOT EXISTS "HRDepartment" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HRDepartment_tenantId_schoolId_name_key" UNIQUE ("tenantId", "schoolId", "name")
);
CREATE TABLE IF NOT EXISTS "HRPosition" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "salaryMinor" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HRPosition_tenantId_schoolId_name_key" UNIQUE ("tenantId", "schoolId", "name")
);
CREATE TABLE IF NOT EXISTS "Employee" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "employeeNumber" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "departmentId" UUID,
  "positionId" UUID,
  "status" TEXT NOT NULL DEFAULT 'APPLICANT',
  "emergencyContact" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Employee_tenantId_schoolId_employeeNumber_key" UNIQUE ("tenantId", "schoolId", "employeeNumber")
);
CREATE INDEX IF NOT EXISTS "Employee_tenantId_schoolId_status_idx" ON "Employee"("tenantId", "schoolId", "status");
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "leaveType" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "LeaveRequest_tenantId_schoolId_status_startsAt_idx" ON "LeaveRequest"("tenantId", "schoolId", "status", "startsAt");
CREATE TABLE IF NOT EXISTS "PayrollRun" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "totalMinor" INTEGER NOT NULL DEFAULT 0,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayrollRun_tenantId_schoolId_periodStart_periodEnd_key" UNIQUE ("tenantId", "schoolId", "periodStart", "periodEnd")
);
CREATE TABLE IF NOT EXISTS "PayrollItem" (
  "id" UUID PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "payrollRunId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "grossMinor" INTEGER NOT NULL,
  "deductionsMinor" INTEGER NOT NULL DEFAULT 0,
  "netMinor" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayrollItem_payrollRunId_employeeId_key" UNIQUE ("payrollRunId", "employeeId")
);
