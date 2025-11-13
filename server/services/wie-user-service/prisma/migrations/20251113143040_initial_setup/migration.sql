/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `wie_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wie_users" ADD COLUMN     "username" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "wie_users_username_key" ON "wie_users"("username");
