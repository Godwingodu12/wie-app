-- AlterTable
ALTER TABLE "wie_users" ADD COLUMN     "followers_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "following_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "posts_count" INTEGER NOT NULL DEFAULT 0;
