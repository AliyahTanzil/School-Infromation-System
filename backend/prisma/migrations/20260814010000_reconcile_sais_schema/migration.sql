-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('OWNER', 'SUPPORT', 'AUDITOR');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
ALTER TABLE "AttendanceRecord" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AttendanceRecord" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EnrollmentStatus_new" AS ENUM ('ACTIVE', 'WITHDRAWN', 'COMPLETED', 'TRANSFERRED');
ALTER TABLE "ClassEnrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Enrollment" ALTER COLUMN "status" TYPE "EnrollmentStatus_new" USING ("status"::text::"EnrollmentStatus_new");
ALTER TYPE "EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "EnrollmentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'INVITED';
COMMIT;

-- DropForeignKey
ALTER TABLE "AcademicPeriod" DROP CONSTRAINT "AcademicPeriod_parentId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicPeriod" DROP CONSTRAINT "AcademicPeriod_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicPeriodHistory" DROP CONSTRAINT "AcademicPeriodHistory_periodId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceAudit" DROP CONSTRAINT "AttendanceAudit_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceQrToken" DROP CONSTRAINT "AttendanceQrToken_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_studentId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_classId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_periodId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLogin" DROP CONSTRAINT "AuditLogin_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLogin" DROP CONSTRAINT "AuditLogin_userId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_gradeLevelId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "ClassEnrollment" DROP CONSTRAINT "ClassEnrollment_classId_fkey";

-- DropForeignKey
ALTER TABLE "ClassEnrollment" DROP CONSTRAINT "ClassEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ClassHistory" DROP CONSTRAINT "ClassHistory_classId_fkey";

-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "EmailVerificationToken" DROP CONSTRAINT "EmailVerificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Examination" DROP CONSTRAINT "Examination_periodId_fkey";

-- DropForeignKey
ALTER TABLE "Examination" DROP CONSTRAINT "Examination_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationAudit" DROP CONSTRAINT "ExaminationAudit_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationCandidate" DROP CONSTRAINT "ExaminationCandidate_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationCandidate" DROP CONSTRAINT "ExaminationCandidate_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationMark" DROP CONSTRAINT "ExaminationMark_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationMark" DROP CONSTRAINT "ExaminationMark_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationSchedule" DROP CONSTRAINT "ExaminationSchedule_classId_fkey";

-- DropForeignKey
ALTER TABLE "ExaminationSchedule" DROP CONSTRAINT "ExaminationSchedule_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "FeeAssignment" DROP CONSTRAINT "FeeAssignment_feeStructureId_fkey";

-- DropForeignKey
ALTER TABLE "FeeAssignment" DROP CONSTRAINT "FeeAssignment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "FeeCategory" DROP CONSTRAINT "FeeCategory_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "FeeStructure" DROP CONSTRAINT "FeeStructure_feeCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "FeeStructure" DROP CONSTRAINT "FeeStructure_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialAdjustment" DROP CONSTRAINT "FinancialAdjustment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_studentId_fkey";

-- DropForeignKey
ALTER TABLE "GradeBand" DROP CONSTRAINT "GradeBand_schemeId_fkey";

-- DropForeignKey
ALTER TABLE "GradeLevel" DROP CONSTRAINT "GradeLevel_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_feeAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_feeId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_studentId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "LoginAttempt" DROP CONSTRAINT "LoginAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Parent" DROP CONSTRAINT "Parent_userId_fkey";

-- DropForeignKey
ALTER TABLE "ParentAccessLog" DROP CONSTRAINT "ParentAccessLog_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentAddress" DROP CONSTRAINT "ParentAddress_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentContact" DROP CONSTRAINT "ParentContact_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentNotificationEvent" DROP CONSTRAINT "ParentNotificationEvent_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentNotificationSetting" DROP CONSTRAINT "ParentNotificationSetting_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentPreference" DROP CONSTRAINT "ParentPreference_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentProfile" DROP CONSTRAINT "ParentProfile_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentStudentRelationship" DROP CONSTRAINT "ParentStudentRelationship_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentStudentRelationship" DROP CONSTRAINT "ParentStudentRelationship_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ParentVerification" DROP CONSTRAINT "ParentVerification_parentId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAttempt" DROP CONSTRAINT "PaymentAttempt_intentId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_permissionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "PreviousSchool" DROP CONSTRAINT "PreviousSchool_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileImage" DROP CONSTRAINT "ProfileImage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_parentTokenId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_schemeId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ResultAudit" DROP CONSTRAINT "ResultAudit_resultId_fkey";

