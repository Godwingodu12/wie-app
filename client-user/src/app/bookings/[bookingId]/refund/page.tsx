'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { trackRefund } from '@/services/transactionService';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  IndianRupee,
  Calendar,
  Ticket,
} from 'lucide-react';

export default function RefundTrackingPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [refundData, setRefundData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRefundData();
  }, [bookingId]);

  const loadRefundData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trackRefund(bookingId);
      setRefundData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refund details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRefundData();
    setRefreshing(false);
  };
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: <CheckCircle className="w-16 h-16 text-green-500" />,
        title: '✅ Refund Successful',
        message: 'Your refund has been credited successfully.',
        bg: 'bg-green-50', border: 'border-green-200', textColor: 'text-green-700',
        amountColor: 'text-green-600',
      };
    case 'PROCESSING':
      return {
        icon: <Clock className="w-16 h-16 text-yellow-500" />,
        title: '↻ Refund Processing',
        message: 'Your refund is being processed. It will reflect shortly.',
        bg: 'bg-yellow-50', border: 'border-yellow-200', textColor: 'text-yellow-700',
        amountColor: 'text-yellow-600',
      };
    case 'FAILED':
      return {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: '✕ Refund Failed',
        message: 'Refund could not be processed automatically. Our team will handle it manually within 2 business days.',
        bg: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-700',
        amountColor: 'text-red-600',
      };
    default:
      return {
        icon: <Clock className="w-16 h-16 text-gray-400" />,
        title: '⏳ Refund Pending',
        message: 'Your refund has been queued and will be initiated shortly.',
        bg: 'bg-gray-50', border: 'border-gray-200', textColor: 'text-gray-600',
        amountColor: 'text-gray-700',
      };
  }
};
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'PROCESSING':
        return <Clock className="w-8 h-8 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Clock className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { title: 'Refund Completed', message: 'Your refund has been processed successfully' };
      case 'PROCESSING':
        return { title: 'Refund Processing', message: 'Your refund is being processed' };
      case 'FAILED':
        return { title: 'Refund Failed', message: 'Refund will be processed manually' };
      default:
        return { title: 'Refund Status', message: 'Checking refund status...' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !refundData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Refund Details</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </Card>
        </div>
      </div>
    );
  }
