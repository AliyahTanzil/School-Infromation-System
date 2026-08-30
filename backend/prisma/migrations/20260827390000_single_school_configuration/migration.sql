-- Stage 1 of the single-school conversion is intentionally non-destructive.
-- Tenant columns remain temporarily so existing domain data and the preceding
-- gradebook migration continue to work while application ownership is moved to
-- the server-resolved School record.
ALTER TABLE "School"
  ADD COLUMN "website" TEXT,
  ADD COLUMN "motto" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "principalName" TEXT,
  ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "isConfigured" BOOLEAN NOT NULL DEFAULT false;

-- A deployment must configure SINGLE_SCHOOL_ID when more than one legacy
-- School row exists. Tenant data is not deleted or merged automatically.