-- DropForeignKey
ALTER TABLE "RoleHierarchy" DROP CONSTRAINT "RoleHierarchy_childRoleId_fkey";

-- DropForeignKey
ALTER TABLE "RoleHierarchy" DROP CONSTRAINT "RoleHierarchy_parentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_grantedById_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_classId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_timeSlotId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleSubstitution" DROP CONSTRAINT "ScheduleSubstitution_entryId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleSubstitution" DROP CONSTRAINT "ScheduleSubstitution_originalTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleSubstitution" DROP CONSTRAINT "ScheduleSubstitution_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingConflict" DROP CONSTRAINT "SchedulingConflict_entryId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingConflict" DROP CONSTRAINT "SchedulingConflict_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingConstraint" DROP CONSTRAINT "SchedulingConstraint_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolAdministrator" DROP CONSTRAINT "SchoolAdministrator_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolAdministrator" DROP CONSTRAINT "SchoolAdministrator_userId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolBranch" DROP CONSTRAINT "SchoolBranch_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolConfiguration" DROP CONSTRAINT "SchoolConfiguration_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolProfile" DROP CONSTRAINT "SchoolProfile_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolSetting" DROP CONSTRAINT "SchoolSetting_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAdmission" DROP CONSTRAINT "StudentAdmission_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentClassAssignment" DROP CONSTRAINT "StudentClassAssignment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentDocument" DROP CONSTRAINT "StudentDocument_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentEnrollment" DROP CONSTRAINT "StudentEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentFeeAccount" DROP CONSTRAINT "StudentFeeAccount_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentHistory" DROP CONSTRAINT "StudentHistory_actorId_fkey";

-- DropForeignKey
ALTER TABLE "StudentHistory" DROP CONSTRAINT "StudentHistory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectResult" DROP CONSTRAINT "SubjectResult_resultId_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherAvailability" DROP CONSTRAINT "TeacherAvailability_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherCertification" DROP CONSTRAINT "TeacherCertification_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClassAssignment" DROP CONSTRAINT "TeacherClassAssignment_classId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClassAssignment" DROP CONSTRAINT "TeacherClassAssignment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherDepartment" DROP CONSTRAINT "TeacherDepartment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherDocument" DROP CONSTRAINT "TeacherDocument_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherEmployment" DROP CONSTRAINT "TeacherEmployment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherHistory" DROP CONSTRAINT "TeacherHistory_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProfile" DROP CONSTRAINT "TeacherProfile_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherQualification" DROP CONSTRAINT "TeacherQualification_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubjectAssignment" DROP CONSTRAINT "TeacherSubjectAssignment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TimeSlot" DROP CONSTRAINT "TimeSlot_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_academicPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "TimetableAudit" DROP CONSTRAINT "TimetableAudit_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "TimetableVersion" DROP CONSTRAINT "TimetableVersion_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "TrustedDevice" DROP CONSTRAINT "TrustedDevice_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserAudit" DROP CONSTRAINT "UserAudit_actorId_fkey";

-- DropForeignKey
ALTER TABLE "UserAudit" DROP CONSTRAINT "UserAudit_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_grantedById_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropIndex
DROP INDEX "AttendanceRecord_sessionId_studentId_key";

-- DropIndex
DROP INDEX "AttendanceRecord_tenantId_schoolId_studentId_status_idx";

-- DropIndex
DROP INDEX "Guardian_tenantId_schoolId_email_idx";

-- DropIndex
DROP INDEX "Permission_code_key";

-- DropIndex
DROP INDEX "Permission_deletedAt_idx";

-- DropIndex
DROP INDEX "Permission_permissionGroupId_deletedAt_idx";

-- DropIndex
DROP INDEX "Role_code_key";

-- DropIndex
DROP INDEX "Role_deletedAt_idx";

-- DropIndex
DROP INDEX "Role_isSystem_deletedAt_idx";

-- DropIndex
DROP INDEX "RolePermission_grantedById_idx";

-- DropIndex
DROP INDEX "RolePermission_permissionId_idx";

