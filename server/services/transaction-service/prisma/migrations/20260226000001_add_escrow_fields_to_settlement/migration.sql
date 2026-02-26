-- Add new enum values to SettlementStatus
ALTER TYPE "public"."SettlementStatus" ADD VALUE IF NOT EXISTS 'HELD';
ALTER TYPE "public"."SettlementStatus" ADD VALUE IF NOT EXISTS 'REFUND_INITIATED';

-- Add new escrow columns to settlements table
ALTER TABLE "public"."settlements"
ADD COLUMN IF NOT EXISTS "ticket_id"        VARCHAR(50),
ADD COLUMN IF NOT EXISTS "group_id"         VARCHAR(50),
ADD COLUMN IF NOT EXISTS "total_amount"     DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "settlement_type"  VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS "scheduled_at"     TIMESTAMP(6);

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS "idx_settlements_ticket_id" ON "public"."settlements"("ticket_id" ASC);
CREATE INDEX IF NOT EXISTS "idx_settlements_group_id"  ON "public"."settlements"("group_id" ASC);