'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { getEventById } from '@/services/ticketUserService';
import { createSeatedBooking, getBookedSeats, verifyPayment } from '@/services/transactionService';
import { Event, SeatInfo, SeatingLayout } from '@/types/ticket';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  ShoppingCart,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SeatedBookingPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadEventAndSeats();
  }, [eventId]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const loadEventAndSeats = async () => {
    try {
      setLoading(true);
      const [eventResponse, seatsResponse] = await Promise.all([
        getEventById(eventId),
        getBookedSeats(eventId),
      ]);
      
      // ✅ No need to enrich - prices already come from API
      setEvent(eventResponse.data.event as Event);
      setBookedSeats(seatsResponse.data.bookedSeats);
    } catch (err: any) {
      setError(err.message || 'Failed to load seating information');
    } finally {
      setLoading(false);
    }
  };
  const handleSeatClick = (seatId: string, isAvailable: boolean) => {
    if (!isAvailable || bookedSeats.includes(seatId)) return;

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };
  const calculateTotal = () => {
    if (!event?.seating_layout) return { subtotal: 0, platformFee: 0, total: 0, isFree: true, seatPrices: [] };

    const seatingLayout = event.seating_layout;
    const isFreeEvent = event.payment_type === 'free';

    let subtotal = 0;
    const seatPrices: Array<{ seatId: string; ticketType: string; price: number }> = [];

    selectedSeats.forEach(seatId => {
      const seat = seatingLayout.seats.find((s: SeatInfo) => s.seatId === seatId);
      if (seat && seat.price !== undefined) {
        subtotal += seat.price;
        seatPrices.push({
          seatId: seat.seatId,
          ticketType: seat.ticketTypeName || 'Unknown',
          price: seat.price
        });
      }
    });

    const platformFee = isFreeEvent ? 0 : selectedSeats.length * 1;
    const total = subtotal + platformFee;

    return { subtotal, platformFee, total, isFree: isFreeEvent, seatPrices };
  };
  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    setShowPaymentModal(true);
  };

  const initiatePayment = async () => {
    setIsBooking(true);
    try {
      const bookingResponse = await createSeatedBooking({
        ticketId: eventId,
        selectedSeats,
      });

      const { booking, razorpayOrder, razorpayKeyId } = bookingResponse.data;

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: event?.event_name || 'Event Booking',
        description: `Seated booking for ${event?.event_name}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            const verifyData = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyData.success) {
              alert('Booking confirmed successfully!');
              router.push(`/bookings/${verifyData.data.booking.id}`);
            }
          } catch (error: any) {
            alert(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#5E5CE6',
        },
        modal: {
          ondismiss: function () {
            setIsBooking(false);
            setShowPaymentModal(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create booking');
      setIsBooking(false);
    }
  };
  const renderSeatingChart = () => {
    if (!event?.seating_layout) return null;

    const seatingLayout = event.seating_layout;
    const { rows, seats } = seatingLayout;

    const seatsByRow = seats.reduce((acc: any, seat: SeatInfo) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    return (
      <div
        className="flex flex-col items-center gap-2 p-4"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {/* Stage */}
        <div className="w-full max-w-4xl py-3 rounded-t-lg text-center font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white mb-4">
          STAGE
        </div>

        {/* Seats */}
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 w-8 text-center">
              {row}
            </span>
            {seatsByRow[row]?.sort((a: SeatInfo, b: SeatInfo) => a.column - b.column).map((seat: SeatInfo) => {
              const isBooked = bookedSeats.includes(seat.seatId);
              const isSelected = selectedSeats.includes(seat.seatId);
              const isAvailable = seat.isAvailable && !isBooked;
              
              // ✅ Get price directly from seat
              const seatPrice = seat.price || 0;

              return (
                <button
                  key={seat.seatId}
                  onClick={() => handleSeatClick(seat.seatId, isAvailable)}
                  disabled={!isAvailable}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all hover:scale-110 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isSelected
                      ? '#10B981'
                      : isBooked
                      ? '#9CA3AF'
                      : seat.ticketTypeColor || '#6B7280',
                    color: 'white',
                    opacity: isAvailable ? 1 : 0.5,
                    border: isSelected ? '3px solid #059669' : 'none',
                  }}
                  title={`${seat.seatId} - ${seat.ticketTypeName} - ₹${seatPrice} - ${isBooked ? 'Booked' : isAvailable ? 'Available' : 'Unavailable'}`}
                >
                  {isSelected ? <Check className="w-4 h-4" /> : seat.column}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
const { subtotal, platformFee, total, isFree, seatPrices } = calculateTotal();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !event || !event.seating_layout) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seating Not Available</h2>
            <p className="text-gray-600 mb-6">{error || 'This event does not have a seating layout.'}</p>
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
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Event
        </button>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Seating Chart */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Select Your Seats</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoom(1)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto max-h-[600px]">
                  {renderSeatingChart()}
                </div>
                {/* Legend */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {event.seating_layout?.ticketTypeAssignments?.map((assignment: any) => {
                      // ✅ Use price directly from assignment
                      const price = assignment.price || 0;
                      
                      return (
                        <div key={assignment.ticketTypeId} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: assignment.color }}
                          />
                          <div className="text-sm">
                            <p className="font-medium">{assignment.ticketTypeName}</p>
                            <p className="text-gray-600">
                              {isFree ? 'FREE' : `₹${price}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-500" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-400" />
                      <span className="text-sm font-medium">Booked</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Event</p>
                    <p className="font-semibold text-gray-900">{event.event_name}</p>
                    {isFree && (
                      <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        FREE EVENT
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Selected Seats ({selectedSeats.length})</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                    </p>
                  </div>
                  {/* ✅ Show selected seat details with prices */}
                  {selectedSeats.length > 0 && seatPrices && seatPrices.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Seat Breakdown:</p>
                      {seatPrices.map((seatPrice) => (
                        <div key={seatPrice.seatId} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {seatPrice.seatId} <span className="text-gray-500">({seatPrice.ticketType})</span>
                          </span>
                          <span className="font-medium text-gray-900">
                            {isFree ? 'FREE' : `₹${seatPrice.price}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{isFree ? 'FREE' : `₹${subtotal}`}</span>
                    </div>
                    {!isFree && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-medium">₹{platformFee}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {isFree ? 'FREE' : `₹${total}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isFree ? 'Register Now' : 'Proceed to Payment'}
                </button>
              </div>
            </Card>
          </div>
        </div>
        {/* Payment Confirmation Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isFree ? 'Confirm Registration' : 'Confirm Payment'}
                </h2>
                
                <div className="mb-6 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Selected Seats ({selectedSeats.length})
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {seatPrices.map((seatPrice) => (
                        <div key={seatPrice.seatId} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {seatPrice.seatId} <span className="text-gray-500 text-xs">({seatPrice.ticketType})</span>
                          </span>
                          <span className="font-medium text-gray-900">
                            {isFree ? 'FREE' : `₹${seatPrice.price}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{isFree ? 'FREE' : `₹${subtotal}`}</span>
                    </div>
                    {!isFree && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Fee ({selectedSeats.length}x ₹1)</span>
                        <span className="font-semibold">₹{platformFee}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t flex justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-blue-600">
                        {isFree ? 'FREE' : `₹${total}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    disabled={isBooking}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiatePayment}
                    disabled={isBooking}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isBooking ? 'Processing...' : isFree ? 'Register' : `Pay ₹${total}`}
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