-- DropIndex
DROP INDEX "RolePermission_roleId_permissionId_key";

-- DropIndex
DROP INDEX "School_tenantId_normalizedName_key";

-- DropIndex
DROP INDEX "School_tenantId_slug_key";

-- DropIndex
DROP INDEX "School_tenantId_status_deletedAt_idx";

-- DropIndex
DROP INDEX "Student_schoolId_admissionNumber_key";

-- DropIndex
DROP INDEX "Student_tenantId_schoolId_status_deletedAt_idx";

-- DropIndex
DROP INDEX "StudentGuardian_studentId_guardianId_key";

-- DropIndex
DROP INDEX "Tenant_slug_key";

-- DropIndex
DROP INDEX "Tenant_status_deletedAt_idx";

-- DropIndex
DROP INDEX "User_deletedAt_idx";

-- DropIndex
DROP INDEX "User_status_idx";

-- DropIndex
DROP INDEX "UserRole_grantedById_idx";

-- DropIndex
DROP INDEX "UserRole_roleId_revokedAt_idx";

-- DropIndex
DROP INDEX "UserRole_userId_roleId_scopeKey_key";

-- DropIndex
DROP INDEX "UserRole_userId_scopeKey_revokedAt_expiresAt_idx";

-- DropIndex
DROP INDEX "UserSession_expiresAt_idx";

-- DropIndex
DROP INDEX "UserSession_userId_revokedAt_expiresAt_idx";

-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "markedAt",
DROP COLUMN "markedById",
DROP COLUMN "method",
DROP COLUMN "schoolId",
DROP COLUMN "sessionId",
DROP COLUMN "updatedAt",
ADD COLUMN     "attendanceDate" DATE NOT NULL,
ADD COLUMN     "recordedById" UUID,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "note" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "DatabaseSentinel" ALTER COLUMN "id" SET DEFAULT 1,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
DROP SEQUENCE "DatabaseSentinel_id_seq";

-- AlterTable
ALTER TABLE "Guardian" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "schoolId",
DROP COLUMN "updatedAt",
ALTER COLUMN "firstName" SET DATA TYPE TEXT,
ALTER COLUMN "lastName" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "code",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "effect",
DROP COLUMN "isSystem",
DROP COLUMN "name",
DROP COLUMN "permissionGroupId",
DROP COLUMN "updatedAt",
ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "code",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "isAssignable",
DROP COLUMN "isSystem",
DROP COLUMN "updatedAt",
ADD COLUMN     "tenantId" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "grantedById",
DROP COLUMN "id",
ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");

-- AlterTable
ALTER TABLE "School" DROP COLUMN "deletedAt",
DROP COLUMN "normalizedName",
DROP COLUMN "slug",
DROP COLUMN "status",
DROP COLUMN "website",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "country" TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "deletedAt",
DROP COLUMN "enrolledAt",
DROP COLUMN "schoolId",
DROP COLUMN "status",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "admissionNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_pkey",
DROP COLUMN "canContact",
DROP COLUMN "canPickup",
DROP COLUMN "id",
ALTER COLUMN "relationship" SET DATA TYPE TEXT,
ADD CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("studentId", "guardianId");

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "slug",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ALTER COLUMN "name" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "TenantStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accountType",
DROP COLUMN "deletedAt",
DROP COLUMN "emailVerifiedAt",
DROP COLUMN "failedLoginCount",
DROP COLUMN "lockedUntil",
DROP COLUMN "passwordHash",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "platformRole" "PlatformRole",
ADD COLUMN     "tenantId" UUID,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'INVITED';

-- AlterTable
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "grantedById",
DROP COLUMN "id",
DROP COLUMN "revokedAt",
DROP COLUMN "scopeKey",
DROP COLUMN "updatedAt",
ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "deviceHash",
DROP COLUMN "deviceName",
DROP COLUMN "deviceType",
DROP COLUMN "ipAddress",
DROP COLUMN "lastActiveAt",
DROP COLUMN "revokeReason",
DROP COLUMN "updatedAt",
DROP COLUMN "userAgent",
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- DropTable
DROP TABLE "AcademicPeriod";

-- DropTable
DROP TABLE "AcademicPeriodHistory";

-- DropTable
DROP TABLE "AttendanceAudit";

-- DropTable
DROP TABLE "AttendanceQrToken";

