'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getUserBookings, getUserCancelledBookings, Booking, CancelledBooking } from '@/services/transactionService';
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  QrCode,
  RefreshCw,
} from 'lucide-react';
export default function BookingsPage() {
  useAuth(true);
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<CancelledBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch cancelled separately from dedicated API
      const [regularRes, cancelledRes] = await Promise.all([
        getUserBookings({ limit: 50, status: filter !== 'all' && filter !== 'cancelled' ? filter.toUpperCase() : undefined }),
        getUserCancelledBookings(),
      ]);

      // For non-cancelled tabs show regular bookings (excluding CANCELLED ones from regular API)
      const regularBookings = (regularRes.data.bookings || []).filter(
        (b: Booking) => b.bookingStatus !== 'CANCELLED'
      );
      setBookings(regularBookings);
      setCancelledBookings(cancelledRes.data.cancelledBookings || []);
      setPendingRefundsCount(cancelledRes.data.pendingRefunds || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING':   return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'EXPIRED':   return 'bg-gray-100 text-gray-800';
      case 'VERIFIED':  return 'bg-blue-100 text-blue-800';
      default:          return 'bg-blue-100 text-blue-800';
    }
  };

  const getRefundBadge = (booking: Booking) => {
    if (booking.bookingStatus !== 'CANCELLED' || !booking.refundAmount) return null;
    const colors: Record<string, string> = {
      COMPLETED:  'bg-green-50 text-green-700 border-green-200',
      PROCESSING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      PENDING:    'bg-orange-50 text-orange-700 border-orange-200',
      FAILED:     'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = {
      COMPLETED:  '✓ Refund Completed',
      PROCESSING: '↻ Refund Processing',
      PENDING:    '⏳ Refund Pending',
      FAILED:     '✕ Refund Failed',
    };
    const style = colors[booking.refundStatus || 'PENDING'] || colors.PENDING;
    const label = labels[booking.refundStatus || 'PENDING'] || labels.PENDING;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {label} · ₹{booking.refundAmount}
      </span>
    );
  };
  // Detect if cancellation was by admin/host (cancellationReason contains "Event cancelled by host")
  const isAdminCancelled = (booking: Booking) =>
    booking.cancellationReason?.toLowerCase().includes('event cancelled') ||
    booking.cancellationReason?.toLowerCase().includes('cancelled by host');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your event bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {['all', 'confirmed', 'pending', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`relative px-6 py-3 font-medium capitalize whitespace-nowrap ${
                  filter === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
                {tab === 'cancelled' && pendingRefundsCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-orange-500">
                    {pendingRefundsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          </Card>
        )}
        {(filter === 'all' || filter === 'cancelled') && cancelledBookings.length > 0 && (
          <div className="mb-6">
            {filter === 'all' && (
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Cancelled Bookings
                {pendingRefundsCount > 0 && (
                  <span className="text-sm font-normal text-orange-600">
                    · {pendingRefundsCount} refund{pendingRefundsCount > 1 ? 's' : ''} pending
                  </span>
                )}
              </h2>
            )}
            <div className="space-y-4">
              {cancelledBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                  style={{ borderLeftColor: booking.isAdminCancelled ? '#ef4444' : '#9ca3af' }}
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {(booking.eventDetails as any)?.eventName}
                            </h3>
                            <p className="text-sm text-gray-500">Booking ID: {booking.bookingId}</p>
                            {/* Cancellation source badge */}
                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              booking.isAdminCancelled
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {booking.isAdminCancelled ? '⚠ Event cancelled by host' : 'Cancelled by you'}
                            </span>
                          </div>
                        </div>

                        {/* Cancellation reason */}
                        {booking.cancellationReason && (
                          <p className="text-sm text-gray-500 ml-8 mb-2 italic">
                            "{booking.cancellationReason}"
                          </p>
                        )}

                        <div className="space-y-1 text-sm text-gray-500 ml-8">
                          {(booking.eventDetails as any)?.eventDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{(booking.eventDetails as any).eventDate}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4" />
                            <span>{booking.ticketType} × {booking.quantity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: refund status */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                          CANCELLED
                        </span>
                        {booking.refundAmount && booking.refundAmount > 0 ? (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Refund Amount</p>
                              <p className="text-xl font-bold text-gray-900">₹{booking.refundAmount}</p>
                            </div>
                            {/* Refund status pill */}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.refundStatus === 'COMPLETED'  ? 'bg-green-100 text-green-700' :
                              booking.refundStatus === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                              booking.refundStatus === 'FAILED'     ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {booking.refundStatus === 'COMPLETED'  ? '✓ Refund Completed' :
                               booking.refundStatus === 'PROCESSING' ? '↻ Refund Processing' :
                               booking.refundStatus === 'FAILED'     ? '✕ Refund Failed' :
                               '⏳ Refund Pending'}
                            </span>
                            {booking.refundStatus !== 'COMPLETED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/bookings/${booking.id}/refund`);
                                }}
                                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Track Refund
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Free event — no refund</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>Booked on: {new Date(booking.createdAt).toLocaleDateString()}</span>
                      {booking.cancelledAt && (
                        <span>Cancelled: {new Date(booking.cancelledAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Bookings List */}
        {(filter !== 'cancelled') && (
          bookings.length === 0 && cancelledBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No bookings found</h2>
              <p className="text-gray-600 mb-6">
                You haven't booked any events yet. Start exploring events now!
              </p>
              <button
                onClick={() => router.push('/events/nearby')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Explore Events
              </button>
            </Card>
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {filter === 'all' && bookings.length > 0 && (
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Active Bookings
                </h2>
              )}
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {getStatusIcon(booking.bookingStatus)}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {booking.eventDetails.eventName}
                            </h3>
                            <p className="text-sm text-gray-600">Booking ID: {booking.bookingId}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.eventDetails.eventDate}</span>
                            {booking.eventDetails.eventTime && (
                              <>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{booking.eventDetails.eventTime}</span>
                              </>
                            )}
                          </div>
                          {booking.eventDetails.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.eventDetails.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4" />
                            <span>{booking.ticketType} × {booking.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.bookingStatus)}`}>
                          {booking.bookingStatus}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">₹{booking.totalAmount}</p>
                        </div>
                        {booking.bookingStatus === 'CONFIRMED' && booking.qrCode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}`); }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            <QrCode className="w-4 h-4" />
                            View Ticket
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Booked on: {new Date(booking.createdAt).toLocaleDateString()}</span>
                        {booking.paymentMethod && (
                          <span className="capitalize">Payment: {booking.paymentMethod}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null
        )}
        
      </div>
    </div>
  );
}
