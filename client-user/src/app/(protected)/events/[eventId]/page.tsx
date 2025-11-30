'use client';
import { 
  createBooking, 
  toggleLike, 
  shareEvent, 
  getEventStats,
  recordView ,
  registerFreeEvent,
  verifyPayment,
  checkUserBooking
} from '@/services/transactionService';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getEventById } from '@/services/ticketUserService';
import { Event, SubEvent, ParentEventSummary } from '@/types/ticket';
import { Alert } from "@/components/events/Alert";
import { 
  MapPin, Calendar, Users, Clock, DollarSign, 
  Loader2, AlertCircle, ArrowLeft, ExternalLink,
  User, Phone, Mail, Tag, Info, ShoppingCart
} from 'lucide-react';
declare global {
  interface Window {
    Razorpay: any;
  }
}
export default function EventDetailPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | SubEvent | null>(null);
  const [isSubEvent, setIsSubEvent] = useState(false);
  const [parentEvent, setParentEvent] = useState<ParentEventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [eventStats, setEventStats] = useState<any>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [userBooking, setUserBooking] = useState<any>(null);
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  useEffect(() => {
    const fetchEventStats = async () => {
      try {
        const response = await getEventStats(eventId);
        if (response.success) {
          setEventStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching event stats:', error);
      }
    };

    if (eventId) {
      fetchEventStats();
    }
  }, [eventId]);

  // Record view and load stats
  useEffect(() => {
    if (eventId && !loading) {
      recordView(eventId as string).catch(console.error);
      loadEventStats();
    }
  }, [eventId, loading]);
  useEffect(() => {
  const checkBookingStatus = async () => {
    if (eventId && event?.payment_type === 'free') {
      try {
        const result = await checkUserBooking(eventId);
        setHasBooked(result.hasBooked);
        setUserBooking(result.booking);
      } catch (error) {
        console.error('Error checking booking status:', error);
      }
    }
  };

  if (event) {
    checkBookingStatus();
  }
}, [eventId, event]);
  const loadEventStats = async () => {
    try {
      const statsData = await getEventStats(eventId as string);

      setEventStats(statsData?.data?.stats || null);
      setUserLiked(statsData?.data?.userInteractions?.liked ?? false);

    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };
  const handleLike = async () => {
    try {
      await toggleLike(eventId as string);
      setUserLiked(!userLiked);
      loadEventStats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to like event');
    }
  };

  const handleShare = async (method: string) => {
    try {
      await shareEvent(eventId as string, method);
      alert('Event shared successfully!');
      loadEventStats();
    } catch (error: any) {
      console.error('Failed to share:', error);
    }
  };


  const initiateBooking = async () => {
    if (!selectedTicketType) {
      alert('Please select a ticket type');
      return;
    }

    setIsBooking(true);

    try {
      // Create booking
      const bookingResponse = await createBooking({
        ticketId: eventId as string,
        ticketTypeId: selectedTicketType,
        quantity,
      });

      const { booking, razorpayOrder, razorpayKeyId } = bookingResponse.data;

      // Initialize Razorpay payment
      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: event?.event_name || 'Event Booking',
        description: `Booking for ${event?.event_name}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
  try {
    // ✅ Verify payment using transaction service directly
    const verifyData = await verifyPayment({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    });

    if (verifyData.success) {
      setShowSuccessModal(true);
      setShowBookingModal(false);
      
      // Refresh booking status for free events
      if (event?.payment_type === 'free') {
        setHasBooked(true);
        setUserBooking(verifyData.data.booking);
      }
      loadEventStats();
      
      // Optional: Navigate to booking details after a delay
      setTimeout(() => {
        router.push(`/bookings/${verifyData.data.booking.id}`);
      }, 2000);
    } else {
      setAlertMessage('Payment verification failed. Please contact support.');
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    const errorMsg = error.response?.data?.message || 'Payment verification failed';
    setAlertMessage(errorMsg);
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
            setShowBookingModal(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
      setIsBooking(false);
    }
  };
  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEventById(eventId);
      setEvent(response.data.event);
      setIsSubEvent(response.data.isSubEvent);
      setParentEvent(response.data.parentEvent);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleBookEvent = () => {
      if (event?.payment_type === 'free') {
        handleFreeRegistration();
      } else {
        if (!event?.ticket_types || event.ticket_types.length === 0) {
          alert('No tickets available for this event');
          return;
        }
        setShowBookingModal(true);
      }
  };
  const handleFreeRegistration = async () => {
    setIsBooking(true);
    try {
      const data = await registerFreeEvent(eventId as string, 1);

      if (data.success) {
        setShowSuccessModal(true);
        setHasBooked(true); // ✅ Update status
        setUserBooking(data.data.booking); // ✅ Store booking
        loadEventStats();
      } else {
        setAlertMessage(data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Free registration error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to register for event';
      setAlertMessage(errorMsg);
    } finally {
      setIsBooking(false);
    }
  };
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    const isPaidEvent = event?.payment_type === 'paid';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isPaidEvent ? 'Booking Confirmed! 🎉' : 'Registration Successful! 🎉'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isPaidEvent 
              ? `Your booking for ${event?.event_name} is confirmed. Payment received successfully.`
              : `You've successfully registered for ${event?.event_name}. Check your bookings to view your ticket.`
            }
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/events/nearby');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Browse Events
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/bookings');
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Bookings
            </button>
          </div>
        </div>
      </div>
    );
  };
const BookingModal = () => {
  if (!showBookingModal) return null;

  // ✅ Calculate pricing with platform fee
  const selectedTicket = event?.ticket_types?.find(t => t._id === selectedTicketType);
  const subtotal = selectedTicket ? selectedTicket.ticket_price * quantity : 0;
  const platformFee = quantity * 1; // ₹1 per ticket
  const total = subtotal + platformFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Tickets</h2>
        
        {/* Ticket Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Ticket Type
          </label>
          <select
            value={selectedTicketType || ''}
            onChange={(e) => setSelectedTicketType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a ticket type</option>
            {event?.ticket_types?.map((ticket) => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.ticket_type} - ₹{ticket.ticket_price}
                {ticket.max_capacity && ` (${ticket.max_capacity} available)`}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity (Max 50 per event)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(Math.min(50, Math.max(1, val)));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum 50 tickets per event</p>
        </div>

        {/* ✅ Price Breakdown */}
        {selectedTicketType && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ticket Price ({quantity}x ₹{selectedTicket?.ticket_price})</span>
              <span className="font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee ({quantity}x ₹1)</span>
              <span className="font-medium">₹{platformFee}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Amount</span>
              <span className="text-blue-600">₹{total}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowBookingModal(false);
              setSelectedTicketType(null);
              setQuantity(1);
            }}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            disabled={isBooking}
          >
            Cancel
          </button>
          <button
            onClick={initiateBooking}
            disabled={isBooking || !selectedTicketType}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isBooking ? 'Processing...' : `Pay ₹${total}`}
          </button>
        </div>
      </div>
    </div>
  );
};
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
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
      {alertMessage && (
      <Alert
        alert={{
          message: alertMessage,
          type: "error",
          show: true,
        }}
        onClose={() => setAlertMessage(null)}
        darkMode={false}
      />
    )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
        onClick={() => router.push('/events/nearby')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
        <ArrowLeft className="w-5 h-5" />
        Back to Events
        </button>
        {/* Event Banner */}
        {event.event_banner && (
          <div className="relative h-96 w-full rounded-xl overflow-hidden mb-8">
            <img
              src={event.event_banner}
              alt={event.event_name}
              className="w-full h-full object-cover"
            />
            {event.event_logo && (
              <img
                src={event.event_logo}
                alt="Event logo"
                className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            )}
          </div>
        )}
        {/* Sub-Event Badge */}
        {(() => {
          const hasParentFromEvent = 'isSubEvent' in event && event.isSubEvent && event.parentEventName;
          const hasParentFromResponse = isSubEvent && parentEvent;
          if (!hasParentFromEvent && !hasParentFromResponse) {
            return null;
          }
          const parentName = hasParentFromEvent ? event.parentEventName : parentEvent?.event_name;
          return (
            <div className="mb-4">
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                Sub Event of {parentName}
              </span>
            </div>
          );
        })()}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card>
              <div className="p-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {event.event_name}
                </h1>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {event.event_category}
                  </span>
                  {event.event_subcategory && (
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {event.event_subcategory}
                    </span>
                  )}
                  {event.location_type === 'online' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      🌐 Online Event
                    </span>
                  )}
                  {event.location_type === 'recorded' && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      📹 Recorded Event
                    </span>
                  )}
                  {event.kids_friendly && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      👶 Kids Friendly
                    </span>
                  )}
                  {event.pet_friendly && (
                    <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                      🐾 Pet Friendly
                    </span>
                  )}
                  {event.payment_type === 'free' && (
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                      🎉 FREE
                    </span>
                  )}
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">
                  {event.event_description}
                </p>
              </div>
            </Card>

            {/* Event Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
                
                <div className="space-y-4">
                  {/* Date & Time */}
                  {event.event_dates && event.event_dates.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Date & Time</p>
                        {event.event_dates.map((date, index) => (
                          <div key={index} className="text-gray-600 mt-1">
                            <p className="font-medium">
                              {new Date(date.start_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            {date.start_time && (
                              <p className="text-sm">
                                {date.start_time}
                                {date.end_time && ` - ${date.end_time}`}
                              </p>
                            )}
                            {date.end_date && date.end_date !== date.start_date && (
                              <p className="text-sm text-gray-500">
                                Until: {new Date(date.end_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        ))}
                        {event.gate_open_time && (
                          <p className="text-sm text-gray-500 mt-2">
                            Gates open: {event.gate_open_time}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Location</p>
                        <p className="text-gray-600">{event.location}</p>
                        {event.venue && (
                          <p className="text-gray-500 text-sm">Venue: {event.venue}</p>
                        )}
                        {event.exact_map_location?.address && (
                          <p className="text-gray-500 text-sm mt-1">
                            {event.exact_map_location.address}
                          </p>
                        )}
                        {event.seating_arrangement && (
                          <p className="text-gray-500 text-sm mt-1">
                            Seating: {event.seating_arrangement}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Age Restriction */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Age Restriction</p>
                      <p className="text-gray-600">
                        {event.min_age_allowed}
                        {event.max_age_allowed ? ` - ${event.max_age_allowed}` : '+'} years
                      </p>
                    </div>
                  </div>

                  {/* Language */}
                  {event.event_language && event.event_language.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Languages</p>
                        <p className="text-gray-600">{event.event_language.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {/* Total Capacity */}
                  {event.total_capacity && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Total Capacity</p>
                        <p className="text-gray-600">{event.total_capacity} attendees</p>
                      </div>
                    </div>
                  )}

                  {/* Booking Dates */}
                  {event.booking_start_date && event.booking_end_date && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Booking Period</p>
                        <p className="text-gray-600 text-sm">
                          {new Date(event.booking_start_date).toLocaleDateString()} - {new Date(event.booking_end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Prohibited Items */}
            {event.prohibited_items && event.prohibited_items.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Prohibited Items</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {event.prohibited_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* Guests */}
            {event.guests && event.guests.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Guests</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {event.guests.map((guest) => (
                      <div key={guest._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        {guest.guest_profile && (
                          <img
                            src={guest.guest_profile}
                            alt={guest.guest_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{guest.guest_name}</p>
                          {guest.guest_link && (
                            <a
                                href={guest.guest_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                            >
                                View Profile <ExternalLink className="w-3 h-3" />
                            </a>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            {/* Sub-Events (for main events) */}
            {!isSubEvent && 'sub_events' in event && event.sub_events && event.sub_events.length > 0 && (
            <Card>
                <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Related Sub Events ({event.sub_events.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {event.sub_events.map((subEvent) => (
                    <div
                        key={subEvent._id}
                        onClick={() => router.push(`/events/${subEvent._id}`)}
                        className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer"
                    >
                        {/* Sub-Event Image */}
                        {subEvent.event_banner ? (
                        <div className="relative h-40 w-full overflow-hidden">
                            <img
                            src={subEvent.event_banner}
                            alt={subEvent.event_name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {subEvent.event_logo && (
                            <img
                                src={subEvent.event_logo}
                                alt="logo"
                                className="absolute bottom-2 right-2 w-12 h-12 rounded-full border-2 border-white shadow-md"
                            />
                            )}
                        </div>
                        ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-gray-400" />
                        </div>
                        )}

                        {/* Sub-Event Content */}
                        <div className="p-4">
                        {/* Badge */}
                        <div className="mb-2">
                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Sub Event
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {subEvent.event_name}
                        </h3>

                        {/* Category */}
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                            📂 {subEvent.event_category}
                        </p>

                        {/* Location */}
                        {subEvent.location && (
                            <div className="flex items-start gap-1 mb-2">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 line-clamp-1">
                                {subEvent.location}
                            </p>
                            </div>
                        )}

                        {/* Date */}
                        {subEvent.event_dates?.[0] && (
                            <div className="flex items-center gap-1 mb-3">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
                                {new Date(subEvent.event_dates[0].start_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                })}
                            </p>
                            </div>
                        )}

                        {/* Price Badge */}
                        {subEvent.payment_type === 'free' && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                            FREE
                            </span>
                        )}
                        {subEvent.payment_type === 'paid' && subEvent.ticket_types?.[0] && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                            ₹{subEvent.ticket_types[0].ticket_price}
                            </span>
                        )}

                        {/* View Arrow */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-600 text-white rounded-full p-2">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </Card>
            )}
            {/* Parent Event Display - handles both API response types */}
            {(() => {
              const hasParentFromEvent = 'isSubEvent' in event && event.isSubEvent && event.parentEventId;
              const hasParentFromResponse = isSubEvent && parentEvent;
              if (!hasParentFromEvent && !hasParentFromResponse) {
                return null;
              }
              // Use parent data from event if available, otherwise use parentEvent
              const parentData = hasParentFromEvent ? {
                _id: event.parentEventId!,
                event_name: event.parentEventName!,
                event_category: event.parentEventCategory,
                event_banner: event.parentEventBanner,
                event_logo: event.parentEventLogo,
              } : parentEvent;

              // Add null check - this should never happen due to the guard above, but TypeScript needs it
              if (!parentData) {
                return null;
              }

              return (
                <Card>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      🎯 Main Event
                    </h2>
                    <div
                      onClick={() => router.push(`/events/${parentData._id}`)}
                      className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer"
                    >
                      {/* Main Event Image */}
                      {parentData.event_banner ? (
                        <div className="relative h-56 w-full overflow-hidden">
                          <img
                            src={parentData.event_banner}
                            alt={parentData.event_name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {parentData.event_logo && (
                            <img
                              src={parentData.event_logo}
                              alt="logo"
                              className="absolute bottom-3 right-3 w-16 h-16 rounded-full border-4 border-white shadow-lg"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-56 w-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                          <Calendar className="w-20 h-20 text-white" />
                        </div>
                      )}

                      {/* Main Event Content */}
                      <div className="p-5">
                        {/* Badge */}
                        <div className="mb-3">
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            MAIN EVENT
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {parentData.event_name}
                        </h3>

                        {/* Category */}
                        {parentData.event_category && (
                          <p className="text-sm text-gray-700 mb-3 font-medium flex items-center gap-2">
                            <span className="bg-white px-2 py-1 rounded">📂 {parentData.event_category}</span>
                          </p>
                        )}

                        {/* Location - only available in traditional parentEvent */}
                        {'location' in parentData && parentData.location && (
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                              {parentData.location}
                            </p>
                          </div>
                        )}

                        {/* Date - only available in traditional parentEvent */}
                        {'event_dates' in parentData && parentData.event_dates?.[0] && (
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <p className="text-sm text-gray-600">
                              {new Date(parentData.event_dates[0].start_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        )}

                        {/* CTA */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-blue-600 font-semibold group-hover:text-blue-700">
                            View Main Event Details
                          </span>
                          <div className="bg-blue-600 text-white rounded-full p-2 group-hover:bg-blue-700 transition-colors">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
            {/* Event Images Gallery */}
            {event.event_images && event.event_images.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.event_images.map((image) => (
                      <img
                        key={image._id}
                        src={image.path}
                        alt={image.originalName}
                        className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            {event.ticket_types && event.ticket_types.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Tickets</h3>
                  <div className="space-y-3">
                    {event.ticket_types.map((ticket) => (
                      <div key={ticket._id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">{ticket.ticket_type}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {event.payment_type === 'free' ? 'FREE' : `₹${ticket.ticket_price}`}
                          </p>
                        </div>
                        {ticket.max_capacity && (
                          <p className="text-sm text-gray-600">
                            Available: {ticket.max_capacity} seats
                          </p>
                        )}
                        {ticket.ticket_photo && (
                          <img
                            src={ticket.ticket_photo}
                            alt={ticket.ticket_type}
                            className="w-full h-24 object-cover rounded mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleBookEvent}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Book Event Now
                  </button>

                  {/* ADD THESE BUTTONS */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleLike}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                        userLiked
                          ? 'bg-red-50 border-red-500 text-red-600'
                          : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600'
                      }`}
                    >
                      ❤️ {userLiked ? 'Liked' : 'Like'} {eventStats?.like > 0 && `(${eventStats.like})`}
                    </button>
                    <button
                      onClick={() => handleShare('general')}
                      className="flex-1 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600"
                    >
                      🔗 Share {eventStats?.share > 0 && `(${eventStats.share})`}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Free Event Booking */}
            {event.payment_type === 'free' && (!event.ticket_types || event.ticket_types.length === 0) && (
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Free Event</h3>
                  <div className="p-4 bg-green-50 rounded-lg mb-4">
                    <p className="text-green-800 font-semibold text-center">🎉 This is a FREE event!</p>
                  </div>
                  <button 
                    onClick={handleBookEvent}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Register Now
                  </button>
                </div>
              </Card>
            )}

            {/* Contact */}
            {event.POCS && event.POCS.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
                  <div className="space-y-4">
                    {event.POCS.map((poc) => (
                      <div key={poc._id} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900 font-medium">{poc.POC_name}</p>
                        </div>
                        {poc.POC_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${poc.POC_email}`} className="text-blue-600 text-sm hover:underline break-all">
                              {poc.POC_email}
                            </a>
                          </div>
                        )}
                        {poc.POC_contact && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${poc.POC_contact}`} className="text-blue-600 text-sm hover:underline">
                              {poc.POC_contact}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Social Links */}
            {(event.event_instagram_link || event.event_youtube_link) && (
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
                  <div className="space-y-2">
                   {event.event_instagram_link && (
                    <a
                        href={event.event_instagram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-600 hover:underline"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Instagram
                    </a>
                    )}
                    {event.event_youtube_link && (
                    <a
                        href={event.event_youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-red-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Hashtags */}
            {event.hashtag && event.hashtag.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.hashtag.map((tag, index) => (
                      <span key={index} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Event Status */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Event Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      event.event_status === 'live' ? 'bg-green-100 text-green-800' :
                      event.event_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      event.event_status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.event_status.toUpperCase()}
                    </span>
                  </div>
                  {event.like !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Likes:</span>
                      <span className="font-semibold text-gray-900">❤️ {event.like}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
         <BookingModal />
         <SuccessModal />
      </div>
    </div>
  );
}
