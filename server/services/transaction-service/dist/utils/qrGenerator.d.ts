interface QRCodeData {
    bookingId: string;
    userId: string;
    ticketId: string;
    eventName: string;
    eventDate: string;
    quantity: number;
}
export declare const generateQRCode: (data: QRCodeData) => Promise<string>;
export declare const verifyQRCode: (qrData: string) => QRCodeData | null;
export {};
//# sourceMappingURL=qrGenerator.d.ts.map