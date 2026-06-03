// src/utils/settlementModeEngine.ts

export type SettlementMode = "INSTANT" | "DELAYED" | "HIGH_RISK_ESCROW";

export interface OrganizerProfile {
  trustScore: number; // 0–100, computed from history
  totalEventsHosted: number;
  refundRate: number; // 0–1
  completionRate: number; // 0–1
  totalTicketValue: number; // ₹ total for this event
}

export interface SettlementModeResult {
  mode: SettlementMode;
  reason: string;
  releaseAfterHours: number; // 0 = immediate
  onHoldForRazorpay: 0 | 1; // Razorpay Route on_hold flag
}

const HIGH_VALUE_THRESHOLD = parseFloat(process.env.HIGH_VALUE_THRESHOLD || "50000"); // ₹50K+

if (isNaN(HIGH_VALUE_THRESHOLD)) {
  throw new Error(
    "Environment variable HIGH_VALUE_THRESHOLD must be set and be a valid number.",
  );
}

const TRUSTED_SCORE = 75;
const MIN_EVENTS_FOR_TRUSTED = 10;

export function determineSettlementMode(
  profile: OrganizerProfile,
): SettlementModeResult {
  const isHighRisk =
    profile.totalEventsHosted < 3 ||
    profile.totalTicketValue >= HIGH_VALUE_THRESHOLD ||
    profile.trustScore < 40;

  if (isHighRisk) {
    return {
      mode: "HIGH_RISK_ESCROW",
      reason: "New organizer or high-value event",
      releaseAfterHours: 72,
      onHoldForRazorpay: 1,
    };
  }

  const isTrusted =
    profile.trustScore >= TRUSTED_SCORE &&
    profile.completionRate >= 0.95 &&
    profile.refundRate <= 0.05 &&
    profile.totalEventsHosted >= MIN_EVENTS_FOR_TRUSTED;

  if (isTrusted) {
    return {
      mode: "INSTANT",
      reason: "Trusted organizer — instant payout",
      releaseAfterHours: 0,
      onHoldForRazorpay: 0,
    };
  }

  return {
    mode: "DELAYED",
    reason: "Standard mode — payout after event completion",
    releaseAfterHours: 24,
    onHoldForRazorpay: 1,
  };
}

/**
 * Compute trust score from organizer history.
 * Call this when fetching organizer profile and cache it.
 */
export function computeTrustScore(stats: {
  completionRate: number; // weight 40
  refundRate: number; // weight 30 (inverted)
  complaintRate: number; // weight 20 (inverted)
  totalRevenue: number; // weight 10 (normalized to ₹1L)
}): number {
  const s =
    stats.completionRate * 40 +
    (1 - Math.min(stats.refundRate, 1)) * 30 +
    (1 - Math.min(stats.complaintRate, 1)) * 20 +
    Math.min(stats.totalRevenue / 100_000, 1) * 10;

  return Math.round(Math.max(0, Math.min(100, s)));
}
