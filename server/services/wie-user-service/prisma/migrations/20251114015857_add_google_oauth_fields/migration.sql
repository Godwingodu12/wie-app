/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `wie_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wie_users" ADD COLUMN     "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'local',
ADD COLUMN     "google_id" VARCHAR(255),
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "wie_users_google_id_key" ON "wie_users"("google_id");