-- DropTable
DROP TABLE "AttendanceSession";

-- DropTable
DROP TABLE "AuditLogin";

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "ClassEnrollment";

-- DropTable
DROP TABLE "ClassHistory";

-- DropTable
DROP TABLE "Classroom";

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "DevelopmentEmailOutbox";

-- DropTable
DROP TABLE "EmailVerificationToken";

-- DropTable
DROP TABLE "Examination";

-- DropTable
DROP TABLE "ExaminationAudit";

-- DropTable
DROP TABLE "ExaminationCandidate";

-- DropTable
DROP TABLE "ExaminationMark";

-- DropTable
DROP TABLE "ExaminationSchedule";

-- DropTable
DROP TABLE "ExternalTransaction";

-- DropTable
DROP TABLE "FeeAssignment";

-- DropTable
DROP TABLE "FeeCategory";

-- DropTable
DROP TABLE "FeeStructure";

-- DropTable
DROP TABLE "FinanceAudit";

-- DropTable
DROP TABLE "FinancialAdjustment";

-- DropTable
DROP TABLE "FinancialTransaction";

-- DropTable
DROP TABLE "GatewayError";

-- DropTable
DROP TABLE "GatewayRefund";

-- DropTable
DROP TABLE "GatewayWebhookEvent";

-- DropTable
DROP TABLE "GradeBand";

-- DropTable
DROP TABLE "GradeLevel";

-- DropTable
DROP TABLE "GradeScheme";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "InvoiceItem";

-- DropTable
DROP TABLE "LoginAttempt";

-- DropTable
DROP TABLE "MedicalRecord";

-- DropTable
DROP TABLE "Parent";

-- DropTable
DROP TABLE "ParentAccessLog";

-- DropTable
DROP TABLE "ParentAddress";

-- DropTable
DROP TABLE "ParentContact";

-- DropTable
DROP TABLE "ParentNotificationEvent";

-- DropTable
DROP TABLE "ParentNotificationSetting";

-- DropTable
DROP TABLE "ParentPreference";

-- DropTable
DROP TABLE "ParentProfile";

-- DropTable
DROP TABLE "ParentStudentRelationship";

-- DropTable
DROP TABLE "ParentVerification";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "PaymentAllocation";

-- DropTable
DROP TABLE "PaymentAttempt";

-- DropTable
DROP TABLE "PaymentIntent";

-- DropTable
DROP TABLE "PaymentProvider";

-- DropTable
DROP TABLE "PaymentProviderConfiguration";

-- DropTable
DROP TABLE "PermissionGroup";

-- DropTable
DROP TABLE "PreviousSchool";

-- DropTable
DROP TABLE "ProfileImage";

-- DropTable
DROP TABLE "ProviderHealthStatus";

-- DropTable
DROP TABLE "Receipt";

-- DropTable
DROP TABLE "RefreshToken";

-- DropTable
DROP TABLE "Refund";

-- DropTable
DROP TABLE "Result";

-- DropTable
DROP TABLE "ResultAudit";

-- DropTable
DROP TABLE "RoleHierarchy";

-- DropTable
DROP TABLE "ScheduleEntry";

-- DropTable
DROP TABLE "ScheduleSubstitution";

-- DropTable
DROP TABLE "SchedulingConflict";

-- DropTable
DROP TABLE "SchedulingConstraint";

-- DropTable
DROP TABLE "SchoolAdministrator";

-- DropTable
DROP TABLE "SchoolBranch";

-- DropTable
DROP TABLE "SchoolConfiguration";

-- DropTable
DROP TABLE "SchoolProfile";

-- DropTable
DROP TABLE "SchoolSetting";

-- DropTable
DROP TABLE "StudentAdmission";

-- DropTable
DROP TABLE "StudentClassAssignment";

-- DropTable
DROP TABLE "StudentDocument";

-- DropTable
DROP TABLE "StudentEnrollment";

-- DropTable
DROP TABLE "StudentFeeAccount";

-- DropTable
DROP TABLE "StudentHistory";

-- DropTable
DROP TABLE "StudentProfile";

-- DropTable
DROP TABLE "SubjectResult";

-- DropTable
DROP TABLE "Teacher";

-- DropTable
DROP TABLE "TeacherAvailability";

-- DropTable
DROP TABLE "TeacherCertification";

