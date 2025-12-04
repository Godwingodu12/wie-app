-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "refund_id" VARCHAR(100),
ADD COLUMN     "refund_initiated_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "refund_id" VARCHAR(100);
