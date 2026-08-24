ALTER TABLE "UserSession" DROP CONSTRAINT IF EXISTS "UserSession_tokenHash_key";
ALTER TABLE "UserSession" DROP COLUMN IF EXISTS "tokenHash";
