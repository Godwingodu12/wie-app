'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getBookingById, cancelBooking, Booking } from '@/services/transactionService';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Clock,
  User,
  Mail,
  Phone,
  Download,
  XCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function BookingDetailPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookingById(bookingId);
      setBooking(response.data.booking);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setIsCancelling(true);
    try {
      await cancelBooking(bookingId, cancellationReason);
      alert('Booking cancelled successfully');
      setShowCancelModal(false);
      loadBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const downloadQRCode = () => {
    if (!booking?.qrCode) return;

    const link = document.createElement('a');
    link.href = booking.qrCode;
    link.download = `ticket-${booking.bookingId}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The booking you are looking for does not exist.'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Bookings
        </button>

        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{booking.eventDetails.eventName}</h1>
              <p className="text-gray-600 mt-2">Booking ID: {booking.bookingId}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                booking.bookingStatus === 'CONFIRMED'
                  ? 'bg-green-100 text-green-800'
                  : booking.bookingStatus === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {booking.bookingStatus}
            </span>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">Date & Time</p>
                      <p className="text-gray-600">
                        {booking.eventDetails.eventDate} {booking.eventDetails.eventTime}
                      </p>
                    </div>
                  </div>

                  {booking.eventDetails.venue && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">Venue</p>
                        <p className="text-gray-600">{booking.eventDetails.venue}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">Ticket Type</p>
                      <p className="text-gray-600">
                        {booking.ticketType} × {booking.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{booking.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold">₹{booking.tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-semibold">₹{booking.platformFee}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">₹{booking.totalAmount}</span>
                  </div>
                  {booking.paymentMethod && (
                    <p className="text-sm text-gray-600 mt-2 capitalize">
                      Payment Method: {booking.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {booking.bookingStatus === 'CONFIRMED' && booking.qrCode && (
              <Card>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Ticket</h3>
                  <img
                    src={booking.qrCode}
                    alt="QR Code"
                    className="w-full max-w-[250px] mx-auto mb-4 border-2 border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={downloadQRCode}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Ticket
                  </button>
                  {booking.isVerified && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Actions */}
            {booking.bookingStatus === 'CONFIRMED' && (
              <Card>
                <div className="p-6">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Booking
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Booking</h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    disabled={isCancelling}
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}