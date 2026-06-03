import { Request, Response } from "express";
import { SettlementService } from "../services/settlementService";
import { getEventCancellationInfo } from "../grpc/ticketClient";
import { BookingModel, PaymentTransactionModel } from "../models";
import RazorpayService from "../config/razorpay";
import { createNotification } from "../utils/notificationHelper";
import { LedgerModel } from "../models/ledger.model";
import { prisma } from "../config/db";
import amqp from "amqplib";
export const getPlatformEarnings = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const earnings = await SettlementService.getPlatformEarnings(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    res.status(200).json({
      success: true,
      data: earnings,
    });
  } catch (error: any) {
    console.error("❌ Error fetching platform earnings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingSettlements = async (req: Request, res: Response) => {
  try {
    const settlements = await SettlementService.getPendingSettlements();

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error("❌ Error fetching pending settlements:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrganizationSettlements = async (
  req: Request,
  res: Response,
) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    const settlements = await SettlementService.getOrganizationSettlements(
      groupId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error("❌ Error fetching organization settlements:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processSettlement = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;

    const settlement = await SettlementService.processSettlement(settlementId);

    res.status(200).json({
      success: true,
      message: "Settlement processing initiated",
      data: settlement,
    });
  } catch (error: any) {
    console.error("❌ Error processing settlement:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettlementStats = async (req: Request, res: Response) => {
  try {
    const stats = await SettlementService.getSettlementStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Error fetching settlement stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerEventCancellationRefunds = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      eventId,
      parentEventId,
      isSubEvent,
      refundPercentage,
      eventName,
      paymentType,
    } = req.body;

    if (!eventId) {
      return res
        .status(400)
        .json({ success: false, message: "eventId is required" });
    }

    // Free event — no refund, just notify
    if (paymentType === "free") {
      await _notifyFreeEventCancellation(eventId, eventName);
      return res.status(200).json({
        success: true,
        message: "Free event cancellation notifications sent",
        refundsProcessed: 0,
      });
    }

    // Fetch all confirmed/pending bookings for this event
    const bookings = await BookingModel.findByTicketIdWithStatus(eventId, [
      "CONFIRMED",
      "PENDING",
    ]);

    if (!bookings.length) {
      return res.status(200).json({
        success: true,
        message: "No bookings to refund",
        refundsProcessed: 0,
      });
    }

    // Mark all bookings as REFUND_PENDING
    await Promise.all(
      bookings.map((b: any) => {
        // ✅ Ticket portion follows refundPercentage; addons are always 100% back
        const ticketRefund = parseFloat(((parseFloat(b.subtotal.toString()) * refundPercentage) / 100).toFixed(2));
        const foodAddon = parseFloat(b.food_addon_amount?.toString() || '0');
        const accAddon = parseFloat(b.accommodation_addon_amount?.toString() || '0');
        const totalRefund = parseFloat((ticketRefund + foodAddon + accAddon).toFixed(2));

        return BookingModel.update(b.id, {
          bookingStatus: 'CANCELLED',
          cancellationReason: `Event cancelled by host: ${eventName}`,
          refundStatus: 'PENDING',
          refundAmount: totalRefund,
        });
      }),
    );

    // Push each booking to the REFUND queue (async, rate-limited)
    await _publishBulkRefundJobs(
      bookings,
      refundPercentage,
      eventName,
      eventId,
    );

    // Update escrow: mark funds as REFUND_INITIATED (unblock from host payout)
    await SettlementService.markEscrowAsRefunding(eventId);

    res.status(200).json({
      success: true,
      message: `Refund jobs queued for ${bookings.length} bookings`,
      refundsQueued: bookings.length,
      refundPercentage,
    });
  } catch (error: any) {
    console.error("❌ triggerEventCancellationRefunds error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PROCESS SINGLE REFUND JOB (called by refund worker consumer)
export const processRefundJob = async (
  bookingId: string,
  refundPercentage: number,
  eventName: string,
) => {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    console.error(`❌ Refund job: booking ${bookingId} not found`);
    return;
  }

  if (booking.refundStatus === "COMPLETED") {
    return; // Already refunded — idempotency guard
  }

  const subtotal = parseFloat(booking.subtotal.toString());
  const foodAddon = parseFloat((booking as any).food_addon_amount?.toString() || '0');
  const accAddon = parseFloat((booking as any).accommodation_addon_amount?.toString() || '0');
  // ✅ Ticket portion per policy + full addon refund
  const ticketRefund = parseFloat(((subtotal * refundPercentage) / 100).toFixed(2));
  const refundAmount = parseFloat((ticketRefund + foodAddon + accAddon).toFixed(2));
  const isPaid =
    refundAmount > 0 &&
    booking.paymentStatus === "COMPLETED" &&
    booking.razorpayPaymentId;

  if (!isPaid) {
    await BookingModel.update(booking.id, {
      bookingStatus: "CANCELLED",
      refundStatus: "NOT_APPLICABLE",
    });
    await _sendCancellationNotification(
      booking.userId,
      eventName,
      booking.ticketId,
      String(booking.id),
      0,
      false,
    );
    return;
  }

  try {
    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!,
    );

    const refund = await RazorpayService.initiateRefund(
      razorpay,
      booking.razorpayPaymentId!.trim(),
      refundAmount,
      {
        booking_id: booking.bookingId,
        reason: `Event cancelled: ${eventName}`,
      },
    );

    // ── In test mode (and live with speed:'optimum'), Razorpay returns
    //    status='processed' immediately. Treat both 'processed' and any
    const razorpayStatus = refund.status;
    // In test mode Razorpay always returns 'pending' even with speed:'optimum'
    const isTestMode =
      process.env.NODE_ENV === "development" ||
      process.env.RAZORPAY_TEST_MODE === "true";
    const isCompleted = !!refund.id && razorpayStatus !== "failed";
    const refundStatus = isCompleted ? "COMPLETED" : "PROCESSING";
    const now = new Date();

    await BookingModel.update(booking.id, {
      refundAmount,
      refundStatus,
      refundId: refund.id,
      refundInitiatedAt: now,
      refundProcessedAt: isCompleted ? now : undefined,
    });

    await PaymentTransactionModel.create({
      bookingId: booking.id,
      razorpayOrderId:
        booking.razorpayOrderId || `event_cancel_${booking.bookingId}`,
      razorpayPaymentId: booking.razorpayPaymentId ?? undefined,
      amount: refundAmount,
      currency: "INR",
      status: isCompleted ? "COMPLETED" : "PROCESSING",
      method: "refund",
      refundId: refund.id,
      webhookData: {
        eventCancellationRefund: true,
        refundPercentage,
        eventName,
        razorpayRefundStatus: razorpayStatus,
        isTestMode,
      } as any,
    });

    if (isCompleted) {
      // ── Publish refund success event to RabbitMQ for notification-service ──
      await _publishRefundSuccessEvent({
        bookingId: String(booking.id),
        userId: booking.userId,
        ticketId: booking.ticketId,
        eventName,
        refundAmount,
        refundId: refund.id,
        refundStatus: "COMPLETED",
        processedAt: now.toISOString(),
      });

      await _sendRefundSuccessNotification(
        booking.userId,
        eventName,
        booking.ticketId,
        String(booking.id),
        refundAmount,
        refund.id,
      );
    } else {
      await _sendCancellationNotification(
        booking.userId,
        eventName,
        booking.ticketId,
        String(booking.id),
        refundAmount,
        true,
      );
    }
  } catch (refundErr: any) {
    console.error(
      `❌ Refund failed for booking ${bookingId}:`,
      refundErr.message,
    );
    const retryCount = (booking as any).refundRetryCount || 0;
    await BookingModel.update(booking.id, {
      refundStatus: retryCount >= 3 ? "FAILED" : "PENDING",
      refundRetryCount: retryCount + 1,
    } as any);

    await _sendCancellationNotification(
      booking.userId,
      eventName,
      booking.ticketId,
      String(booking.id),
      refundAmount,
      true,
      true,
    );
  }
};

// POST /settlements/host/create-linked-account
export const createHostLinkedAccount = async (req: Request, res: Response) => {
  try {
    const { groupId, name, email, phone, legalBusinessName } = req.body;

    if (!groupId || !email || !legalBusinessName) {
      return res.status(400).json({
        success: false,
        message: "groupId, email, and legalBusinessName are required",
      });
    }

    // Check if already exists — use snake_case field name
    const existing = await prisma.hostLinkedAccount.findUnique({
      where: { group_id: groupId },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Linked account already exists",
        data: {
          id: existing.id,
          razorpayAccountId: existing.razorpay_account_id,
          kycStatus: existing.kyc_status,
        },
      });
    }

    const account = await RazorpayService.createLinkedAccount({
      name,
      email,
      phone,
      legalBusinessName,
    });

    // Create using snake_case field names
    const hostAccount = await prisma.hostLinkedAccount.create({
      data: {
        group_id: groupId,
        razorpay_account_id: account.id,
        kyc_status: "pending",
        business_name: legalBusinessName,
        email,
      },
    });

    res.status(201).json({
      success: true,
      message: "Host linked account created",
      data: {
        id: hostAccount.id,
        razorpayAccountId: hostAccount.razorpay_account_id,
        kycStatus: hostAccount.kyc_status,
      },
    });
  } catch (error: any) {
    console.error("❌ createHostLinkedAccount error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  POST /settlements/event/:ticketId/complete
// Call this when an event is marked completed — triggers host payouts
export const triggerEventCompletion = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res
        .status(400)
        .json({ success: false, message: "ticketId required" });
    }
    const result = await SettlementService.triggerEventSettlements(ticketId);
    await SettlementService.releaseEscrowToHost(ticketId);

    res.status(200).json({
      success: true,
      message: `Settlement jobs queued for ${result.queued} bookings`,
      data: {
        queued: result.queued,
        reservedAmount: result.reserved,
        note: `7.5% reserve withheld per booking for refund safety`,
      },
    });
  } catch (error: any) {
    console.error("❌ triggerEventCompletion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// GET /settlements/ledger/:ticketId
export const getLedgerByTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const entries = await prisma.ledger.findMany({
      where: { ticket_id: ticketId },
      orderBy: { created_at: "desc" },
    });

    const summary = {
      totalPayments: entries
        .filter((e) => e.type === "PAYMENT")
        .reduce((s, e) => s + parseFloat(e.credit?.toString() || "0"), 0),

      totalRefunds: entries
        .filter((e) => e.type === "REFUND")
        .reduce((s, e) => s + parseFloat(e.debit?.toString() || "0"), 0),

      totalSettled: entries
        .filter((e) => e.type === "SETTLEMENT")
        .reduce((s, e) => s + parseFloat(e.debit?.toString() || "0"), 0),

      totalAdjustments: entries
        .filter((e) => e.type === "ADJUSTMENT")
        .reduce((s, e) => s + parseFloat(e.debit?.toString() || "0"), 0),
    };

    res.status(200).json({ success: true, data: { entries, summary } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const _publishBulkRefundJobs = async (
  bookings: any[],
  refundPercentage: number,
  eventName: string,
  eventId: string,
) => {
  let conn: any, ch: any;
  try {
    conn = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
    ch = await conn.createChannel();
    await ch.assertQueue("wie.refund.jobs", { durable: true });

    for (const booking of bookings) {
      ch.sendToQueue(
        "wie.refund.jobs",
        Buffer.from(
          JSON.stringify({
            bookingId: booking.id,
            bookingDbId: booking.bookingId,
            userId: booking.userId,
            ticketId: booking.ticketId,
            refundPercentage,
            eventName,
            eventId,
            enqueuedAt: new Date().toISOString(),
          }),
        ),
        { persistent: true },
      );
    }
  } finally {
    if (ch) await ch.close();
    if (conn) await conn.close();
  }
};

const _sendCancellationNotification = async (
  userId: string,
  eventName: string,
  ticketId: string,
  bookingId: string,
  refundAmount: number,
  isPaid: boolean,
  isFailed = false,
) => {
  try {
    const title = isFailed
      ? "Refund Will Be Processed Manually"
      : isPaid
        ? "Event Cancelled — Refund Initiated"
        : "Event Cancelled";

    const message = isFailed
      ? `Your event "${eventName}" was cancelled. Refund of ₹${refundAmount.toFixed(2)} will be processed manually within 5–7 business days.`
      : isPaid
        ? `Your event "${eventName}" was cancelled by the host. A refund of ₹${refundAmount.toFixed(2)} has been initiated and will be credited within 5–7 business days.`
        : `Your registration for "${eventName}" has been cancelled by the host.`;

    await createNotification({
      userId,
      type: "event_cancelled",
      title,
      message,
      ticketId,
      bookingId,
      link: `/bookings/${bookingId}`,
    });
  } catch (err: any) {
    console.error("⚠️ Notification failed for user", userId, err.message);
  }
};

const _notifyFreeEventCancellation = async (
  eventId: string,
  eventName: string,
) => {
  const bookings = await BookingModel.findByTicketIdWithStatus(eventId, [
    "CONFIRMED",
    "PENDING",
  ]);
  await Promise.all(
    bookings.map((b: any) =>
      Promise.all([
        BookingModel.update(b.id, {
          bookingStatus: "CANCELLED",
          cancellationReason: `Event cancelled: ${eventName}`,
        }),
        _sendCancellationNotification(
          b.userId,
          eventName,
          eventId,
          String(b.id),
          0,
          false,
        ),
      ]),
    ),
  );
};

// ── Publish refund.success to RabbitMQ (consumed by notification-service) ──
const _publishRefundSuccessEvent = async (data: {
  bookingId: string;
  userId: string;
  ticketId: string;
  eventName: string;
  refundAmount: number;
  refundId: string;
  refundStatus: string;
  processedAt: string;
}) => {
  let conn: any, ch: any;
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
    conn = await amqp.connect(RABBITMQ_URL);
    ch = await conn.createChannel();

    // Use exchange for notification-service to consume
    await ch.assertExchange("wie.events", "topic", { durable: true });
    ch.publish(
      "wie.events",
      "refund.success",
      Buffer.from(JSON.stringify(data)),
      { persistent: true },
    );
    console.log(
      `✅ [RefundSuccess] Published refund.success for booking ${data.bookingId}`,
    );
  } catch (err: any) {
    console.error("⚠️ [RefundSuccess] Failed to publish:", err.message);
  } finally {
    if (ch)
      try {
        await ch.close();
      } catch (_) { }
    if (conn)
      try {
        await conn.close();
      } catch (_) { }
  }
};

// ── In-process notification for instant refund success ──
const _sendRefundSuccessNotification = async (
  userId: string,
  eventName: string,
  ticketId: string,
  bookingId: string,
  refundAmount: number,
  refundId: string,
) => {
  try {
    await createNotification({
      userId,
      type: "refund_success",
      title: "✅ Refund Successful",
      message: `Your refund of ₹${refundAmount.toFixed(2)} for "${eventName}" has been processed successfully. Refund ID: ${refundId}`,
      ticketId,
      bookingId,
      link: `/bookings/${bookingId}`,
    });
  } catch (err: any) {
    console.error(
      "⚠️ [RefundSuccess] Notification failed for user",
      userId,
      err.message,
    );
  }
};