-- DropTable
DROP TABLE "TeacherClassAssignment";

-- DropTable
DROP TABLE "TeacherDepartment";

-- DropTable
DROP TABLE "TeacherDocument";

-- DropTable
DROP TABLE "TeacherEmployment";

-- DropTable
DROP TABLE "TeacherHistory";

-- DropTable
DROP TABLE "TeacherProfile";

-- DropTable
DROP TABLE "TeacherQualification";

-- DropTable
DROP TABLE "TeacherSubjectAssignment";

-- DropTable
DROP TABLE "TimeSlot";

-- DropTable
DROP TABLE "Timetable";

-- DropTable
DROP TABLE "TimetableAudit";

-- DropTable
DROP TABLE "TimetableVersion";

-- DropTable
DROP TABLE "TrustedDevice";

-- DropTable
DROP TABLE "UserActivationRequest";

-- DropTable
DROP TABLE "UserAudit";

-- DropTable
DROP TABLE "UserPreference";

-- DropTable
DROP TABLE "UserProfile";

-- DropEnum
DROP TYPE "AcademicPeriodStatus";

-- DropEnum
DROP TYPE "AcademicPeriodType";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "AttendanceCaptureMethod";

-- DropEnum
DROP TYPE "AttendanceSessionStatus";

-- DropEnum
DROP TYPE "ClassStatus";

-- DropEnum
DROP TYPE "ExaminationCandidateStatus";

-- DropEnum
DROP TYPE "ExaminationStatus";

-- DropEnum
DROP TYPE "FinancialDocumentStatus";

-- DropEnum
DROP TYPE "FinancialPaymentMethod";

-- DropEnum
DROP TYPE "FinancialTransactionType";

-- DropEnum
DROP TYPE "GatewayAttemptStatus";

-- DropEnum
DROP TYPE "GatewayChannel";

-- DropEnum
DROP TYPE "GatewayIntentStatus";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "LoginEventType";

-- DropEnum
DROP TYPE "MarkStatus";

-- DropEnum
DROP TYPE "ParentRelationshipStatus";

-- DropEnum
DROP TYPE "ParentVerificationStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "PermissionEffect";

-- DropEnum
DROP TYPE "ProfileImageStatus";

-- DropEnum
DROP TYPE "ResultStatus";

-- DropEnum
DROP TYPE "ResultStudentStatus";

-- DropEnum
DROP TYPE "StudentDocumentStatus";

-- DropEnum
DROP TYPE "StudentStatus";

-- DropEnum
DROP TYPE "TeacherStatus";

-- DropEnum
DROP TYPE "TimetableConflictSeverity";

-- DropEnum
DROP TYPE "TimetableEntryKind";

-- DropEnum
DROP TYPE "TimetableStatus";

-- DropEnum
DROP TYPE "UserAuditEventType";

-- CreateTable
CREATE TABLE "Campus" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "platform" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTerm" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "department" TEXT,
    "jobTitle" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "section" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "recipientId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "actorId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_schoolId_code_key" ON "Campus"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceFingerprint_key" ON "UserDevice"("userId", "deviceFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_tenantId_name_key" ON "AcademicYear"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTerm_academicYearId_name_key" ON "AcademicTerm"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_tenantId_employeeNumber_key" ON "Staff"("tenantId", "employeeNumber");

-- CreateIndex
CREATE INDEX "Enrollment_tenantId_gradeLevel_section_idx" ON "Enrollment"("tenantId", "gradeLevel", "section");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYearId_key" ON "Enrollment"("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_status_createdAt_idx" ON "Notification"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key_key" ON "TenantSetting"("tenantId", "key");

-- CreateIndex
CREATE INDEX "AttendanceRecord_tenantId_attendanceDate_status_idx" ON "AttendanceRecord"("tenantId", "attendanceDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_attendanceDate_key" ON "AttendanceRecord"("studentId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Guardian_tenantId_lastName_idx" ON "Guardian"("tenantId", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "School_tenantId_code_key" ON "School"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Student_tenantId_lastName_firstName_idx" ON "Student"("tenantId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_tenantId_admissionNumber_key" ON "Student"("tenantId", "admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "User_tenantId_status_idx" ON "User"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "UserSession"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTerm" ADD CONSTRAINT "AcademicTerm_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

