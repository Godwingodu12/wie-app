export interface FeeBreakdown {
  ticketSubtotal: number; // ticket_price × qty  (GST already inside)
  platformFee: number; // WIE flat fee (₹5 per ticket)
  gatewayFeeAbsorbed: number; // ~2% Razorpay cost — WIE absorbs, internal only
  totalAmount: number; // ticketSubtotal + platformFee (what user pays)
}

/** WIE's net revenue per booking after absorbing gateway cost */
export interface WIENetRevenue {
  grossFee: number; // ₹5 × qty
  gatewayCost: number; // ~2% of totalAmount
  netRevenue: number; // grossFee − gatewayCost
}

const GATEWAY_RATE = 0.02; // Razorpay ~2% — absorbed by WIE

/**
 * Flat WIE platform fee.
 * Free events return 0. Always reads PLATFORM_FEE_PER_TICKET from env.
 */
export function calculatePlatformFee(ticketPrice: number): number {
  if (ticketPrice <= 0) return 0;
  return parseFloat(process.env.PLATFORM_FEE_PER_TICKET || "5");
}

/**
 * Full fee breakdown for a booking.
 * ticket_price is treated as the final organiser-set price (GST already inside).
 * This function NEVER adds any tax on top.
 *
 * @param ticketPrice  - single ticket price as set by organiser (may include GST)
 * @param quantity     - number of tickets
 */
export function calculateFeeBreakdown(
  ticketPrice: number,
  quantity: number,
): FeeBreakdown {
  const flatFeePerTicket = parseFloat(
    process.env.PLATFORM_FEE_PER_TICKET || "5",
  );

  const ticketSubtotal = parseFloat((ticketPrice * quantity).toFixed(2));
  const platformFee =
    ticketPrice <= 0 ? 0 : parseFloat((flatFeePerTicket * quantity).toFixed(2));

  // Total = ticket price + WIE fee only. GST is already in ticket price.
  const totalAmount = parseFloat((ticketSubtotal + platformFee).toFixed(2));

  // Razorpay charges ~2% on the user's total — WIE absorbs this
  const gatewayFeeAbsorbed = parseFloat(
    (totalAmount * GATEWAY_RATE).toFixed(2),
  );

  return {
    ticketSubtotal,
    platformFee,
    gatewayFeeAbsorbed,
    totalAmount,
  };
}

/**
 * WIE's net revenue (for internal dashboard/reporting only).
 */
export function calculateWIENetRevenue(breakdown: FeeBreakdown): WIENetRevenue {
  return {
    grossFee: breakdown.platformFee,
    gatewayCost: breakdown.gatewayFeeAbsorbed,
    netRevenue: parseFloat(
      (breakdown.platformFee - breakdown.gatewayFeeAbsorbed).toFixed(2),
    ),
  };
}
