import QRCode from 'qrcode';

interface QRCodeData {
  bookingId: string;
  userId: string;
  ticketId: string;
  eventName: string;
  eventDate: string;
  quantity: number;
}

export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const qrData = JSON.stringify({
      bookingId: data.bookingId,
      userId: data.userId,
      ticketId: data.ticketId,
      eventName: data.eventName,
      eventDate: data.eventDate,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
    });

    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const verifyQRCode = (qrData: string): QRCodeData | null => {
  try {
    const data = JSON.parse(qrData);
    
    // Validate required fields
    if (!data.bookingId || !data.userId || !data.ticketId) {
      return null;
    }

    return data as QRCodeData;
  } catch (error) {
    console.error('❌ Invalid QR code data:', error);
    return null;
  }
};