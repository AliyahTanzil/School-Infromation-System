DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'AccountType'
  ) THEN
    CREATE TYPE "public"."AccountType" AS ENUM ('TENANT_ADMIN', 'APPLICATION_MANAGER');
  END IF;
END $$;

ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "accountType" "public"."AccountType" NOT NULL DEFAULT 'TENANT_ADMIN';
