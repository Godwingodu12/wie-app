import crypto from 'crypto';
import Razorpay from 'razorpay';
class RazorpayService {
    static getInstance(keyId, keySecret) {
        const key = `${keyId}:${keySecret}`;
        if (!this.instances.has(key)) {
            this.instances.set(key, new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            }));
        }
        return this.instances.get(key);
    }
    static async createOrder(razorpay, amount, currency, receipt, notes) {
        try {
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency,
                receipt,
                notes,
            });
            return order;
        }
        catch (error) {
            console.error('❌ Error creating Razorpay order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }
    // ✅ FIXED: Removed require, using crypto directly
    static verifySignature(orderId, paymentId, signature, secret) {
        try {
            const generatedSignature = crypto
                .createHmac('sha256', secret)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');
            return generatedSignature === signature;
        }
        catch (error) {
            console.error('❌ Error verifying signature:', error);
            return false;
        }
    }
    static async getPaymentDetails(razorpay, paymentId) {
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        }
        catch (error) {
            console.error('❌ Error fetching payment details:', error);
            throw new Error(`Failed to fetch payment: ${error.message}`);
        }
    }
    static async initiateRefund(razorpay, paymentId, amount, notes) {
        try {
            // Validate inputs
            if (!paymentId || paymentId.trim() === '') {
                throw new Error('Invalid payment ID');
            }
            if (!amount || amount <= 0) {
                throw new Error('Invalid refund amount');
            }
            const refundAmountInPaise = Math.round(amount * 100);
            console.log('🔄 Preparing refund request:', {
                paymentId: paymentId.trim(),
                amountInRupees: amount,
                amountInPaise: refundAmountInPaise,
            });
            // ✅ Create refund request with minimal parameters
            const refundRequest = {
                amount: refundAmountInPaise,
            };
            // Only add notes if they exist and are not empty
            if (notes && typeof notes === 'object' && Object.keys(notes).length > 0) {
                // Clean notes - remove any undefined or null values
                const cleanNotes = {};
                Object.keys(notes).forEach(key => {
                    if (notes[key] !== undefined && notes[key] !== null) {
                        cleanNotes[key] = String(notes[key]);
                    }
                });
                if (Object.keys(cleanNotes).length > 0) {
                    refundRequest.notes = cleanNotes;
                }
            }
            console.log('📤 Sending refund request to Razorpay:', refundRequest);
            // ✅ Call Razorpay refund API
            const refund = await razorpay.payments.refund(paymentId.trim(), refundRequest);
            console.log('✅ Refund initiated successfully:', {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
                paymentId: refund.payment_id,
            });
            return refund;
        }
        catch (error) {
            console.error('❌ Razorpay refund error:', {
                statusCode: error.statusCode,
                error: error.error,
            });
            // Log detailed error information
            if (error.error) {
                console.error('📋 Razorpay Error Details:', {
                    code: error.error.code,
                    description: error.error.description,
                    field: error.error.field,
                    source: error.error.source,
                    step: error.error.step,
                    reason: error.error.reason,
                    metadata: error.error.metadata,
                });
            }
            // Throw with better error message
            const errorMessage = error.error?.description || error.message || 'Unknown refund error';
            const errorCode = error.error?.code || 'REFUND_ERROR';
            throw new Error(`Razorpay ${errorCode}: ${errorMessage}`);
        }
    }
    static async getRefundStatus(razorpay, refundId) {
        try {
            const refund = await razorpay.refunds.fetch(refundId);
            return refund;
        }
        catch (error) {
            console.error('❌ Error fetching refund status:', error);
            throw new Error(`Failed to fetch refund: ${error.message}`);
        }
    }
}
RazorpayService.instances = new Map();
export default RazorpayService;
//# sourceMappingURL=razorpay.js.map