CREATE TABLE IF NOT EXISTS "DigitalMaterial" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL,
  "uploaderId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pathname" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigitalMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DigitalMaterial_tenantId_schoolId_classroomId_status_createdAt_idx"
  ON "DigitalMaterial"("tenantId", "schoolId", "classroomId", "status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "DigitalMaterial" ADD CONSTRAINT "DigitalMaterial_classroomId_fkey"
    FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DigitalMaterial" ADD CONSTRAINT "DigitalMaterial_uploaderId_fkey"
    FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
