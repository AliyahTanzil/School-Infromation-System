-- CreateTable
CREATE TABLE "SchemaVersion" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemaVersion_version_key" ON "SchemaVersion"("version");
