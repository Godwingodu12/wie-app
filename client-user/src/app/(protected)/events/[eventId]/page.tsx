'use client';
import { 
  createBooking, 
  toggleLike,
  toggleSave,
  shareEvent, 
  getEventStats,
  recordView,
  registerFreeEvent,
  verifyPayment,
  checkUserBooking
} from '@/services/transactionService';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { getEventById } from '@/services/ticketUserService';
import { Event, SubEvent, ParentEventSummary,FilteredEventsResponse } from '@/types/ticket';
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
import BackIcon from '@/assets/Event/BackIcon.svg';
import BookTicketIcon from '@/assets/Event/BookTicketIcon.svg';
import LikeIcon from '@/assets/Event/LikeIcon.svg';
import PublicIcon from '@/assets/Event/PublicIcon.svg';
import ShareIcon from '@/assets/Event/ShareIcon.svg';
import TicketIcon from '@/assets/Event/TicketIcon.svg';
import WishListIcon from '@/assets/Event/WishListIcon.svg';
import LocationIcon from '@/assets/Event/LocationIcon.svg';
import CalendarIcon from '@/assets/Event/CalenderIcon.svg';
import FreeOrPaidIcon from '@/assets/Event/FreeOrPaidIcon.svg';
import PetIcon from '@/assets/Event/PetIcon.svg';
import KidIcon from '@/assets/Event/KidIcon.svg';
import InstagramIcon from '@/assets/Event/InstagramIcon.svg';
import YoutubeIcon from '@/assets/Event/YoutubeIcon.svg';
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
export default function EventDetailPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullGuidelines, setShowFullGuidelines] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<any>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [userSaved, setUserSaved] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [userBooking, setUserBooking] = useState<any>(null);
  const isMainEvent = (event: Event | SubEvent): event is Event =>
    'sub_events' in event;
  const [activeSection, setActiveSection] = useState<
  'about' | 'details' | 'guests' | 'photos' | 'additional'
>('about');
const SECTIONS = [
  { key: 'about', label: 'About' },
  { key: 'details', label: 'Dates & Location' },
  { key: 'guests', label: `Guests${event?.guests?.length ? `(${event.guests.length})` : ''}`, },
  { key: 'photos', label: `Photos${event?.event_images?.length ? `(${event.event_images.length})` : ''}` },
  { key: 'additional', label: 'Additional Info' },
] as const;


  const normalizeStats = (stats: any) => ({
    like: stats?.like ?? stats?.likes ?? 0,
    share: stats?.share ?? stats?.shares ?? 0,
    totalBookings: stats?.totalBookings ?? stats?.total_bookings ?? 0,
    totalTicketsSold: stats?.totalTicketsSold ?? stats?.total_tickets_sold ?? 0,
    views: stats?.views ?? stats?.view ?? 0,
    saves: stats?.saves ?? stats?.save ?? 0,
    ...stats,
  });

  useEffect(() => {
    console.log('🔍 Event data:', event);
    if (event && isMainEvent(event)) {
      console.log('🔍 Sub events:', event.sub_events);
      console.log('🔍 Number of sub events:', event.sub_events?.length || 0);
    } else {
      console.log('🔍 This is a SubEvent (no sub_events)');
    }
  }, [event]);
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
          setEventStats(normalizeStats(response.data.stats));
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
      setEventStats(normalizeStats(statsData?.data?.stats || {}));
      // These come from the stats API — persist correctly across refresh
      setUserLiked(statsData?.data?.userInteractions?.liked   ?? false);
      setUserSaved(statsData?.data?.userInteractions?.saved   ?? false);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleLike = async () => {
    const newLikedState = !userLiked;
    setUserLiked(newLikedState);
    setEventStats((prev: any) => ({
      ...prev,
      like: Math.max(0, (prev?.like ?? 0) + (newLikedState ? 1 : -1)),
    }));
    try {
      const res = await toggleLike(eventId as string);
      // Sync with server response
      setUserLiked(res.liked);
      loadEventStats();
    } catch (error: any) {
      // Revert on failure
      setUserLiked(!newLikedState);
      setEventStats((prev: any) => ({
        ...prev,
        like: Math.max(0, (prev?.like ?? 0) + (newLikedState ? -1 : 1)),
      }));
      console.error('Failed to like event:', error);
    }
  };
  const handleSave = async () => {
    const newSavedState = !userSaved;
    setUserSaved(newSavedState);
    try {
      const res = await toggleSave(eventId as string);
      setUserSaved(res.saved);
      loadEventStats();
    } catch (error: any) {
      // Revert on failure
      setUserSaved(!newSavedState);
      console.error('Failed to save event:', error);
    }
  };
  const hasEventStarted = () => {
  if (!event?.event_dates?.length) return false;

  const now = new Date();
  const start = new Date(event.event_dates[0].start_date);

  return now >= start;
};


