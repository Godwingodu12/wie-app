/*
  Warnings:

  - You are about to drop the column `lastSeenAt` on the `wie_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wie_users" DROP COLUMN "lastSeenAt",
ADD COLUMN     "last_seen_at" TIMESTAMP(6);
