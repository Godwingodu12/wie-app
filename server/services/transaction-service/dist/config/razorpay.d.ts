import Razorpay from 'razorpay';
declare class RazorpayService {
    private static instances;
    static getInstance(keyId: string, keySecret: string): Razorpay;
    static createOrder(razorpay: Razorpay, amount: number, currency: string, receipt: string, notes?: any): Promise<any>;
    static verifySignature(orderId: string, paymentId: string, signature: string, secret: string): boolean;
    static getPaymentDetails(razorpay: Razorpay, paymentId: string): Promise<any>;
    static initiateRefund(razorpay: Razorpay, paymentId: string, amount: number, notes?: any): Promise<any>;
    static getRefundStatus(razorpay: Razorpay, refundId: string): Promise<any>;
}
export default RazorpayService;
//# sourceMappingURL=razorpay.d.ts.map