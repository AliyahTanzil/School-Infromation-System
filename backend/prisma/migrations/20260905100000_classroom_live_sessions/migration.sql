CREATE TABLE "ClassroomLiveSession" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL,
  "hostId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "meetingUrl" TEXT,
  "roomCode" TEXT,
  "recordingUrl" TEXT,
  "recordingTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassroomLiveSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassroomLiveSession_tenantId_schoolId_classroomId_status_scheduledAt_idx" ON "ClassroomLiveSession"("tenantId", "schoolId", "classroomId", "status", "scheduledAt");

ALTER TABLE "ClassroomLiveSession" ADD CONSTRAINT "ClassroomLiveSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomLiveSession" ADD CONSTRAINT "ClassroomLiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
