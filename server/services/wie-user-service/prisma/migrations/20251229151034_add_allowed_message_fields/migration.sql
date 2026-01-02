-- AlterTable
ALTER TABLE "wie_users" ADD COLUMN     "allow_message_requests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allow_messages_from" VARCHAR(20) NOT NULL DEFAULT 'everyone';
