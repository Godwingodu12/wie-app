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

  const { booking, refundTransactions } = refundData;
  const statusInfo = getStatusText(booking.refundStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push(`/bookings/${bookingId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Booking Details
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Refund Tracking</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon(booking.refundStatus)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusInfo.title}</h2>
            <p className="text-gray-600 mb-6">{statusInfo.message}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-gray-900">₹{booking.refundAmount}</span>
            </div>

            {booking.refundStatus === 'PROCESSING' && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Estimated Processing Time</p>
                <p>Your refund will be credited to your account within 5-7 business days.</p>
              </div>
            )}

            {booking.refundStatus === 'COMPLETED' && booking.refundProcessedAt && (
              <div className="mt-6 text-sm text-gray-600">
                <p>Processed on {formatDate(booking.refundProcessedAt)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Booking Summary */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{booking.eventDetails.eventName}</p>
                  <p className="text-sm text-gray-600">
                    {booking.quantity} × {booking.ticketType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Event Date</p>
                  <p className="text-gray-600">
                    {booking.eventDetails.eventDate} {booking.eventDetails.eventTime}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Ticket Amount</span>
                  <span>₹{booking.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Platform Fee (Non-refundable)</span>
                  <span>₹{booking.platformFee}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Refund Amount</span>
                  <span className="text-green-600">₹{booking.refundAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Refund Timeline */}
        {refundTransactions && refundTransactions.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Refund Timeline</h3>
              <div className="space-y-4">
                {refundTransactions.map((transaction: any, index: number) => (
                  <div key={transaction.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status === 'COMPLETED' ? 'bg-green-500' :
                        transaction.status === 'PROCESSING' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      {index < refundTransactions.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {transaction.status === 'COMPLETED' ? 'Refund Completed' :
                             transaction.status === 'PROCESSING' ? 'Refund Initiated' :
                             'Refund Failed'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            ₹{transaction.amount}
                          </p>
                          {transaction.refundId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Refund ID: {transaction.refundId}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}