const { booking, refundTransactions, refundSummary } = refundData;

  // Prefer refundSummary from updated backend; fall back to booking fields
  const refundStatus    = refundSummary?.status      ?? booking?.refundStatus    ?? 'PENDING';
  const refundAmount    = refundSummary?.refundAmount ?? booking?.refundAmount    ?? 0;
  const refundId        = refundSummary?.refundId     ?? booking?.refundId        ?? null;
  const processedAt     = refundSummary?.refundProcessedAt ?? booking?.refundProcessedAt ?? null;
  const initiatedAt     = refundSummary?.refundInitiatedAt ?? booking?.refundInitiatedAt ?? null;
  const isCompleted     = refundStatus === 'COMPLETED';
  const isFailed        = refundStatus === 'FAILED';
  const cfg             = getStatusConfig(refundStatus);

  const isAdminCancelled =
    booking?.cancellationReason?.toLowerCase().includes('event cancelled') ||
    booking?.cancellationReason?.toLowerCase().includes('cancelled by host');

  // Stepper steps
  const steps = [
    { label: 'Event Cancellation Confirmed', done: true,         time: booking?.cancelledAt },
    { label: 'Refund Initiated',             done: !!initiatedAt, time: initiatedAt },
    { label: 'Refund Processing',            done: refundStatus === 'PROCESSING' || isCompleted, time: null },
    { label: 'Refund Credited to Account',   done: isCompleted,   time: processedAt },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/bookings/${bookingId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Booking
        </button>

        {/* Admin-cancelled banner */}
        {isAdminCancelled && (
          <div className="mb-4 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Host cancelled this event</p>
              <p className="text-orange-700 text-xs mt-0.5">
                Your refund was automatically initiated when the host cancelled.
              </p>
            </div>
          </div>
        )}

        {/* ── Main Status Card ── */}
        <Card className={`mb-6 border-2 ${cfg.border} ${cfg.bg}`}>
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">{cfg.icon}</div>
            <h1 className={`text-2xl font-bold mb-2 ${cfg.textColor}`}>{cfg.title}</h1>
            <p className="text-gray-600 text-sm mb-6">{cfg.message}</p>

            {/* Amount */}
            {refundAmount > 0 && (
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border ${cfg.border} mb-4`}>
                <IndianRupee className={`w-5 h-5 ${cfg.amountColor}`} />
                <span className={`text-3xl font-bold ${cfg.amountColor}`}>
                  {parseFloat(refundAmount).toFixed(2)}
                </span>
              </div>
            )}

            {/* Refund ID */}
            {refundId && (
              <p className="text-xs text-gray-400 mt-2">
                Refund ID: <span className="font-mono">{refundId}</span>
              </p>
            )}

            {/* Processed date */}
            {isCompleted && processedAt && (
              <p className={`text-sm font-medium mt-3 ${cfg.textColor}`}>
                Processed on {formatDate(processedAt)}
              </p>
            )}

            {/* Refresh button */}
            {!isCompleted && !isFailed && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-5 flex items-center gap-2 mx-auto px-5 py-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh Status'}
              </button>
            )}
          </div>
        </Card>

        {/* ── Stepper Timeline ── */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5">Refund Timeline</h2>
            <ol className="space-y-0">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  {/* Connector column */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      step.done
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {step.done
                        ? <CheckCircle className="w-4 h-4 text-white" />
                        : <div className="w-2 h-2 rounded-full bg-gray-300" />
                      }
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pb-6 pt-0.5 flex-1">
                    <p className={`text-sm font-semibold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.done && step.time && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(step.time)}</p>
                    )}
                    {/* Special note for COMPLETED step */}
                    {i === 3 && isCompleted && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Amount credited ✓
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        {/* ── Booking Summary ── */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(booking?.eventDetails as any)?.eventName || 'Event'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking?.quantity} × {booking?.ticketType}
                    {' · '}Booking ID: {booking?.bookingId}
                  </p>
                </div>
              </div>

              {(booking?.eventDetails as any)?.eventDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {(booking?.eventDetails as any).eventDate}
                    {(booking?.eventDetails as any).eventTime && ` · ${(booking?.eventDetails as any).eventTime}`}
                  </p>
                </div>
              )}

              {/* Amount breakdown */}
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ticket Amount</span>
                  <span>₹{booking?.subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee {isAdminCancelled ? '(Retained)' : '(Non-refundable)'}</span>
                  <span className={isAdminCancelled ? 'text-red-500' : ''}>
                    ₹{booking?.platformFee}
                  </span>
                </div>
                {isAdminCancelled && booking?.subtotal && refundAmount && (
                  <div className="flex justify-between text-orange-600 text-xs">
                    <span>Refund % Applied</span>
                    <span>
                      {Math.round((parseFloat(refundAmount) / parseFloat(booking.subtotal)) * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Refund Amount</span>
                  <span className={cfg.amountColor}>₹{parseFloat(refundAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Raw Transactions (collapsed by default) ── */}
        {refundTransactions && refundTransactions.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Transaction Log</h2>
              <div className="space-y-3">
                {refundTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {tx.status === 'COMPLETED' ? '✅ Refund Completed' :
                         tx.status === 'PROCESSING' ? '↻ Processing' :
                         '✕ Failed'}
                      </p>
                      {tx.refundId && (
                        <p className="text-xs text-gray-400 font-mono">ID: {tx.refundId}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{tx.amount}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Support CTA for failed refunds ── */}
        {isFailed && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-5 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">Refund needs manual processing</p>
                <p className="text-red-600 text-xs mt-1">
                  Our team will process your ₹{parseFloat(refundAmount).toFixed(2)} refund within 2 business days.
                </p>
                <button
                  onClick={() => router.push('/support')}
                  className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Refresh footer for non-completed */}
        {!isCompleted && !isFailed && (
          <p className="text-center text-xs text-gray-400 pb-4">
            Page auto-refreshes when refund completes. You&apos;ll also receive a notification.
          </p>
        )}

      </div>
    </div>
  );
}
