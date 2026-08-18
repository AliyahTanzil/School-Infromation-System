/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `UserSession` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserSession_tokenHash_key";

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "tokenHash";
