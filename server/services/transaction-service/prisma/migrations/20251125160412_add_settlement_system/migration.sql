-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "organization_amount" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "bank_details" JSONB NOT NULL,
    "razorpay_payout_id" VARCHAR(100),
    "processed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_settlements_booking" ON "settlements"("booking_id");

-- CreateIndex
CREATE INDEX "idx_settlements_status" ON "settlements"("status");
