'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getUserBookings, Booking } from '@/services/transactionService';
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
} from 'lucide-react';

export default function BookingsPage() {
  useAuth(true);
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { limit: 50 };
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }

      const response = await getUserBookings(params);
      setBookings(response.data.bookings);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

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
                className={`px-6 py-3 font-medium capitalize whitespace-nowrap ${
                  filter === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
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

        {/* Bookings List */}
        {bookings.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/bookings/${booking.id}`)}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        {getStatusIcon(booking.bookingStatus)}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.eventDetails.eventName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Booking ID: {booking.bookingId}
                          </p>
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
                          <span>
                            {booking.ticketType} × {booking.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col items-end gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          booking.bookingStatus
                        )}`}
                      >
                        {booking.bookingStatus}
                      </span>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{booking.totalAmount}
                        </p>
                      </div>

                      {booking.bookingStatus === 'CONFIRMED' && booking.qrCode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/bookings/${booking.id}`);
                          }}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          <QrCode className="w-4 h-4" />
                          View Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
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
        )}
      </div>
    </div>
  );
}
