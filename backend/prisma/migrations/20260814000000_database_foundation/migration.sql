CREATE TABLE "DatabaseSentinel" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DatabaseSentinel_pkey" PRIMARY KEY ("id")
);
