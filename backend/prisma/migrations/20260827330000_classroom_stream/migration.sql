CREATE TABLE "ClassroomAnnouncement" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassroomAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClassroomStreamPost" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "attachments" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassroomStreamPost_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClassroomStreamComment" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassroomStreamComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClassroomAnnouncement_tenantId_schoolId_classroomId_status_createdAt_idx" ON "ClassroomAnnouncement"("tenantId", "schoolId", "classroomId", "status", "createdAt");
CREATE INDEX "ClassroomStreamPost_tenantId_schoolId_classroomId_status_createdAt_idx" ON "ClassroomStreamPost"("tenantId", "schoolId", "classroomId", "status", "createdAt");
CREATE INDEX "ClassroomStreamComment_tenantId_schoolId_postId_createdAt_idx" ON "ClassroomStreamComment"("tenantId", "schoolId", "postId", "createdAt");
ALTER TABLE "ClassroomAnnouncement" ADD CONSTRAINT "ClassroomAnnouncement_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomAnnouncement" ADD CONSTRAINT "ClassroomAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassroomStreamPost" ADD CONSTRAINT "ClassroomStreamPost_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomStreamPost" ADD CONSTRAINT "ClassroomStreamPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassroomStreamComment" ADD CONSTRAINT "ClassroomStreamComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClassroomStreamPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomStreamComment" ADD CONSTRAINT "ClassroomStreamComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
