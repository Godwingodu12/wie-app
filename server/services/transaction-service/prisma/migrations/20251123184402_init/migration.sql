-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'SHARE', 'VIEW', 'SAVE', 'FEEDBACK');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_id" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,
    "ticket_id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "ticket_type" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_per_ticket" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platform_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" VARCHAR(50),
    "razorpay_order_id" VARCHAR(100),
    "razorpay_payment_id" VARCHAR(100),
    "razorpay_signature" TEXT,
    "booking_status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "user_details" JSONB NOT NULL,
    "event_details" JSONB NOT NULL,
    "qr_code" TEXT,
    "qr_code_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(6),
    "verified_by" VARCHAR(50),
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(6),
    "refund_amount" DECIMAL(10,2),
    "refund_status" "RefundStatus",
    "refund_processed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ticket_id" VARCHAR(50) NOT NULL,
    "interaction_type" "InteractionType" NOT NULL,
    "metadata" JSON,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "razorpay_order_id" VARCHAR(100) NOT NULL,
    "razorpay_payment_id" VARCHAR(100),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "method" VARCHAR(50),
    "bank" VARCHAR(100),
    "wallet" VARCHAR(50),
    "vpa" VARCHAR(100),
    "email" VARCHAR(255),
    "contact" VARCHAR(20),
    "webhook_data" JSON,
    "error_code" VARCHAR(50),
    "error_description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_id_key" ON "bookings"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_razorpay_order_id_key" ON "bookings"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "idx_bookings_ticket_id" ON "bookings"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_bookings_group_id" ON "bookings"("group_id");

-- CreateIndex
CREATE INDEX "idx_bookings_razorpay_order" ON "bookings"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("booking_status");

-- CreateIndex
CREATE INDEX "idx_bookings_created_at" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "idx_interactions_ticket_type" ON "interactions"("ticket_id", "interaction_type");

-- CreateIndex
CREATE INDEX "idx_interactions_user_id" ON "interactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_ticket_interaction" ON "interactions"("user_id", "ticket_id", "interaction_type");

-- CreateIndex
CREATE INDEX "idx_payment_transactions_booking" ON "payment_transactions"("booking_id");

-- CreateIndex
CREATE INDEX "idx_payment_transactions_order" ON "payment_transactions"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "idx_payment_transactions_payment" ON "payment_transactions"("razorpay_payment_id");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
