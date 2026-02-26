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
  // ─── Create Razorpay Linked Account for Host (one-time onboarding)
static async createLinkedAccount(data: {
  name: string;
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType?: string;
}): Promise<any> {
  try {
    const razorpay = this.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );
    // Razorpay Route: create sub-merchant account
    const account = await (razorpay as any).accounts.create({
      email:               data.email,
      profile: {
        category:          'entertainment',
        subcategory:       'ticketing',
        addresses: {
          registered: {
            street1:   '507, Koramangala',
            street2:   '1st block',
            city:      'Bengaluru',
            state:     'KARNATAKA',
            postal_code: 560034,
            country:   'IN',
          },
        },
      },
      legal_info: {
        pan:  'AAACL1234C',  
        gst:  '29AAACL1234C1Z5',
      },
    });
    return account;
  } catch (error: any) {
    console.error('❌ Error creating linked account:', error);
    throw new Error(`Failed to create linked account: ${error.message}`);
  }
}

// ─── Transfer host share AFTER event completion (Phase 5)
static async transferToHost(data: {
  razorpayAccountId: string;   // host's linked account ID
  amount: number;               // in rupees
  currency: string;
  settlementId: string;         // used as idempotency key
  bookingId: string;
  notes?: any;
}): Promise<any> {
  try {
    const razorpay = this.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const transfer = await (razorpay as any).transfers.create({
      account:  data.razorpayAccountId,
      amount:   Math.round(data.amount * 100), // paise
      currency: data.currency || 'INR',
      notes: {
        settlementId: data.settlementId,
        bookingId:    data.bookingId,
        ...data.notes,
      },
    });

    console.log(`✅ Razorpay transfer created: ${transfer.id} → ₹${data.amount}`);
    return transfer;
  } catch (error: any) {
    console.error('❌ Error creating transfer:', error.error || error.message);
    throw new Error(
      `Transfer failed: ${error.error?.description || error.message}`
    );
  }
}

static async reverseTransfer(
  transferId: string,
  amount: number
): Promise<any> {
  try {
    const razorpay = this.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );
    const reversal = await (razorpay as any).transfers.reverse(transferId, {
      amount: Math.round(amount * 100),
    });
    return reversal;
  } catch (error: any) {
    console.error('❌ Error reversing transfer:', error.message);
    throw new Error(`Transfer reversal failed: ${error.message}`);
  }
}
}
export default RazorpayService;
