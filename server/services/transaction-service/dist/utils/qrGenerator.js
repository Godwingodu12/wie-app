import QRCode from 'qrcode';
export const generateQRCode = async (data) => {
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
    }
    catch (error) {
        console.error('❌ Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};
export const verifyQRCode = (qrData) => {
    try {
        const data = JSON.parse(qrData);
        // Validate required fields
        if (!data.bookingId || !data.userId || !data.ticketId) {
            return null;
        }
        return data;
    }
    catch (error) {
        console.error('❌ Invalid QR code data:', error);
        return null;
    }
};
//# sourceMappingURL=qrGenerator.js.map