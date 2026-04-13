import QRCode from "qrcode";

interface QRCodeData {
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
}

export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const lines = [
      `Event: ${data.eventName}`,
      `Date & Time: ${data.eventDate} | ${data.eventTime}`,
      `Quantity: ${data.quantity} Ticket(s) [${data.ticketType}]`,
      `Location: ${data.location}`,
      `Total Price: Rs.${data.totalAmount}`,
      `Booked By: ${data.userName}`,
    ];

    const qrData = lines.join("\n");

    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

export const verifyQRCode = (qrData: string): Partial<QRCodeData> | null => {
  try {
    // Check for JSON format first (legacy support)
    if (qrData.trim().startsWith("{")) {
      const data = JSON.parse(qrData);
      if (!data.bookingId) return null;
      return data;
    }

    // Support for the new formatted string
    const bookingIdMatch = qrData.match(/Booking ID:\s*([^\n\r]+)/i);
    const eventNameMatch = qrData.match(/Event:\s*([^\n\r]+)/i);
    const userNameMatch = qrData.match(/Booked By:\s*([^\n\r]+)/i);

    if (bookingIdMatch) {
      return {
        bookingId: bookingIdMatch[1].trim(),
        eventName: eventNameMatch ? eventNameMatch[1].trim() : undefined,
        userName: userNameMatch ? userNameMatch[1].trim() : undefined,
      } as any;
    }

    return null;
  } catch (error) {
    console.error("❌ Invalid QR code data:", error);
    return null;
  }
};