const isOnlineOrRecorded =
  event?.location_type === 'online' ||
  event?.location_type === 'recorded';


const actionLabel = isOnlineOrRecorded
  ? hasEventStarted()
    ? 'Watch Now'
    : 'Notify Me'
  : 'Book Tickets';


  const handleShare = async (method: string) => {
    try {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/events/${eventId}`
          : '';

      if (shareUrl) {
        const encodedUrl = encodeURIComponent(shareUrl);
        const message = encodeURIComponent(
          `Check out this event: ${event?.event_name || 'Event'}`
        );

        switch (method) {
          case 'native':
            if (navigator.share) {
              await navigator.share({
                title: event?.event_name || 'Event',
                text: message,
                url: shareUrl,
              });
            }
            break;
          case 'whatsapp':
            window.open(`https://wa.me/?text=${message}%20${encodedUrl}`, '_blank');
            break;
          case 'facebook':
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
              '_blank'
            );
            break;
          case 'twitter':
            window.open(
              `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${message}`,
              '_blank'
            );
            break;
          default:
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(shareUrl);
              alert('Link copied to clipboard');
            }
            break;
        }
      }

      await shareEvent(eventId as string, method);
      setShowShareOptions(false);
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

useEffect(() => {
  const fetchAllEvents = async () => {
    try {
      const res = await fetch('/api/events'); // 🔁 replace with your real endpoint
      const data = await res.json();
      setAllEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  fetchAllEvents();
}, []);

const handleBookEvent = () => {
  const isOnlineOrRecorded =
    event?.location_type === 'online' ||
    event?.location_type === 'recorded';

  if (isOnlineOrRecorded) {
    if (hasEventStarted()) {
      // WATCH FLOW
      router.push(`/events/${eventId}/watch`);
    } else {
      // NOTIFY FLOW
      alert('You will be notified when the event starts');
      // TODO: call notify-me API
    }
    return;
  }

  // ⬇️ OFFLINE EVENTS (existing logic)
  const hasSeatingLayout =
    (event?.seating_layout?.seats?.length ?? 0) > 0;

  if (hasSeatingLayout) {
    router.push(`/events/${eventId}/seating`);
    return;
  }

  if (event?.payment_type === 'free') {
    handleFreeRegistration();
  } else {
    if (!event?.ticket_types?.length) {
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
          
<h2 className="text-2xl font-bold text-white mb-2">
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
  const likeCount = eventStats?.like ?? eventStats?.likes ?? 0;
  const shareCount = eventStats?.share ?? eventStats?.shares ?? 0;
  const bookingCount = eventStats?.totalBookings ?? 0;
  if (loading) {
  return (
    <div className="min-h-screen bg-[#0c1014] flex items-center justify-center">

<Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }
  if (error || !event) {
    return (
          <div className="min-h-screen bg-[#0c1014] py-8">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center bg-[#0f1320]  border-white/10">
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
  const currentCategory =
  event?.event_category ||
  parentEvent?.event_category ||
  null;
const similarEvents = allEvents.filter((e) => {
  if (!currentCategory || !e.event_category) return false;

  return (
    e.event_category.toLowerCase().trim() ===
      currentCategory.toLowerCase().trim() &&
    e._id !== event?._id
  );
});

  return (
  <div className="min-h-screen bg-[#0c1014] flex pl-6">
    
    {/* Sidebar */}
    <SideBar />
    {event?.event_status === 'cancelled' && (
      <div
        className="mx-4 mt-4 p-4 rounded-2xl flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-red-400 font-semibold text-sm">This event has been cancelled</p>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              BY HOST
            </span>
          </div>
          {/* Show cancellation reason if available */}
          {(event as any)?.cancellation_reason && (
            <p className="text-white/70 text-xs mt-0.5 italic">
              Reason: "{(event as any).cancellation_reason}"
            </p>
          )}
          {hasBooked ? (
            <p className="text-white/60 text-xs mt-1">
              Your refund of <span className="text-green-400 font-semibold">₹{userBooking?.refundAmount ?? userBooking?.subtotal ?? ''}</span> has been initiated and will be credited within 5–7 business days.
            </p>
          ) : (
            <p className="text-white/60 text-xs mt-1">
              This event is no longer available for booking.
            </p>
          )}
        </div>
      </div>
    )}
    {/* Main Content */}
   <div
  className={`
    flex-1 transition-all duration-300
    overflow-x-hidden   /* 👈 HARD STOP */
    ${isCollapsed ? 'pl-20' : 'pl-64'}
  `}
>



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
    
<div className="w-full">
{/* Event Banner */}
{event.event_banner && (
  <div className="relative w-full h-[480px]">

    {/* Background image */}
    <img
      src={event.event_banner}
      alt={event.event_name}
      className="absolute inset-0 w-full h-full object-cover"
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-black/45" />

    {/* Content */}
    <div className="relative z-10 h-full flex flex-col justify-between px-8 py-6">

      {/* Top row */}
      <div className="flex items-center justify-between mt-12">
        <button
          onClick={() => router.push('/events/categories')}
          className="w-10 h-10 rounded-full bg-[#293845] flex items-center justify-center"
        >
          <img src={BackIcon.src} alt="Back" className="w-4 h-4" />
        </button>

        <div className="flex gap-3">
          {event?.event_status !== 'cancelled' && (
            <button
              onClick={handleLike}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
              style={{ background: userLiked ? 'rgba(239,68,68,0.25)' : '#293845' }}
            >
              <img
                src={LikeIcon.src}
                alt="Like"
                className="w-6 h-6 transition-all"
                style={{ filter: userLiked ? 'invert(30%) sepia(100%) saturate(700%) hue-rotate(320deg)' : 'none' }}
              />
            </button>
          )}
          <button
            onClick={() => setShowShareOptions(true)}
            className="w-10 h-10 rounded-full bg-[#293845] flex items-center justify-center hover:opacity-80"
          >
            <img src={ShareIcon.src} alt="Share" className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom content */}
      <div className="relative">

        {/* LEFT CONTENT (text column) */}
        <div className="max-w-4xl">
          {/* Meta */}
<div className="flex flex-wrap gap-3 mb-4">

  {/* Category */}
<div className="px-4 py-2 rounded-xl bg-[#1C2024B2] backdrop-blur-[20px]">
    <span className="text-white text-sm font-medium">
      {event.event_category}
    </span>
  </div>

  {/* Subcategory (optional, if you have it) */}
  {event.event_subcategory && (
<div className="px-4 py-2 rounded-xl bg-[#1C2024B2] backdrop-blur-[20px]">
      <span className="text-white text-sm font-medium">
        {event.event_subcategory}
      </span>
    </div>
  )}

  {/* Age */}
<div className="px-4 py-2 rounded-xl bg-[#1C2024B2] backdrop-blur-[20px]">
    <span className="text-white/90 text-sm">
      {event.min_age_allowed}
      {event.max_age_allowed ? `-${event.max_age_allowed}` : '+'}
    </span>
  </div>

  {/* Free / Paid */}
{event.payment_type && (
  <div className="px-4 py-2 rounded-xl bg-[#1C2024B2] backdrop-blur-[20px]">
    <span
      className="text-sm font-semibold"
      style={{
        color: event.payment_type === 'free' ? '#3EB489' : '#F8C91F',
      }}
    >
      {event.payment_type === 'free' ? 'Free' : 'Paid'}
    </span>
  </div>
)}


  {/* Online */}
  {event.location_type === 'online' && (
    <div className="px-4 py-2 rounded-xl bg-[#1C2024B2] backdrop-blur-[20px]">
      <span className="text-blue-400 text-sm font-medium">
        Online
      </span>
    </div>
  )}

</div>


          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {event.event_name}
          </h1>

          {/* Host info */}
          <div className="flex items-center gap-3 mt-3">
            {event.created_by && (
              <img
                src={event.created_by}
                alt={event.created_by}
                className="w-8 h-8 rounded-full object-cover border border-white/30"
              />
            )}
            <span className="text-white/90 text-sm">
             <span className="font-semibold">{event.created_by}</span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-3 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <img src={PublicIcon.src} className="w-6 h-6" />
              <span>{eventStats?.views || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={TicketIcon.src} className="w-6 h-6" />
              <span>{bookingCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={ShareIcon.src} className="w-6 h-6" />
              <span>{shareCount}</span>
            </div>
          </div>
        </div>

        {/* ✅ RIGHT-MOST BUTTONS (ABSOLUTE) */}
        <div className="absolute right-5 top-1/2 translate-y-[-5%] flex gap-4">
          {event?.event_status !== 'cancelled' && (
            <>
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-40 h-12 gap-2 px-3 py-2 rounded-3xl backdrop-blur transition-all"
                style={{
                  border: userSaved ? '1px solid rgba(234,179,8,0.6)' : '1px solid #c4b5fd',
                  background: userSaved ? 'rgba(234,179,8,0.12)' : 'transparent',
                  color: userSaved ? '#facc15' : 'white',
                }}
              >
                <img
                  src={WishListIcon.src}
                  className="w-6 h-6 block transition-all"
                  style={{ filter: userSaved ? 'invert(85%) sepia(60%) saturate(400%) hue-rotate(5deg)' : 'none' }}
                />
                {userSaved ? 'Saved' : 'Wishlist'}
              </button>
              <button
                onClick={handleBookEvent}
                className="flex items-center justify-center w-40 h-12 gap-2 px-3 py-2 rounded-3xl text-white bg-gradient-to-b from-indigo-300 via-violet-600 to-purple-400 hover:opacity-90"
              >
                {actionLabel !== 'Watch Now' && (
                  <img src={BookTicketIcon.src} className="w-6 h-6 block" alt="Book Ticket" />
                )}
                {actionLabel}
              </button>
            </>
          )}
          {/* Cancelled state — show refund CTA if user has booked */}
          {event?.event_status === 'cancelled' && hasBooked && (
            <button
              onClick={() => router.push(`/bookings/${userBooking?.id}/refund`)}
              className="flex items-center justify-center w-48 h-12 gap-2 px-3 py-2 rounded-3xl text-white font-semibold"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)' }}
            >
              Track Refund →
            </button>
          )}
        </div>

      </div>
    </div>
  </div>
)}
{/* Section Navigation */}
<div className="relative z-20 -mt-8 w-full">
<div className="grid grid-cols-2 md:grid-cols-6 gap-3 px-8 py-4 w-full">
    {SECTIONS.map((item) => {
      const isActive = activeSection === item.key;

      return (
        <button
          key={item.key}
          onClick={() => setActiveSection(item.key)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-white cursor-pointer"
          style={
            isActive
              ? {
                  background: `
                    linear-gradient(180deg, #373737 0%, #262626 50%, #1C1C1C 100%) padding-box,
                    linear-gradient(180deg, #666666 0%, #616060 50%, #393939 100%) border-box
                  `,
                  border: '0.6px solid transparent',
                  backgroundClip: 'padding-box, border-box',
                }
              : {
  background: `
  linear-gradient(
    rgba(56, 56, 56, 0.7),
    rgba(56, 56, 56, 0.7)
  ) padding-box,
  linear-gradient(
    270deg,
    rgba(32, 32, 32, 0.35),
    rgba(96, 96, 96, 0.35)
  ) border-box
`,

  border: '0.5px solid transparent',
  backgroundClip: 'padding-box, border-box',
}

          }
        >
          {item.label}
        </button>
      );
    })}
  </div>
</div>







        {/* Sub-Event Badge */}
        {(() => {
          const hasParentFromEvent = 'isSubEvent' in event && event.isSubEvent && event.parentEventName;
          const hasParentFromResponse = isSubEvent && parentEvent;
          if (!hasParentFromEvent && !hasParentFromResponse) {
            return null;
          }
          const parentName = hasParentFromEvent ? event.parentEventName : parentEvent?.event_name;
          return (
            <div key="sub-event-badge" className="mb-4"> {/* ✅ Added key */}
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                Sub Event of {parentName}
              </span>
            </div>
          );
        })()}
<div className="w-full bg-[#0c1014] text-white pb-24">
  {/* ================= MAIN CONTENT ================= */}
  <div className="space-y-6">

    {/* ================= ABOUT ================= */}
   {activeSection === 'about' && (
<Card className=" text-white">
<div className="p-6 pb-10 space-y-10">

      {/* META ROW */}
<div className="flex flex-wrap gap-6 text-sm text-white">

        {/* Date */}
        {event.event_dates?.[0] && (
          <div className="flex items-center gap-2">
            <img src={CalendarIcon.src} className="w-7 h-7" />
            <span>
              {new Date(event.event_dates[0].start_date).toLocaleDateString(
                'en-US',
                { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }
              )}
              {event.event_dates[0].start_time && ` · ${event.event_dates[0].start_time}`}
            </span>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2">
            <img src={LocationIcon.src} className="w-6- h-6" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Free / Paid */}
        <div className="flex items-center gap-2">
          <img src={FreeOrPaidIcon.src} className="w-6 h-6" />
          <span className="capitalize">
  {event.payment_type === 'free'
    ? 'Free'
    : event.ticket_types?.length
      ? `₹${Math.min(
          ...event.ticket_types.map(t => t.ticket_price)
        )}`
      : 'Paid'}
</span>

        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
  <h2 className="text-white text-lg font-semibold mb-2">
    Description
  </h2>

  <p
    className={`
      text-white/70 leading-relaxed
      ${!showFullDescription ? 'line-clamp-2' : ''}
    `}
  >
    {event.event_description || 'No description available.'}
  </p>

  {event.event_description &&
    event.event_description.length > 120 && (
      <button
        onClick={() => setShowFullDescription(!showFullDescription)}
        className="mt-1 text-blue-400 text-sm font-medium hover:underline"
      >
        {showFullDescription ? 'Less' : 'More'}
      </button>
    )}
</div>


{/* EVENT GUIDELINES */}
{event.event_rules?.type === 'text' && event.event_rules.content && (
  <div>
    <h2 className="text-white text-lg font-semibold mb-2">
      Event Guidelines
    </h2>

    <p
      className={`
        text-white/70 leading-relaxed
        ${!showFullGuidelines ? 'line-clamp-2' : ''}
      `}
    >
      {event.event_rules.content}
    </p>

    {event.event_rules.content.length > 120 && (
      <button
        onClick={() => setShowFullGuidelines(!showFullGuidelines)}
        className="mt-1 text-blue-400 text-sm font-medium hover:underline"
      >
        {showFullGuidelines ? 'Less' : 'More'}
      </button>
    )}
  </div>
)}




    </div>
  </Card>
)}



    {/* ================= DETAILS ================= */}
    {activeSection === 'details' && (
<div className="space-y-6 pl-8">

    {/* DATE PILLS */}
    <div className="flex flex-wrap gap-4 pt-8">
      {event.event_dates?.map((date, i) => (
        <div
          key={i}
          className="
            flex items-center gap-2
            px-4 py-3
            rounded-xl
            bg-[#15191d]
            text-white/90
            text-sm
          "
        >
                      <img src={CalendarIcon.src} className="w-5 h-5" />

          <span>
            {new Date(date.start_date).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ))}
    </div>

    {/* MAP CARD */}
    {event.location && (
      <div
  className="
    w-[60%]
    h-[260px]
    rounded-2xl
    overflow-hidden
    bg-[#15191d]
  "
>

        <iframe
          title="Event Location"
          width="100%"
          height="100%"
          loading="lazy"
          className="border-0"
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            event.location
          )}&output=embed`}
        />
      </div>
    )}

  </div>
)}

    {/* ================= GUESTS ================= */}
{activeSection === 'guests' && event.guests?.length > 0 && (
  <Card className="text-white">
    <div className="p-5">
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl">
        {event.guests.map((guest) => (
          <div
            key={guest._id}
            className="flex items-center gap-3"
          >
            <img
              src={guest.guest_profile}
              alt={guest.guest_name}
              className="w-14 h-14 rounded-full object-cover border border-white/20"
            />
            <p className="font-semibold text-lg text-white">
              {guest.guest_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  </Card>
)}


{/* ================= PHOTOS ================= */}
{activeSection === 'photos' && event.event_images?.length > 0 && (
  <Card className="text-white">
    <div className="p-6 overflow-hidden">
      <div
        className="
          flex gap-3
          max-w-full
          min-w-0
          overflow-x-auto
          overscroll-x-contain
          scrollbar-hide
        "
      >
        {event.event_images.map((img) => (
          <button
            key={img._id}
            onClick={() => setActivePhoto(img.path)}
            className="
              w-40 h-40
              rounded-lg
              overflow-hidden
              bg-[#15191d]
              hover:opacity-80
              transition
              flex-shrink-0
            "
          >
            <img
              src={img.path}
              alt={img.originalName}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  </Card>
)}


{/* ================= ADDITIONAL ================= */}
{activeSection === 'additional' && (
  <div className="space-y-6">

    {/* ---------- HASHTAGS ---------- */}
    {event.hashtag?.length > 0 && (
      <Card className="text-white">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3">Hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {event.hashtag.map((tag, i) => (
              <span
                key={i}
                className="text-blue-400 text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Card>
    )}

    {/* ---------- POINT OF CONTACT ---------- */}
    {event.POCS?.length > 0 && (
      <Card className="text-white">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Point of Contact</h2>

          <div className="flex flex-wrap gap-6">
            {event.POCS.map((poc) => (
              <div
                key={poc._id}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {poc.POC_name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-medium">{poc.POC_name}</p>
                  <p className="text-sm text-white/70">{poc.POC_email}</p>
                  <p className="text-sm text-white/70">{poc.POC_contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )}

    {/* ---------- PROHIBITED ITEMS ---------- */}
    {event.prohibited_items?.length > 0 && (
      <Card className="text-white">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3">Prohibited Items</h2>

          <div className="flex flex-wrap gap-3">
            {event.prohibited_items.map((item, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-lg bg-red-900/40 text-red-200 text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </Card>
    )}

    {/* ---------- MORE INFORMATION ---------- */}
    {(
  event.kids_friendly ||
  event.pet_friendly ||
  event.event_instagram_link ||
  event.event_youtube_link
) && (
  <Card className="text-white">
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">More Information</h2>

      <div className="flex flex-wrap gap-4">

        {/* Kids Friendly */}
        {event.kids_friendly && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)',
              }}
            >
              <img src={KidIcon.src} alt="Kids Friendly" className="w-5 h-5" />
            </div>
            <span className="text-sm text-white/80">Kids friendly event</span>
          </div>
        )}

        {/* Pets Friendly */}
        {event.pet_friendly && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)',
              }}
            >
              <img src={PetIcon.src} alt="Pets Friendly" className="w-5 h-5" />
            </div>
            <span className="text-sm text-white/80">Pets friendly event</span>
          </div>
        )}

        {/* Instagram */}
        {event.event_instagram_link && (
  <a
    href={event.event_instagram_link}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 max-w-full"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{
        background:
          'linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)',
      }}
    >
      <img src={InstagramIcon.src} alt="Instagram" className="w-5 h-5" />
    </div>

    <span className="text-sm text-blue-400 hover:underline truncate">
      {event.event_instagram_link}
    </span>
  </a>
)}

        {/* YouTube */}
        {event.event_youtube_link && (
  <a
    href={event.event_youtube_link}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 max-w-full"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{
        background:
          'linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)',
      }}
    >
      <img src={YoutubeIcon.src} alt="YouTube" className="w-5 h-5" />
    </div>

    <span className="text-sm text-red-400 hover:underline truncate">
      {event.event_youtube_link}
    </span>
  </a>
)}


      </div>
    </div>
  </Card>
)}



  </div>
)}


  </div>

 
</div>
{/* ================= SIMILAR EVENTS ================= */}
<div className="mt-10 ml-6">
  <h2 className="text-lg font-semibold text-white mb-4 px-6">
    Similar Events
  </h2>

  {similarEvents.length > 0 ? (
    <div className="px-6 overflow-hidden">
      <div
        className="
          flex gap-4
          overflow-x-auto
          overscroll-x-contain
          scrollbar-hide
        "
      >
        {similarEvents.map((ev) => (
          <div
            key={ev._id}
            className="
              w-48
              rounded-xl
              bg-[#15191d]
              overflow-hidden
              flex-shrink-0
              hover:scale-[1.02]
              transition
              cursor-pointer
            "
            onClick={() => router.push(`/events/${ev._id}`)}
          >
            <div className="w-full h-40">
              <img
                src={ev.event_banner}
                alt={ev.event_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-3 space-y-1">
              <p className="text-sm font-semibold text-white line-clamp-2">
                {ev.event_name}
              </p>

              <p className="text-xs text-white/60">
                {new Date(ev.event_dates?.[0]?.start_date).toLocaleDateString()}
              </p>

              <p className="text-xs text-white/50 truncate">
                {ev.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <p className="px-6 text-white/40">
      No similar events found
    </p>
  )}
</div>


         <BookingModal />
         <SuccessModal />
         {activePhoto && (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    onClick={() => setActivePhoto(null)}
  >
    <img
      src={activePhoto}
      className="max-w-full max-h-full rounded-xl"
    />
  </div>
)}

      </div>
    </div>
    </div>
  );
}
