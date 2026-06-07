-- PaymentStatus additions
ALTER TYPE "transactions"."PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
ALTER TYPE "transactions"."PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUND_PROCESSING';
ALTER TYPE "transactions"."PaymentStatus" ADD VALUE IF NOT EXISTS 'NOT_APPLICABLE';

-- RefundStatus additions  
ALTER TYPE "transactions"."RefundStatus" ADD VALUE IF NOT EXISTS 'NOT_APPLICABLE';
ALTER TYPE "transactions"."RefundStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
