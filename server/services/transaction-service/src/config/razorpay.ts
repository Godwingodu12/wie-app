import crypto from 'crypto';
import Razorpay from 'razorpay';
class RazorpayService {
  private static instances: Map<string, Razorpay> = new Map();

  static getInstance(keyId: string, keySecret: string): Razorpay {
    const key = `${keyId}:${keySecret}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        })
      );
    }
    
    return this.instances.get(key)!;
  }

  static async createOrder(
    razorpay: Razorpay,
    amount: number,
    currency: string,
    receipt: string,
    notes?: any
  ): Promise<any> {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
        notes,
      });
      return order;
    } catch (error: any) {
      console.error('❌ Error creating Razorpay order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // ✅ FIXED: Removed require, using crypto directly
  static verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error: any) {
      console.error('❌ Error verifying signature:', error);
      return false;
    }
  }

  static async getPaymentDetails(
    razorpay: Razorpay,
    paymentId: string
  ): Promise<any> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      console.error('❌ Error fetching payment details:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }
  static async initiateRefund(
    razorpay: Razorpay,
    paymentId: string,
    amount: number,
    notes?: any
  ): Promise<any> {
    try {
      // ✅ Validate inputs
      if (!paymentId || paymentId.trim() === '') {
        throw new Error('Invalid payment ID');
      }
  
      if (!amount || amount <= 0) {
        throw new Error('Invalid refund amount: must be greater than 0');
      }
  
      // ✅ Convert to paise (Razorpay uses paise)
      const refundAmountInPaise = Math.round(amount * 100);
  
      console.log(`🔄 Creating refund request:`, {
        paymentId: paymentId.trim(),
        amountInRupees: amount,
        amountInPaise: refundAmountInPaise
      });
  
      // ✅ Create minimal refund request
      const refundRequest: any = {
        amount: refundAmountInPaise,
        speed: 'normal'
      };
  
      // ✅ Only add notes if provided and valid
      if (notes && typeof notes === 'object' && Object.keys(notes).length > 0) {
        const cleanNotes: any = {};
        
        // Only keep simple string fields
        if (notes.booking_id) {
          cleanNotes.booking_id = String(notes.booking_id).substring(0, 255);
        }
        if (notes.reason) {
          cleanNotes.reason = String(notes.reason).substring(0, 255);
        }
        
        if (Object.keys(cleanNotes).length > 0) {
          refundRequest.notes = cleanNotes;
        }
      }
  
      console.log(`📤 Sending refund request to Razorpay:`, refundRequest);
  
      // ✅ Call Razorpay API
      const refund = await razorpay.payments.refund(
        paymentId.trim(),
        refundRequest
      );
      console.log(`✅ Refund response from Razorpay:`, {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      });
      return refund;
    } catch (error: any) {
      console.error('❌ Razorpay refund error:', {
        message: error.message,
        description: error.error?.description,
        code: error.error?.code,
        field: error.error?.field,
        reason: error.error?.reason
      });
  
      // ✅ Extract meaningful error message
      if (error.error) {
        const errorMessage = error.error.description || error.error.reason || error.message || 'Unknown refund error';
        const errorCode = error.error.code || 'REFUND_ERROR';
        
        throw new Error(`Razorpay ${errorCode}: ${errorMessage}`);
      }
      
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
  static async getRefundStatus(
    razorpay: Razorpay,
    refundId: string
  ): Promise<any> {
    try {
      const refund = await razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error: any) {
      console.error('❌ Error fetching refund status:', error);
      throw new Error(`Failed to fetch refund: ${error.message}`);
    }
  }
}
export default RazorpayService;
