import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { createNotification } from '../utils/notificationHelper';
import { BookingModel, PaymentTransactionModel } from '../models';

const router: express.Router = express.Router();

// Razorpay Webhook Handler
router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️ Razorpay webhook secret not configured');
      return res.status(200).json({ received: true });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.refund.entity);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;

      case 'refund.failed':
        await handleRefundFailed(payload.refund.entity);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
// Handle payment captured
async function handlePaymentCaptured(payment: any) {
  try {
    const booking = await BookingModel.findByRazorpayOrderId(payment.order_id);

    if (!booking) {
      console.error('❌ Booking not found for order:', payment.order_id);
      return;
    }

    if (booking.paymentStatus === 'COMPLETED') {
      return;
    }

    // Update booking with payment details
    await BookingModel.update(booking.id, {
      paymentStatus: 'COMPLETED',
      bookingStatus: 'CONFIRMED',
      razorpayPaymentId: payment.id,
      paymentMethod: payment.method,
    });

    // Convert amounts from paise to rupees
    const amountInRupees = payment.amount / 100;
    const feeInRupees = payment.fee / 100;
    const taxInRupees = payment.tax / 100;
    const amountRefundedInRupees = payment.amount_refunded / 100;

    // Update payment transaction with complete webhook data (amounts in rupees)
    await PaymentTransactionModel.updateByRazorpayOrderId(payment.order_id, {
      status: 'COMPLETED',
      razorpayPaymentId: payment.id,
      method: payment.method || undefined,
      bank: payment.bank || undefined,
      wallet: payment.wallet || undefined,
      vpa: payment.vpa || payment.upi?.vpa || undefined,
      email: payment.email || undefined,
      contact: payment.contact ? String(payment.contact) : undefined,
      webhookData: {
        payment_id: payment.id,
        entity: payment.entity,
        order_id: payment.order_id,
        amount: amountInRupees, // Convert to rupees
        amount_in_paise: payment.amount, // Keep original for reference
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        description: payment.description,
        vpa: payment.vpa || payment.upi?.vpa || null,
        upi: payment.upi ? {
          vpa: payment.upi.vpa,
          flow: payment.upi.flow,
        } : null,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
        fee: feeInRupees, // Convert to rupees
        tax: taxInRupees, // Convert to rupees
        amount_refunded: amountRefundedInRupees, // Convert to rupees
        refund_status: payment.refund_status,
        acquirer_data: payment.acquirer_data || null,
        created_at: payment.created_at,
        captured_at: new Date().toISOString(),
      } as any,
    });

    console.log('✅ Payment captured successfully:', {
      bookingId: booking.bookingId,
      paymentId: payment.id,
      method: payment.method,
      amount: amountInRupees,
      vpa: payment.vpa || payment.upi?.vpa,
    });
  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
  }
}
// Handle payment failed
async function handlePaymentFailed(payment: any) {
  try {
    const booking = await BookingModel.findByRazorpayOrderId(payment.order_id);

    if (!booking) {
      console.error('❌ Booking not found for order:', payment.order_id);
      return;
    }

    await BookingModel.update(booking.id, {
      paymentStatus: 'FAILED',
      bookingStatus: 'CANCELLED',
    });

    const amountInRupees = payment.amount / 100;

    await PaymentTransactionModel.updateByRazorpayOrderId(payment.order_id, {
      status: 'FAILED',
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
      webhookData: {
        payment_id: payment.id,
        entity: payment.entity,
        order_id: payment.order_id,
        amount: amountInRupees, // Convert to rupees
        amount_in_paise: payment.amount, // Keep original for reference
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        error_code: payment.error_code,
        error_description: payment.error_description,
        error_source: payment.error_source,
        error_step: payment.error_step,
        error_reason: payment.error_reason,
        created_at: payment.created_at,
        failed_at: new Date().toISOString(),
      } as any,
    });

    await createNotification({
      userId: booking.userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment for ${(booking.eventDetails as any).eventName} failed. ${payment.error_description}`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
    });
  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}
async function handleRefundCreated(refund: any) {
  try {
    const transaction = await PaymentTransactionModel.findByRazorpayPaymentId(
      refund.payment_id
    );

    if (!transaction) {
      console.error('❌ Transaction not found for payment:', refund.payment_id);
      return;
    }

    const booking = await BookingModel.findById(transaction.bookingId);

    if (!booking) {
      console.error('❌ Booking not found:', transaction.bookingId);
      return;
    }

    // Calculate refund amount (convert from paise to rupees with 2 decimals)
    const refundAmountInRupees = parseFloat((refund.amount / 100).toFixed(2));

    await BookingModel.update(booking.id, {
      refundStatus: 'PROCESSING',
      refundAmount: refundAmountInRupees,
      refundId: refund.id,
      refundInitiatedAt: new Date(),
    });

    // Update refund transaction
    const refundTransactions = await PaymentTransactionModel.findByBookingId(booking.id);
    const refundTx = refundTransactions.find(tx => tx.method === 'refund');
    
    if (refundTx) {
      await PaymentTransactionModel.update(refundTx.id, {
        status: 'PROCESSING',
        refundId: refund.id,
        webhookData: {
          refund_id: refund.id,
          entity: refund.entity,
          payment_id: refund.payment_id,
          amount: refundAmountInRupees, // Already in rupees with 2 decimals
          amount_in_paise: refund.amount,
          currency: refund.currency,
          status: refund.status,
          speed: refund.speed,
          notes: refund.notes,
          created_at: refund.created_at,
          initiated_at: new Date().toISOString(),
        } as any,
      });
    }

    console.log('✅ Refund created:', {
      bookingId: booking.bookingId,
      refundId: refund.id,
      amount: refundAmountInRupees,
    });
  } catch (error) {
    console.error('❌ Error handling refund created:', error);
  }
}
async function handleRefundProcessed(refund: any) {
  try {
    const transaction = await PaymentTransactionModel.findByRazorpayPaymentId(
      refund.payment_id
    );

    if (!transaction) {
      console.error('❌ Transaction not found for payment:', refund.payment_id);
      return;
    }

    const booking = await BookingModel.findById(transaction.bookingId);

    if (!booking) {
      console.error('❌ Booking not found:', transaction.bookingId);
      return;
    }

    const refundAmountInRupees = parseFloat((refund.amount / 100).toFixed(2));

    await BookingModel.update(booking.id, {
      refundStatus: 'COMPLETED',
      paymentStatus: 'REFUNDED',
      refundProcessedAt: new Date(),
      refundAmount: refundAmountInRupees,
    });

    // Update refund transaction to completed
    const refundTransactions = await PaymentTransactionModel.findByBookingId(booking.id);
    const refundTx = refundTransactions.find(tx => tx.method === 'refund');
    
    if (refundTx) {
      await PaymentTransactionModel.update(refundTx.id, {
        status: 'COMPLETED',
        webhookData: {
          refund_id: refund.id,
          entity: refund.entity,
          payment_id: refund.payment_id,
          amount: refundAmountInRupees, // Already in rupees with 2 decimals
          amount_in_paise: refund.amount,
          currency: refund.currency,
          status: refund.status,
          speed: refund.speed,
          notes: refund.notes,
          created_at: refund.created_at,
          processed_at: new Date().toISOString(),
        } as any,
      });
    }

    await createNotification({
      userId: booking.userId,
      type: 'refund_completed',
      title: 'Refund Completed ✅',
      message: `Refund of ₹${refundAmountInRupees.toFixed(2)} has been processed successfully for ${(booking.eventDetails as any).eventName}`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
    });

    console.log('✅ Refund completed:', {
      bookingId: booking.bookingId,
      refundId: refund.id,
      amount: refundAmountInRupees,
    });
  } catch (error) {
    console.error('❌ Error handling refund processed:', error);
  }
}
// Handle refund failed
async function handleRefundFailed(refund: any) {
  try {
    const transaction = await PaymentTransactionModel.findByRazorpayPaymentId(
      refund.payment_id
    );

    if (!transaction) {
      console.error('❌ Transaction not found for payment:', refund.payment_id);
      return;
    }

    const booking = await BookingModel.findById(transaction.bookingId);

    if (!booking) {
      console.error('❌ Booking not found:', transaction.bookingId);
      return;
    }

    const refundAmountInRupees = refund.amount / 100;

    await BookingModel.update(booking.id, {
      refundStatus: 'FAILED',
    });

    // Update refund transaction to failed
    const refundTransactions = await PaymentTransactionModel.findByBookingId(booking.id);
    const refundTx = refundTransactions.find(tx => tx.method === 'refund');
    
    if (refundTx) {
      await PaymentTransactionModel.update(refundTx.id, {
        status: 'FAILED',
        errorCode: refund.error_code,
        errorDescription: refund.error_description,
        webhookData: {
          refund_id: refund.id,
          entity: refund.entity,
          payment_id: refund.payment_id,
          amount: refundAmountInRupees, // Convert to rupees
          amount_in_paise: refund.amount, // Keep original for reference
          currency: refund.currency,
          status: refund.status,
          error_code: refund.error_code,
          error_description: refund.error_description,
          error_source: refund.error_source,
          error_reason: refund.error_reason,
          created_at: refund.created_at,
          failed_at: new Date().toISOString(),
        } as any,
      });
    }

    await createNotification({
      userId: booking.userId,
      type: 'refund_failed',
      title: 'Refund Processing',
      message: `Refund processing encountered an issue. Our team will process it manually within 5-7 business days.`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
    });
    console.error('❌ Refund failed:', {
      bookingId: booking.bookingId,
      refundId: refund.id,
      amount: refundAmountInRupees,
      error: refund.error_description,
    });
  } catch (error) {
    console.error('❌ Error handling refund failed:', error);
  }
}
export default router;
