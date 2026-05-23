import QRCode from "qrcode";

export interface QRCodeData {
  bookingId: string;
  userId: string;
  ticketId: string;
  eventName: string;
  location: string;
  eventDate: string;
  eventTime: string;
  quantity: number;
  userName: string;
  ticketType: string;
  pricePerTicket: number;
  totalAmount: number;
  paymentMethod?: string;
  venue?: string;
}

export interface QRPayload {
  bookingId: string;
  userId: string;
  ticketId: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  holderName: string;
  userEmail?: string;
  userPhone?: string;
  eventDate: string;
  eventTime: string;
  eventEndDate?: string;
  venue: string;
  location?: string;
  paymentMethod: string;
  subtotal?: number;
  tax?: number;
  platformFee?: number;
  totalAmount: number;
  eventImage?: string;
  bookingStatus?: string;
  groupId?: string;
  v: number;
}

export interface GenerateQRResult {
  qrDataURL: string;   // data:image/png — for display/download
  qrPayload: string;   // raw base64 string encoded inside the QR image
}

/**
 * Generates a QR code image AND returns the raw payload string
 * that is encoded inside the QR image.
 * The raw payload string is what the scanner reads.
 */
export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  const result = await generateQRCodeWithPayload(data);
  return result.qrDataURL;
};

export const generateQRCodeWithPayload = async (data: QRCodeData): Promise<GenerateQRResult> => {
  try {
    const payload: QRPayload = {
      bookingId: data.bookingId,
      userId: data.userId,
      ticketId: data.ticketId,
      eventName: data.eventName,
      ticketType: data.ticketType || "",
      quantity: data.quantity,
      holderName: data.userName || "",
      eventDate: data.eventDate || "",
      eventTime: data.eventTime || "",
      venue: data.venue || data.location || "",
      paymentMethod: data.paymentMethod || "",
      totalAmount: Number(data.totalAmount) || 0,
      subtotal: Number(data.pricePerTicket) * data.quantity || 0,
      v: 1,
    };

    // This is the raw string that gets encoded into the QR image pixels
    const qrPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

    const qrDataURL = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    return { qrDataURL, qrPayload };
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * Decode the raw string that a QR scanner returns.
 * Handles three formats for backward compatibility:
 *   1. base64-encoded JSON (new format — v1)
 *   2. plain JSON string (legacy)
 *   3. human-readable multiline text (old legacy)
 */
export const verifyQRCode = (raw: string): QRPayload | null => {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();

  // ── Format 1: base64 JSON (current)
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
    if (decoded.startsWith("{")) {
      const obj = JSON.parse(decoded) as QRPayload;
      if (obj.bookingId && obj.v) return obj;
    }
  } catch {
    /* not base64 JSON */
  }

  // ── Format 2: plain JSON (legacy)
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.bookingId) {
        // Normalise legacy shape into QRPayload
        return {
          bookingId: obj.bookingId || "",
          userId: obj.userId || "",
          ticketId: obj.ticketId || "",
          eventName: obj.eventName || "",
          ticketType: obj.ticketType || "",
          quantity: Number(obj.quantity) || 1,
          holderName: obj.userName || obj.holderName || "",
          eventDate: obj.eventDate || "",
          eventTime: obj.eventTime || "",
          venue: obj.venue || obj.location || "",
          paymentMethod: obj.paymentMethod || "",
          totalAmount: Number(obj.totalAmount) || 0,
          v: 0, // mark as legacy
        };
      }
    } catch {
      /* not valid JSON */
    }
  }

  // ── Format 3: multiline text (old legacy) 
  const get = (label: string) => {
    const m = trimmed.match(new RegExp(`${label}:\\s*([^\\n\\r]+)`, "i"));
    return m ? m[1].trim() : "";
  };
  const bookingId = get("Booking ID");
  if (bookingId) {
    return {
      bookingId,
      userId: "",
      ticketId: "",
      eventName: get("Event"),
      ticketType: get("Ticket Type") || get("Ticket"),
      quantity: Number(get("Quantity")) || 1,
      holderName: get("Booked By"),
      eventDate: get("Date"),
      eventTime: get("Time"),
      venue: get("Location") || get("Venue"),
      paymentMethod: get("Payment"),
      totalAmount: Number(get("Total Price")?.replace(/[^\d.]/g, "")) || 0,
      v: 0,
    };
  }
  return null;
};
