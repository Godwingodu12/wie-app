// src/utils/platformFeeEngine.ts

/**
 * WIE Fee Model (clean 3-line checkout):
 *
 *   Line 1 — Ticket price:    ₹1,200.00
 *   Line 2 — GST on ticket:   ₹  216.00   (18%, when GST-registered)
 *   Line 3 — Convenience fee: ₹    5.00   (WIE flat fee — absorbs ~₹24 gateway cost)
 *            ─────────────────────────────
 *            Total:           ₹1,421.00
 *
 * Gateway fee (~2% Razorpay) is absorbed by WIE internally.
 * platformGst (₹0.90 on ₹5) is also absorbed by WIE — not passed to user.
 * Never shown as a separate line to the user.
 */

export interface FeeBreakdown {
  ticketSubtotal: number; // ticket price × qty → stored in `subtotal`
  organizerGst: number; // GST on ticket → stored in `tax`
  platformFee: number; // WIE flat fee → stored in `platform_fee`
  platformGst: number; // GST on WIE fee — absorbed by WIE, stored in `platform_gst`, NOT shown to user
  gatewayFeeAbsorbed: number; // ~2% Razorpay cost — WIE absorbs, stored in `convenience_fee` for internal accounting only
  totalAmount: number; // what user actually pays = ticketSubtotal + organizerGst + platformFee
}

/** WIE's net revenue per ticket after absorbing gateway cost */
export interface WIENetRevenue {
  grossFee: number; // ₹5 (platform fee)
  gatewayCost: number; // ~2% of (ticketSubtotal + organizerGst + platformFee)
  platformGstPayable: number; // WIE's own GST liability
  netPerTicket: number; // grossFee − gatewayCost − platformGstPayable
}

const GATEWAY_RATE = 0.02; // Razorpay ~2% — absorbed by WIE

/**
 * Flat WIE platform fee per ticket.
 * Always reads from PLATFORM_FEE_PER_TICKET env — no dynamic tiers.
 * Set to ₹5 in env.
 */
export function calculatePlatformFee(ticketPrice: number): number {
  if (ticketPrice <= 0) return 0;
  return parseFloat(process.env.PLATFORM_FEE_PER_TICKET || "5");
}

/**
 * Full fee breakdown for a booking.
 *
 * @param ticketPrice  - price of a single ticket
 * @param quantity     - number of tickets
 * @param includeGst   - set true when organizer is GST-registered (reads TAX_PERCENTAGE from env)
 */
export function calculateFeeBreakdown(
  ticketPrice: number,
  quantity: number,
  includeGst: boolean = false,
): FeeBreakdown {
  const GST_RATE = includeGst
    ? parseFloat(process.env.TAX_PERCENTAGE || "0") / 100
    : 0;
  const flatFeePerTicket = parseFloat(
    process.env.PLATFORM_FEE_PER_TICKET || "5",
  );

  // ── User-visible amounts ──────────────────────────────────────────────────
  const ticketSubtotal = parseFloat((ticketPrice * quantity).toFixed(2));
  const platformFee =
    ticketPrice <= 0 ? 0 : parseFloat((flatFeePerTicket * quantity).toFixed(2));

  // GST on ticket — shown to user (organizer's liability collected from user)
  const organizerGst =
    GST_RATE > 0 ? parseFloat((ticketSubtotal * GST_RATE).toFixed(2)) : 0;

  // ── WIE absorbs these — NOT shown to user ────────────────────────────────
  // GST on WIE's own fee — WIE's liability, not passed to user
  const platformGst =
    GST_RATE > 0 ? parseFloat((platformFee * GST_RATE).toFixed(2)) : 0;

  // Razorpay charges ~2% on the user's total payment — WIE absorbs this
  const userTotal = parseFloat(
    (ticketSubtotal + organizerGst + platformFee).toFixed(2),
  );
  const gatewayFeeAbsorbed = parseFloat((userTotal * GATEWAY_RATE).toFixed(2));

  // ── Grand total — only 3 components visible to user ──────────────────────
  const totalAmount = userTotal; // gateway NOT added on top

  return {
    ticketSubtotal,
    organizerGst,
    platformFee,
    platformGst, // stored internally for WIE accounting
    gatewayFeeAbsorbed, // stored internally for WIE accounting
    totalAmount,
  };
}

/**
 * WIE's net revenue calculation (for internal dashboard/reporting only).
 * Call this when recording revenue — never expose to user.
 */
export function calculateWIENetRevenue(breakdown: FeeBreakdown): WIENetRevenue {
  return {
    grossFee: breakdown.platformFee,
    gatewayCost: breakdown.gatewayFeeAbsorbed,
    platformGstPayable: breakdown.platformGst,
    netPerTicket: parseFloat(
      (
        breakdown.platformFee -
        breakdown.gatewayFeeAbsorbed -
        breakdown.platformGst
      ).toFixed(2),
    ),
  };
}
