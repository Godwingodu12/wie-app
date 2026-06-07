// src/utils/refundPolicyEngine.ts

export type RefundType = "FULL" | "PARTIAL" | "NONE";

export interface RefundPolicy {
  policyId: string;
  fullRefundCutoffHours: number; // full refund if cancelled before this
  partialRefundCutoffHours: number; // partial refund until this
  partialRefundPercentage: number; // % of subtotal returned
}

export const REFUND_POLICIES: Record<string, RefundPolicy> = {
  DEFAULT: {
    policyId: "DEFAULT",
    fullRefundCutoffHours: 4,
    partialRefundCutoffHours: 1,
    partialRefundPercentage: 50,
  },
  STRICT: {
    policyId: "STRICT",
    fullRefundCutoffHours: 24,
    partialRefundCutoffHours: 4,
    partialRefundPercentage: 25,
  },
  FLEXIBLE: {
    policyId: "FLEXIBLE",
    fullRefundCutoffHours: 1,
    partialRefundCutoffHours: 0,
    partialRefundPercentage: 0,
  },
  NO_REFUND: {
    policyId: "NO_REFUND",
    fullRefundCutoffHours: 0,
    partialRefundCutoffHours: 0,
    partialRefundPercentage: 0,
  },
};

export interface RefundResult {
  eligible: boolean;
  refundType: RefundType;
  refundPercentage: number;
  refundAmount: number; // actual ₹ to refund
  platformFeeRefunded: boolean;
  reason: string;
}

/**
 * Core refund calculation engine.
 * Host cancellation → always 100% including platform fee.
 * User cancellation → governed by event's refund policy.
 */
export function calculateRefund(params: {
  subtotal: number;
  platformFee: number;
  eventStartDate: Date;
  cancelledAt?: Date;
  policyId?: string;
  cancelledBy: "user" | "host";
}): RefundResult {
  const {
    subtotal,
    platformFee,
    eventStartDate,
    cancelledAt = new Date(),
    policyId = "DEFAULT",
    cancelledBy,
  } = params;

  // Host cancellation → unconditional full refund
  if (cancelledBy === "host") {
    return {
      eligible: true,
      refundType: "FULL",
      refundPercentage: 100,
      refundAmount: parseFloat((subtotal + platformFee).toFixed(2)),
      platformFeeRefunded: true,
      reason: "Event cancelled by host — full refund including platform fee",
    };
  }

  const policy = REFUND_POLICIES[policyId] ?? REFUND_POLICIES.DEFAULT;
  const hoursUntilEvent =
    (eventStartDate.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);

  if (hoursUntilEvent < 0) {
    return {
      eligible: false,
      refundType: "NONE",
      refundPercentage: 0,
      refundAmount: 0,
      platformFeeRefunded: false,
      reason: "Event already started — no refund",
    };
  }

  if (hoursUntilEvent >= policy.fullRefundCutoffHours) {
    return {
      eligible: true,
      refundType: "FULL",
      refundPercentage: 100,
      refundAmount: parseFloat((subtotal + platformFee).toFixed(2)),
      platformFeeRefunded: true,
      reason: `Cancelled ${hoursUntilEvent.toFixed(1)}h before event — full refund`,
    };
  }

  if (
    hoursUntilEvent >= policy.partialRefundCutoffHours &&
    policy.partialRefundPercentage > 0
  ) {
    const refundAmount = parseFloat(
      ((subtotal * policy.partialRefundPercentage) / 100).toFixed(2),
    );
    return {
      eligible: true,
      refundType: "PARTIAL",
      refundPercentage: policy.partialRefundPercentage,
      refundAmount,
      platformFeeRefunded: false, // platform fee not returned on late cancel
      reason: `Late cancellation — ${policy.partialRefundPercentage}% of ticket price refunded`,
    };
  }

  return {
    eligible: false,
    refundType: "NONE",
    refundPercentage: 0,
    refundAmount: 0,
    platformFeeRefunded: false,
    reason: "Outside refund window — no refund applicable",
  };
}
