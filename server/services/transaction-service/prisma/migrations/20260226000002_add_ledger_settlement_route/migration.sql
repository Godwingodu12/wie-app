-- ─── Add new enum values to SettlementStatus ─────────────────────────────────
-- (IF NOT EXISTS is safe — skips if already added from previous migration)
ALTER TYPE "public"."SettlementStatus" ADD VALUE IF NOT EXISTS 'HELD';
ALTER TYPE "public"."SettlementStatus" ADD VALUE IF NOT EXISTS 'REFUND_INITIATED';
ALTER TYPE "public"."SettlementStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

-- ─── Add new columns to settlements table ────────────────────────────────────
ALTER TABLE "public"."settlements"
ADD COLUMN IF NOT EXISTS "retry_count"               INTEGER        NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "host_razorpay_account_id"  VARCHAR(100),
ADD COLUMN IF NOT EXISTS "razorpay_transfer_id"      VARCHAR(100);

-- ─── Create host_linked_accounts table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."host_linked_accounts" (
    "id"                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    "group_id"             VARCHAR(50)  NOT NULL,
    "razorpay_account_id"  VARCHAR(100) NOT NULL,
    "kyc_status"           VARCHAR(20)  NOT NULL DEFAULT 'pending',
    "business_name"        VARCHAR(255),
    "email"                VARCHAR(255),
    "is_active"            BOOLEAN      NOT NULL DEFAULT true,
    "created_at"           TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_linked_accounts_pkey" PRIMARY KEY ("id")
);

-- Unique index: one linked account per group
CREATE UNIQUE INDEX IF NOT EXISTS "host_linked_accounts_group_id_key"
    ON "public"."host_linked_accounts"("group_id");

CREATE INDEX IF NOT EXISTS "idx_host_linked_accounts_group_id"
    ON "public"."host_linked_accounts"("group_id");

-- ─── Create ledger table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
    "booking_id"   VARCHAR(100)  NOT NULL,
    "ticket_id"    VARCHAR(50),
    "group_id"     VARCHAR(50),
    "type"         VARCHAR(20)   NOT NULL,
    "debit"        DECIMAL(10,2),
    "credit"       DECIMAL(10,2),
    "balance"      DECIMAL(10,2) NOT NULL,
    "reference_id" VARCHAR(100),
    "description"  TEXT,
    "status"       VARCHAR(20)   NOT NULL DEFAULT 'completed',
    "created_at"   TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_ledger_booking_id"  ON "public"."ledger"("booking_id");
CREATE INDEX IF NOT EXISTS "idx_ledger_ticket_id"   ON "public"."ledger"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_ledger_group_id"    ON "public"."ledger"("group_id");
CREATE INDEX IF NOT EXISTS "idx_ledger_type"        ON "public"."ledger"("type");

-- ─── Create host_adjustments table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."host_adjustments" (
    "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
    "group_id"          VARCHAR(50)   NOT NULL,
    "booking_id"        VARCHAR(100)  NOT NULL,
    "settlement_id"     VARCHAR(100)  NOT NULL,
    "adjustment_amount" DECIMAL(10,2) NOT NULL,
    "reason"            TEXT,
    "status"            VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    "applied_at"        TIMESTAMP(6),
    "created_at"        TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_host_adjustments_group_id"   ON "public"."host_adjustments"("group_id");
CREATE INDEX IF NOT EXISTS "idx_host_adjustments_booking_id" ON "public"."host_adjustments"("booking_id");

-- ─── Add refundRetryCount column to bookings ──────────────────────────────────
ALTER TABLE "public"."bookings"
ADD COLUMN IF NOT EXISTS "refund_retry_count" INTEGER NOT NULL DEFAULT 0;