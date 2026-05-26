'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getEventById } from '@/services/ticketUserService';
import { createSeatedBooking, getBookedSeats, verifyPayment } from '@/services/transactionService';
import { Event, SeatInfo, SeatingLayout } from '@/types/ticket';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Users,
  MessageCircle,
  Eye,
  Calendar,
  MapPin,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/components/home/ThemeContext';
import { BookingModal } from '@/components/events/BookingModal';
import { ConfirmSelectionModal } from '@/components/events/ConfirmSelectionModal';

import TicketIconSVG from "@/assets/Event/TicketIcon.svg";
import LocationIconSVG from "@/assets/Event/LocationIcon.svg";
import CalendarIconSVG from "@/assets/Event/CalenderIcon.svg";
import FreeOrPaidIconSVG from "@/assets/Event/FreeOrPaidIcon.svg";
import PublicIconSVG from "@/assets/Event/PublicIcon.svg";
import ShareIconSVG from "@/assets/Event/ShareIcon.svg";
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Seat SVG
const ChairSvg = ({ status }: { status: 'available' | 'booked' | 'selected' }) => {
  const isAvailable = status === 'available';
  const isBooked = status === 'booked';

  const outerColor = isBooked ? '#DC2626' : isAvailable ? '#E5E7EB' : '#6D28D9';
  const innerColor = isBooked ? '#EF4444' : isAvailable ? '#FFFFFF' : '#8B5CF6';
  const highlightColor = isBooked ? '#B91C1C' : isAvailable ? '#D1D5DB' : '#5B21B6';

  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill={outerColor} />
      <rect x="5" y="4" width="14" height="15" rx="2" fill={innerColor} />
      <rect x="7" y="5" width="10" height="3" rx="1.5" fill={highlightColor} />
    </svg>
  );
};

// Date component
const DateCard = ({ day, date, isActive }: { day: string; date: string; isActive: boolean }) => (
  <div className={`flex flex-col items-center justify-center min-w-[56px] h-[72px] rounded-xl cursor-pointer transition-colors border border-[#2A2A30] ${isActive ? 'bg-[#8B5CF6] text-white border-transparent' : 'bg-[#1F1F23] text-gray-400 hover:bg-[#2A2A30]'}`}>
    <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-80">{day}</span>
    <span className="text-xl font-bold leading-none">{date}</span>
  </div>
);

