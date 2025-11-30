import express from 'express';
import crypto from 'crypto';
import { createNotification } from '../utils/notificationHelper';
import { BookingModel, PaymentTransactionModel } from '../models';
const router = express.Router();
// Razorpay Webhook Handler
router.post('/razorpay', async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
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
            default:
                console.log(`ℹ️ Unhandled webhook event: ${event}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// Handle payment captured - UPDATED FUNCTION
async function handlePaymentCaptured(payment) {
    try {
        const booking = await BookingModel.findByRazorpayOrderId(payment.order_id);
        if (!booking) {
            console.error('❌ Booking not found for order:', payment.order_id);
            return;
        }
        if (booking.paymentStatus === 'COMPLETED') {
            return;
        }
        await BookingModel.update(booking.id, {
            paymentStatus: 'COMPLETED',
            bookingStatus: 'CONFIRMED',
            razorpayPaymentId: payment.id,
            paymentMethod: payment.method,
        });
        // FIX: Change all || null to || undefined
        await PaymentTransactionModel.updateByRazorpayOrderId(payment.order_id, {
            status: 'COMPLETED',
            razorpayPaymentId: payment.id,
            method: payment.method || undefined, // Changed from null to undefined
            bank: payment.bank || undefined, // Changed from null to undefined
            wallet: payment.wallet || undefined, // Changed from null to undefined
            vpa: payment.vpa || undefined, // Changed from null to undefined
            email: payment.email || undefined, // Changed from null to undefined
            contact: payment.contact ? String(payment.contact) : undefined, // Changed from null to undefined
            webhookData: payment,
        });
    }
    catch (error) {
        console.error('❌ Error handling payment captured:', error);
    }
}
// Handle payment failed
async function handlePaymentFailed(payment) {
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
        await PaymentTransactionModel.updateByRazorpayOrderId(payment.order_id, {
            status: 'FAILED',
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
        });
        // Send notification
        await createNotification({
            userId: booking.userId,
            type: 'payment_failed',
            title: 'Payment Failed',
            message: `Payment for ${booking.eventDetails.eventName} failed. ${payment.error_description}`,
            bookingId: String(booking.id),
            ticketId: booking.ticketId,
        });
    }
    catch (error) {
        console.error('❌ Error handling payment failed:', error);
    }
}
// Handle refund created
async function handleRefundCreated(refund) {
    try {
        const transaction = await PaymentTransactionModel.findByRazorpayPaymentId(refund.payment_id);
        if (!transaction) {
            console.error('❌ Transaction not found for payment:', refund.payment_id);
            return;
        }
        const booking = await BookingModel.findById(transaction.bookingId);
        if (!booking) {
            console.error('❌ Booking not found:', transaction.bookingId);
            return;
        }
        await BookingModel.update(booking.id, {
            refundStatus: 'PROCESSING',
            refundAmount: parseFloat(refund.amount) / 100,
        });
    }
    catch (error) {
        console.error('❌ Error handling refund created:', error);
    }
}
// Handle refund processed
async function handleRefundProcessed(refund) {
    try {
        const transaction = await PaymentTransactionModel.findByRazorpayPaymentId(refund.payment_id);
        if (!transaction) {
            console.error('❌ Transaction not found for payment:', refund.payment_id);
            return;
        }
        const booking = await BookingModel.findById(transaction.bookingId);
        if (!booking) {
            console.error('❌ Booking not found:', transaction.bookingId);
            return;
        }
        await BookingModel.update(booking.id, {
            refundStatus: 'COMPLETED',
            paymentStatus: 'REFUNDED',
            refundProcessedAt: new Date(),
        });
        // Send notification
        await createNotification({
            userId: booking.userId,
            type: 'refund_completed',
            title: 'Refund Completed',
            message: `Refund of ₹${booking.refundAmount} has been processed for ${booking.eventDetails.eventName}`,
            bookingId: String(booking.id),
            ticketId: booking.ticketId,
        });
    }
    catch (error) {
        console.error('❌ Error handling refund processed:', error);
    }
}
export default router;
//# sourceMappingURL=webhookRoutes.js.map