// Time component
const TimeCard = ({ time, isActive }: { time: string; isActive: boolean }) => (
  <div className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-bold transition-colors whitespace-nowrap border border-[#2A2A30] ${isActive ? 'bg-[#8B5CF6] text-white border-transparent' : 'bg-[#1F1F23] text-gray-400 hover:bg-[#2A2A30]'}`}>
    {time}
  </div>
);

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const { isDark, themeStyles } = useTheme();

  // Date/Time selection states
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

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

      const ev = eventResponse.data.event as Event;
      setEvent(ev);
      setBookedSeats(seatsResponse.data.bookedSeats);

      // Initialize selected date to the first available date
      if (ev.event_dates && ev.event_dates.length > 0) {
        setSelectedDateId(ev.event_dates[0]._id);
      }
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
    if (!event?.seating_layout) return { subtotal: 0, platformFee: 0, total: 0, isFree: true, seatPrices: [], groupedSeats: {} };

    const seatingLayout = event.seating_layout;
    const isFreeEvent = event.payment_type === 'free';
    const combinedTickets = [
      ...(event.offerTickets || []),
      ...(event.ticket_types || [])
    ];

    let subtotal = 0;
    const seatPrices: Array<{ seatId: string; ticketType: string; price: number }> = [];

    selectedSeats.forEach(seatId => {
      const seat = seatingLayout.seats?.find((s: SeatInfo) => s.seatId === seatId);
      if (seat) {
        let typeName = seat.ticketTypeName;
        let seatPrice = Number(seat.price) || 0;

        // Priority 1: Explicit assignment in layout
        const assignment = seatingLayout.ticketTypeAssignments?.find(a =>
          a.assignedSeats?.includes(seatId) || (seat.ticketTypeId && a.ticketTypeId === seat.ticketTypeId)
        );

        if (assignment) {
          if (!typeName) typeName = assignment.ticketTypeName;
          if (seatPrice === 0) seatPrice = Number(assignment.price) || 0;
        }

        // Priority 2: Match against event tiers if still missing or 0
        if (!isFreeEvent && seatPrice === 0) {
          const globalTiers = [
            ...(event.ticket_types || []),
            ...(event.offerTickets || [])
          ];

          const tier = globalTiers.find(t =>
            (assignment?.ticketTypeId && t._id === assignment.ticketTypeId) ||
            (seat.ticketTypeId && Number(seat.ticketTypeId) === Number(t._id)) ||
            (seat.ticketTypeId && t._id === seat.ticketTypeId) ||
            (typeName && t.ticket_type && t.ticket_type.toLowerCase() === typeName.toLowerCase()) ||
            (assignment?.ticketTypeName && t.ticket_type && t.ticket_type.toLowerCase() === assignment.ticketTypeName.toLowerCase())
          ) || globalTiers[0];

          if (tier) {
            if (seatPrice === 0) seatPrice = Number(tier.ticket_price) || 0;
            if (!typeName || typeName.toLowerCase() === 'seated') typeName = tier.ticket_type;
          }
        }

        // Final fallbacks
        if (isFreeEvent) seatPrice = 0;
        if (!typeName || typeName.toLowerCase() === 'seated') {
          typeName = combinedTickets.length > 0 ? combinedTickets[0].ticket_type : 'Ticket';
        }

        const finalTypeName = typeName || (combinedTickets.length > 0 ? combinedTickets[0].ticket_type : 'Ticket');

        subtotal += seatPrice;
        seatPrices.push({
          seatId: seat.seatId,
          ticketType: finalTypeName,
          price: seatPrice
        });
      }
    });

    const platformFee = isFreeEvent ? 0 : selectedSeats.length * 1;
    const totalResult = subtotal + platformFee;

    const groupedSeats = seatPrices.reduce((acc, seat) => {
      const key = `${seat.ticketType}-${seat.price}`;
      if (!acc[key]) {
        acc[key] = { type: seat.ticketType, price: seat.price, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { type: string, price: number, count: number }>);

    return {
      subtotal,
      platformFee,
      total: totalResult,
      isFree: isFreeEvent,
      seatPrices,
      groupedSeats
    };
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
              setConfirmedBooking(verifyData.data.booking);
              setShowPaymentModal(false);
              setShowSuccessModal(true);
            }
          } catch (error: any) {
            alert(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#8B5CF6' },
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

    if (!seats) return null;

    const seatsByRow = seats.reduce((acc: any, seat: SeatInfo) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    const maxCol = Math.max(...seats.map(s => s.column)) || 1;

    return (
      <div className="w-full flex justify-center px-2 sm:px-4 md:px-8 mt-4 overflow-auto no-scrollbar scroll-smooth">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
          <div
            className="grid gap-x-2 gap-y-3 items-center mx-auto pb-4"
            style={{ gridTemplateColumns: `30px repeat(${maxCol}, min-content) 30px` }}
          >
            {rows.map((row) => {
              const rowSeats = seatsByRow[row] || [];
              return (
                <React.Fragment key={`row-${row}`}>
                  <span className="text-gray-500 font-medium text-[10px] md:text-xs text-center uppercase tracking-wider">{row}</span>
                  {Array.from({ length: maxCol }).map((_, i) => {
                    const colNum = i + 1;
                    const seat = rowSeats.find((s: SeatInfo) => s.column === colNum);

                    if (!seat) return <div key={`empty-${row}-${colNum}`} className="w-6 h-6 sm:w-8 sm:h-8" />;

                    const isBooked = bookedSeats.includes(seat.seatId);
                    const isSelected = selectedSeats.includes(seat.seatId);
                    const isAvailable = seat.isAvailable && !isBooked;
                    const status = isSelected ? 'selected' : isBooked ? 'booked' : 'available';

                    return (
                      <button
                        key={seat.seatId}
                        onClick={() => handleSeatClick(seat.seatId, isAvailable)}
                        disabled={!isAvailable}
                        className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-transform hover:scale-110 ${!isAvailable && !isBooked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`${seat.seatId} - ${seat.ticketTypeName} - ₹${seat.price || 0}`}
                      >
                        <ChairSvg status={status} />
                      </button>
                    );
                  })}
                  <span className="text-gray-500 font-medium text-[10px] md:text-xs text-center uppercase tracking-wider">{row}</span>
                </React.Fragment>
              );
            })}
            {/* Column Numbers at Bottom */}
            <div /> {/* spacing */}
            {Array.from({ length: maxCol }).map((_, i) => (
              <div key={`colnum-${i}`} className="text-[#4A4A52] text-[9px] md:text-[10px] font-bold text-center mt-2">
                {i + 1}
              </div>
            ))}
            <div /> {/* spacing */}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error || !event || !event.seating_layout) {
    return (
      <div className="min-h-screen bg-[#0E0E12] py-8 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="p-8 text-center bg-[#1F1F23] border-[#2A2A30]">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Seating Not Available</h2>
            <p className="text-gray-400 mb-6">{error || 'This event does not have a seating layout.'}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#8B5CF6] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const { subtotal, platformFee, total, isFree, seatPrices } = calculateTotal();

  // Get ticket price string
  const minPrice = event.ticket_types?.length ? Math.min(...event.ticket_types.map(t => t.ticket_price)) : null;
  const ticketPriceString = event.payment_type === 'free' ? 'Free' : (minPrice !== null && minPrice >= 0 ? `₹${minPrice}` : 'Paid');

  // Process dynamic dates
  const uniqueDates = event.event_dates?.reduce((acc: any[], curr) => {
    // Basic deduplication to create distinct "Days" from the start_dates
    const dateObj = new Date(curr.start_date);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

    // Only add if not already in array (for multi-day events with multiple times on same day)
    // Here we'll just present all slots distinct based on their _id
    acc.push({
      id: curr._id,
      day: day.toUpperCase(),
      date: dateNum,
      isActive: selectedDateId === curr._id
    });
    return acc;
  }, []) || [];

  // Assuming active date id yields times if multi-day or single times
  const activeEventDate = event.event_dates?.find(d => d._id === selectedDateId);
  const startTimeStr = activeEventDate?.start_time || 'N/A';
  // We'll mimic the multi-time selection UI using just the single start time if it's the only one provided per date block,
  // or allow clicking it dynamically (for UI purposes, the current active date dictates the time displayed)

  const dynamicTimes = activeEventDate?.start_time ? [{
    id: activeEventDate._id,
    time: activeEventDate.start_time,
    isActive: true // Currently only one time slot mapped per distinct Date _id usually
  }] : [];

  // Get primary start date nicely formatted
  const primaryDateObj = event.event_dates?.[0]?.start_date ? new Date(event.event_dates[0].start_date) : null;
  const primaryDateString = primaryDateObj ? `${primaryDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}, ${primaryDateObj.toLocaleDateString('en-US', { weekday: 'long' })} ${event.event_dates[0].start_time || ''}` : 'Date & Time TBD';

  return (
    <div
      className="h-screen overflow-hidden font-sans selection:bg-[#8860D9] selection:text-white scrollbar-hide"
      style={{ backgroundColor: themeStyles.background, color: themeStyles.text }}
    >
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Floating Header Actions - Mobile layout requires flex, but we'll absolute position them for larger screens */}
      <div className="lg:fixed lg:top-6 lg:left-6 z-50 flex justify-between w-full lg:w-auto p-4 lg:p-0 bg-transparent flex-none">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1F1F23]/80 backdrop-blur-md flex items-center justify-center hover:bg-[#2A2A30] transition border border-[#2A2A30]"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        {/* On mobile only, we show the right side actions in the same header flex. On desktop, fixed top right */}
        <div className="flex gap-3 lg:hidden">
          <button className="w-10 h-10 rounded-full bg-[#1F1F23]/80 backdrop-blur-md flex items-center justify-center hover:bg-[#2A2A30] transition border border-[#2A2A30]">
            <Heart className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-[#1F1F23]/80 backdrop-blur-md flex items-center justify-center hover:bg-[#2A2A30] transition border border-[#2A2A30]">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="hidden lg:flex fixed top-6 right-6 z-50 gap-3">
        <button className="w-10 h-10 rounded-full bg-[#1F1F23]/80 backdrop-blur-md flex items-center justify-center hover:bg-[#2A2A30] transition border border-[#2A2A30]">
          <Heart className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-[#1F1F23]/80 backdrop-blur-md flex items-center justify-center hover:bg-[#2A2A30] transition border border-[#2A2A30]">
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-screen">

        {/* === Left Panel: Event Info === */}
        <div
          className="w-full lg:w-[358px] min-h-screen lg:h-screen p-6 lg:p-8 flex flex-col overflow-y-auto no-scrollbar lg:pt-20 shrink-0 border-r"
          style={{
            background: isDark ? 'var(--pop_up_card, #1C2024)' : 'rgba(255, 255, 255, 1)',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            boxShadow: isDark ? 'none' : '2px 0 10px rgba(0,0,0,0.05)'
          }}
        >

          {/* Main Info Area: Side-by-Side Image & Text */}
          <div className="flex flex-col gap-6 mb-8 px-2 mt-4 sm:mt-0 items-center lg:items-start text-center lg:text-left">
            {/* Image */}
            <div
              style={{ width: '273px', height: '391px', borderRadius: '12px' }}
              className="overflow-hidden shrink-0 shadow-lg relative bg-white/5 mx-auto lg:mx-0"
            >
              {event.event_banner || event.event_images?.[0]?.path ? (
                <img src={event.event_banner || event.event_images?.[0]?.path} alt={event.event_name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ticket className="w-10 h-10 text-white/10" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="w-full flex flex-col justify-start">
              <div>
                <h2
                  className="font-bold text-[22px] md:text-[24px] leading-tight line-clamp-3"
                  style={{ color: themeStyles.text }}
                >
                  {event.event_name}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-2">
            <div className="space-y-4 text-[13px] sm:text-[15px] font-semibold mb-6 md:mb-8 text-left" style={{ color: themeStyles.textSecondary }}>
              <div className="flex items-center gap-3">
                <img src={CalendarIconSVG.src} className="w-5 h-5 block" alt="Date" />
                <span>{primaryDateString}</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={LocationIconSVG.src} className="w-5 h-5 block" alt="Location" />
                <span className="line-clamp-2">{event.location || event.venue || 'No Location specified'}</span>
              </div>
              <div className="flex items-center gap-3" title="Ticket Price">
                <img src={FreeOrPaidIconSVG.src} className="w-5 h-5 block" alt="Ticket Price" />
                <span className="text-lg font-bold" style={{ color: themeStyles.text }}>{ticketPriceString}</span>
              </div>
            </div>
          </div>

          {/* Seat selection summary */}
          {selectedSeats.length > 0 && (
            <div className="px-2 mt-2 flex flex-col gap-4 text-left">
              {(() => {
                const { total, subtotal, platformFee, isFree, seatPrices, groupedSeats } = calculateTotal();

                return (
                  <>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {seatPrices.map((seat, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: '40px',
                            minWidth: '60px',
                            borderRadius: '8px',
                            borderWidth: '0.6px',
                            borderStyle: 'solid',
                            padding: '8px 16px',
                            background: 'linear-gradient(0deg, #9575CD, #9575CD)',
                            borderImageSource: 'linear-gradient(180deg, #666666 0%, #616060 50%, #393939 100%)',
                            borderImageSlice: 1
                          }}
                          className="flex items-center justify-center text-white font-bold whitespace-nowrap text-sm tracking-wider"
                        >
                          {seat.seatId}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-[277px]">
                      {Object.values(groupedSeats).map((group, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[14px] font-medium tracking-wide" style={{ color: themeStyles.text }}>
                          <span style={{ color: themeStyles.textSecondary }}>{group.type} {isFree ? '' : `(₹${group.price} × ${group.count})`}</span>
                          <span className="font-bold">{isFree ? 'FREE' : `₹${group.price * group.count}`}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        width: '277px',
                        height: '0px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderImageSource: isDark ? 'linear-gradient(270deg, rgba(32, 32, 32, 0) -8.43%, rgba(96, 96, 96, 0.6) 45.79%, rgba(96, 96, 96, 0) 100%)' : 'linear-gradient(270deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                        borderImageSlice: 1,
                        opacity: 1
                      }}
                      className="my-3 max-w-full"
                    />

                    <div className="flex flex-col gap-3 w-full max-w-[277px]">
                      <div className="flex justify-between items-center text-[14px] font-medium">
                        <span style={{ color: themeStyles.textSecondary }}>Tickets Subtotal</span>
                        <span style={{ color: themeStyles.text }}>{isFree ? 'FREE' : `₹${subtotal}`}</span>
                      </div>
                      {!isFree && (
                        <div className="flex justify-between items-center text-[13px] font-medium border-b border-gray-500/10 pb-3">
                          <span style={{ color: themeStyles.textSecondary }}>Taxes & Fees (₹1 × {selectedSeats.length})</span>
                          <span style={{ color: themeStyles.textSecondary }}>₹{platformFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[18px] font-bold">
                        <span style={{ color: themeStyles.text }}>Grand Total</span>
                        <span className="text-[#8B5CF6]">{isFree ? 'FREE' : `₹${total}`}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
              {/* Gallery is hidden when seats are selected to prevent clutter */}
            </div>
          )}

          {selectedSeats.length === 0 && event.event_images && event.event_images.length > 0 && (
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-xs font-semibold tracking-wide">Featured Images</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-8 lg:mb-0">
                {event.event_images.slice(0, 4).map((img, idx) => (
                  <img key={idx} src={img.path} className="w-full aspect-square rounded-2xl object-cover hover:opacity-80 transition" alt={`gallery-${idx}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === Right Panel: Seating & Time Grid === */}
        <div
          className="flex-1 flex flex-col relative overflow-hidden"
          style={{ background: isDark ? '#111116' : themeStyles.background }}
        >

          <div className="flex-1 overflow-auto no-scrollbar relative pt-8 lg:pt-16 pb-40">
            {/* Dates Picker */}
            <div className="flex items-center gap-3 w-full max-w-xl mx-auto px-4 mb-6">
              <button
                className="flex-shrink-0 w-8 h-8 rounded-full hidden sm:flex items-center justify-center transition shadow-md hover:opacity-80"
                style={{
                  background: isDark ? '#1F1F23' : '#F3F4F6',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2 mx-auto overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 w-full justify-start sm:justify-center">
                {uniqueDates.length > 0 ? uniqueDates.map((d, i) => (
                  <div key={d.id || i} className="snap-center shrink-0" onClick={() => setSelectedDateId(d.id)}>
                    <DateCard day={d.day} date={d.date} isActive={d.isActive} />
                  </div>
                )) : (
                  <span className="text-gray-500 text-sm">No Dates Available</span>
                )}
              </div>
              <button
                className="flex-shrink-0 w-8 h-8 rounded-full hidden sm:flex items-center justify-center transition shadow-md hover:opacity-80"
                style={{
                  background: isDark ? '#1F1F23' : '#F3F4F6',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Times Picker */}
            <div className="flex justify-start sm:justify-center gap-2 mb-10 w-full px-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2">
              {dynamicTimes.length > 0 ? dynamicTimes.map((t, i) => (
                <div key={t.id || i} className="snap-center shrink-0">
                  <TimeCard time={t.time} isActive={t.isActive} />
                </div>
              )) : (
                <span className="text-gray-500 text-sm hidden">No specific times available</span>
              )}
            </div>

            <div
              className="fixed bottom-24 right-4 md:bottom-32 md:right-8 z-50 flex flex-col items-center gap-4 backdrop-blur-2xl p-4 rounded-[2rem] border transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              style={{
                background: isDark ? 'rgba(31, 31, 35, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="flex flex-col items-center gap-1 mb-1">
                <div className="text-[9px] font-black text-purple-500 uppercase tracking-widest leading-none">Zoom</div>
                <div className="text-[10px] font-bold opacity-40">{Math.round(zoom * 100)}%</div>
              </div>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.5))}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg group"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#fff' : '#000',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Plus className="w-5 h-5 group-hover:text-purple-500 transition-colors" />
              </button>
              <div className="relative h-24 w-1.5 flex items-center justify-center bg-gray-500/10 rounded-full overflow-hidden">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="appearance-none bg-transparent cursor-pointer h-2 w-full hover:opacity-100 transition-opacity"
                  style={{
                    width: '96px',
                    transform: 'rotate(-90deg)',
                    position: 'absolute',
                    zIndex: 2
                  }}
                />
                {/* Visual Track Fill */}
                <div
                  className="absolute bottom-0 w-full transition-all duration-200"
                  style={{
                    height: `${((zoom - 0.5) / 1) * 100}%`,
                    background: 'linear-gradient(180deg, #8860D9 0%, #9575CD 100%)',
                    borderRadius: '999px'
                  }}
                />
              </div>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg group"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#fff' : '#000',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Minus className="w-5 h-5 group-hover:text-purple-500 transition-colors" />
              </button>
            </div>

            {/* Screen Trapezoid */}
            <div className="w-full flex justify-center mb-16 relative">
              <div
                style={{
                  width: '280px',
                  borderTop: '0px solid transparent',
                  borderLeft: '40px solid transparent',
                  borderRight: '40px solid transparent',
                  borderBottom: `45px solid ${isDark ? '#1F1F23' : '#E5E7EB'}`,
                  height: 0,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.1) inset'
                }}
              >
                <div className="absolute top-[16px] -translate-x-1/2 left-1/2 text-xs tracking-[0.3em] font-bold" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>
                  SCREEN
                </div>
                {/* Subtle gradient glow behind screen */}
                <div className="absolute top-[45px] -translate-x-1/2 left-1/2 w-[350px] h-[100px] bg-[#8B5CF6]/5 blur-3xl pointer-events-none" />
              </div>
            </div>

            {/* Seating Grid */}
            <div className="px-4">
              {renderSeatingChart()}
            </div>

            {/* Seating Legend inside layout */}
            <div className="flex items-center justify-center gap-8 mt-16 mb-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#E5E7EB]" />
                Available
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#DC2626]" />
                Booked
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
                Selected
              </div>
            </div>
          </div>

          <div
            className="sticky bottom-0 w-full p-4 lg:p-6 flex flex-col md:flex-row justify-center items-center gap-4 border-t z-50 transition-all duration-300"
            style={{
              background: isDark ? '#111116' : themeStyles.background,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          >
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center transition-colors font-semibold shadow-sm hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                width: '230px',
                height: '48px',
                opacity: 1,
                gap: '10px',
                borderRadius: '25px',
                border: '0.4px solid #9575CD',
                padding: '8px 12px 8px 12px',
                color: themeStyles.text,
              }}
            >
              Cancel
            </button>
            <button
              onClick={showPaymentModal ? initiatePayment : handleProceedToPayment}
              disabled={selectedSeats.length === 0 || isBooking}
              className="flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 transition-all outline-none"
              style={{
                width: '230px',
                height: '48px',
                opacity: 1,
                gap: '10px',
                borderRadius: '25px',
                padding: '8px 12px 8px 12px',
                background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)'
              }}
            >
              {isBooking ? 'Processing...' : selectedSeats.length > 0 ? `Pay ${calculateTotal().isFree ? 'FREE' : '₹' + calculateTotal().total}` : 'Select your seats'}
            </button>
          </div>
        </div>

        {/* Modal Overlay */}
        {/* Confirm Selection Modal */}
        <ConfirmSelectionModal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={initiatePayment}
          event={event}
          selectedSeats={selectedSeats}
          seatPrices={seatPrices}
          total={total}
          isFree={isFree}
          platformFee={platformFee}
          isBooking={isBooking}
        />

        {/* Success / Ticket Modal */}
        <BookingModal
          show={showSuccessModal}
          variant="SUCCESS"
          onClose={() => {
            setShowSuccessModal(false);
            router.push(`/events/${eventId as string}`);
          }}
          event={event}
          selectedSeats={selectedSeats}
          quantity={selectedSeats.length}
          total={calculateTotal().total}
          platformFee={calculateTotal().platformFee}
          isFree={calculateTotal().isFree}
          booking={confirmedBooking}
        />
      </div>
    </div>
  );
}
