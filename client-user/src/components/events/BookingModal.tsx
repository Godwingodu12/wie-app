'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/home/ThemeContext';
import { Download, MapPin, Calendar, Ticket, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { TicketCard } from './TicketCard';
import { Booking } from '@/services/transactionService';

export type BookingModalVariant = "BOOK" | "SUCCESS" | "VIEW";

interface BookingModalProps {
  show: boolean;
  onClose: () => void;
  event: any;
  variant?: BookingModalVariant;
  booking?: Booking;
  selectedSeats?: any[];
  // Existing props for BOOK variant
  selectedTicketType?: string | null;
  setSelectedTicketType?: (id: string) => void;
  quantity?: number;
  setQuantity?: (quantity: number) => void;
  isBooking?: boolean;
  onInitiateBooking?: () => void;
  onViewMore?: () => void;
  total?: number;
  isFree?: boolean;
  platformFee?: number;
  collectedAddons?: {
    foodAddon: { selected: boolean; index: number } | null;
    accommodationAddon: { selected: boolean; index: number } | null;
  } | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  show,
  onClose,
  event,
  variant = "BOOK",
  booking,
  selectedSeats,
  selectedTicketType,
  setSelectedTicketType,
  quantity = 1,
  setQuantity,
  isBooking = false,
  onInitiateBooking,
  onViewMore,
  total: propTotal,
  isFree: propIsFree,
  platformFee: propPlatformFee,
  collectedAddons = null,
}) => {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Auto-select first tier if none selected
  React.useEffect(() => {
    if (show && event?.ticket_types?.length > 0 && !selectedTicketType) {
      setSelectedTicketType?.(event.ticket_types[0]._id);
    }
  }, [show, event, selectedTicketType, setSelectedTicketType]);

  if (!show || !event) return null;

  const ticketTypes = event.ticket_types || [];
  const isFreeEvent = event.payment_type === 'free';

  // Normalize data from booking or props
  const bookingData = booking as any;
  const currentQuantity = bookingData?.quantity || quantity || (selectedSeats?.length || 0) || 1;
  const FEE_PER_TICKET = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE ?? 5);
  const currentPlatformFee = bookingData?.platformFee ?? bookingData?.platform_fee ?? (isFreeEvent ? 0 : currentQuantity * FEE_PER_TICKET);
  const currentTotal = propTotal !== undefined ? propTotal : (bookingData?.totalAmount ?? bookingData?.total_amount ?? bookingData?.total);

  const currentSelectedTicket = ticketTypes.find((t: any) => t._id === (selectedTicketType || bookingData?.ticketTypeId))
    || ticketTypes.find((t: any) => t.ticket_type === bookingData?.ticketType)
    || (ticketTypes.length > 0 ? ticketTypes[0] : null);

  const subtotal = bookingData?.subtotal ?? (bookingData?.pricePerTicket ?? bookingData?.price_per_ticket ?? currentSelectedTicket?.ticket_price ?? 0) * currentQuantity;
  const unitPrice = bookingData?.pricePerTicket ?? bookingData?.price_per_ticket ?? (currentQuantity > 0 ? subtotal / currentQuantity : 0);

  const total = currentTotal !== undefined ? currentTotal : (subtotal + currentPlatformFee);
  const isFree = propIsFree !== undefined ? propIsFree : (total === 0);
  const platformFee = currentPlatformFee;
  const imageUrl = event.event_images?.[0]?.path || '';

  const startDateStr = event.event_dates?.[0]?.start_date || event.start_date;
  const startTime = event.event_dates?.[0]?.start_time || event.start_time;
  const formattedDate = startDateStr
    ? new Date(startDateStr).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const dayName = startDateStr ? new Date(startDateStr).toLocaleDateString("en-US", { weekday: 'long' }) : '';
  const dateTimeDisplay = `${formattedDate}, ${dayName}${startTime ? `, ${startTime}` : ''}`;

  const handleDownload = () => {
    const qrCode = booking?.qrCode;
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `ticket-${booking?.bookingId || "event"}.png`;
    link.click();
  };

  if (variant === "VIEW" || variant === "SUCCESS") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 transition-all duration-300 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className={`relative border rounded-3xl p-5 sm:p-8 pt-6 w-[92vw] sm:w-full sm:max-w-[420px] shadow-2xl flex flex-col items-center transition-all duration-500 transform ${show ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
            }`}
          style={{
            background: isDark ? "rgba(28, 32, 36, 0.4)" : "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(60px) saturate(180%)",
            WebkitBackdropFilter: "blur(60px) saturate(180%)",
            borderColor: isDark ? "rgba(149, 117, 205, 0.15)" : "rgba(149, 117, 205, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Universal Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full transition-all hover:bg-white/10 active:scale-95 z-20 group"
          >
            <X className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </button>

          <p className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white self-center">
            {variant === "SUCCESS" ? "Booking Successful!" : "Your tickets"}
          </p>

          <TicketCard
            booking={booking}
            event={event}
            selectedSeats={selectedSeats}
            total={total}
            quantity={currentQuantity}
            isFree={isFree}
            platformFee={platformFee}
            showQR={false}
            ticketType={currentSelectedTicket?.ticket_type || bookingData?.ticketType || bookingData?.ticket_type}
          />

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10 w-full justify-center items-center">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 sm:max-w-[155px] h-[44px] sm:h-[48px] rounded-full text-[13px] font-bold transition-all flex items-center justify-center border border-white/20 bg-white/5 text-white hover:bg-white/10 active:scale-95"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onClose();
                router.push('/events/nearby');
              }}
              className="w-full sm:flex-1 sm:max-w-[155px] h-[44px] sm:h-[48px] rounded-full text-white text-[13px] font-bold shadow-lg transition-all flex items-center justify-center hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)' }}
            >
              Back to event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-[95vw] sm:w-full sm:max-w-[420px] rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-500 transform ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
          }`}
        style={{
          background: isDark ? "rgba(26, 28, 46, 0.75)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderColor: isDark ? "rgba(149, 117, 205, 0.15)" : "rgba(0, 0, 0, 0.05)",
          boxShadow: isDark ? "0 40px 100px rgba(0,0,0,0.6)" : "0 20px 50px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Universal Close Button for BOOK variant */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full transition-all active:scale-95 z-20 group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          <X className={`w-5 h-5 transition-colors ${isDark ? 'text-white/50 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
        </button>
        {/* Header */}
        <div className="pt-8 pb-4 text-center">
          <h2 className={`text-[15px] font-semibold tracking-wide uppercase ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}>
            Choose ticket count
          </h2>
        </div>
        {/* Content Section */}
        <div className="px-4 sm:px-8 pb-5 sm:pb-8 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[80vh]">
          {/* Main Info Area: Side-by-Side Image & Text */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-stretch">
            {/* Left: Image */}
            <div className={`w-full sm:max-w-none aspect-[16/9] sm:aspect-auto sm:w-[160px] sm:h-auto sm:min-h-[200px] rounded-2xl overflow-hidden shrink-0 shadow-lg border relative ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-gray-100'}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={event.event_name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ticket className={`w-10 h-10 ${isDark ? 'text-white/10' : 'text-black/10'}`} />
                </div>
              )}
            </div>

            {/* Right: Info & Controls */}
            <div className="flex-1 w-full py-0 sm:py-1 flex flex-col justify-between gap-5 text-center sm:text-left">

              {/* Info Header */}
              <div className="space-y-4">
                <h3 className={`font-bold text-[20px] leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {event.event_name}
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#9575CD]/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#9575CD]" />
                    </div>
                    <span className={`text-[12px] sm:text-[13px] font-medium ${isDark ? 'text-[#CBD5E1]' : 'text-gray-700'}`}>{dateTimeDisplay}</span>
                  </div>
                  <div className="flex items-start justify-center sm:justify-start gap-2.5">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#9575CD]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#9575CD]/80" />
                    </div>
                    <span className={`text-[12px] sm:text-[13px] font-medium line-clamp-2 italic pt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}`}>{event.location_name || event.location || 'Location TBA'}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              {variant === "BOOK" && (
                <div className="space-y-4">
                  {/* Ticket Type */}
                  <div className="space-y-2 flex flex-col items-center sm:items-start">
                    <label className={`text-[11px] font-bold uppercase tracking-widest px-1 ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}>Ticket Type</label>
                    <div className="relative w-full">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{ background: isDark ? '#0000001A' : '#ffffff' }}
                        className={`w-full h-[48px] px-4 rounded-xl border flex items-center justify-between transition-all group text-left ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/10 hover:bg-gray-50 shadow-sm'}`}
                      >
                        <span className={`font-bold text-[14px] truncate ${isDark ? 'text-[#E2E8F0]' : 'text-gray-900'}`}>
                          {currentSelectedTicket?.ticket_type || 'Select Tier'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#9575CD] shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div
                          className={`absolute top-[calc(100%+8px)] left-0 right-0 z-30 py-2 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'border-white/10' : 'border-black/5'}`}
                          style={{ background: isDark ? 'rgba(28, 32, 36, 0.95)' : 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)' }}
                        >
                          {ticketTypes.map((type: any, idx: number) => (
                            <button
                              key={type._id || `tier-${idx}`}
                              onClick={() => {
                                setSelectedTicketType?.(type._id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${selectedTicketType === type._id
                                ? (isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-black/5')
                                : (isDark ? 'text-[#94A3B8] hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')
                                }`}
                            >
                              <span className="font-bold text-[13px] text-left truncate pr-2">{type.ticket_type}</span>
                              <span className={`font-bold text-[13px] shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {type.ticket_price === 0 ? 'FREE' : `₹${type.ticket_price}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Quantity */}
                  {(() => {
                    const multipleAllowed = event?.restrict_booking !== true;
                    const maxQty = multipleAllowed ? 50 : 1;
                    return (
                      <div className="space-y-2 flex flex-col items-center sm:items-start">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-1 ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}>Quantity</label>
                        <div className="flex items-center justify-center sm:justify-start gap-4 h-[48px] w-full">
                          {multipleAllowed ? (
                            <>
                              <button
                                onClick={() => setQuantity?.(Math.max(1, quantity - 1))}
                                style={{ background: isDark ? '#0000001A' : '#ffffff' }}
                                className={`w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-20 shadow-sm ${isDark ? 'text-white border-white/5 hover:bg-white/5' : 'text-gray-900 border-black/10 hover:bg-gray-50'}`}
                                disabled={isBooking}
                              >
                                <Minus className="w-4 sm:w-5 h-4 sm:h-5" />
                              </button>
                              <span className={`text-[20px] font-black w-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{quantity}</span>
                              <button
                                onClick={() => setQuantity?.(Math.min(maxQty, quantity + 1))}
                                style={{ background: isDark ? '#0000001A' : '#ffffff' }}
                                className={`w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-20 shadow-sm ${isDark ? 'text-white border-[#9575CD]/30 ring-1 ring-[#9575CD]/20 hover:bg-white/5' : 'text-[#9575CD] border-[#9575CD]/30 ring-1 ring-[#9575CD]/20 hover:bg-[#9575CD]/5'}`}
                                disabled={isBooking}
                              >
                                <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                              </button>
                            </>
                          ) : (
                            <div
                              style={{ background: isDark ? '#0000001A' : '#ffffff' }}
                              className={`w-full sm:w-auto min-w-[120px] h-[48px] px-5 rounded-xl border flex items-center justify-center sm:justify-start gap-2.5 shadow-sm ${isDark ? 'text-white border-white/5' : 'text-gray-900 border-black/10'}`}
                            >
                              <Ticket className="w-5 h-5 text-[#9575CD] shrink-0" />
                              <span className={`text-[14px] font-bold ${isDark ? 'text-[#E2E8F0]' : 'text-gray-800'}`}>1 Ticket</span>
                            </div>
                          )}
                        </div>
                        {!multipleAllowed && (
                          <p className={`text-[11px] px-1 ${isDark ? 'text-[#64748B]' : 'text-gray-400'}`}>
                            1 ticket per person for this event
                          </p>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}
            </div>
          </div>
          {/* Total Amount Section */}
          <div
            className={`w-full rounded-2xl p-4 sm:p-5 border mt-2 flex flex-col gap-3 shadow-sm ${isDark ? 'border-white/5' : 'border-black/5'}`}
            style={{ background: isDark ? '#0000001A' : '#f8fafc' }}
          >
            {/* Addon preview (if addons already selected from AddonModal) */}
            {collectedAddons && (event?.food_details || event?.accommodation_details) && (() => {
              const foodAmt = collectedAddons.foodAddon?.selected && typeof collectedAddons.foodAddon.index === 'number'
                ? Number(event?.food_details?.[collectedAddons.foodAddon.index]?.food_price || 0)
                : 0;
              const accAmt = collectedAddons.accommodationAddon?.selected && typeof collectedAddons.accommodationAddon.index === 'number'
                ? Number(event?.accommodation_details?.[collectedAddons.accommodationAddon.index]?.accommodation_price || 0)
                : 0;
              if (foodAmt <= 0 && accAmt <= 0) return null;
              return (
                <div
                  className="pt-0 pb-1 space-y-1"
                  style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)' }}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-[#64748B]' : 'text-gray-400'}`}>
                    Selected Add-ons
                  </p>
                  {foodAmt > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span className={isDark ? 'text-indigo-300' : 'text-indigo-600'}>🍽 Food catering</span>
                      <span className={`font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>+₹{foodAmt}</span>
                    </div>
                  )}
                  {accAmt > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span className={isDark ? 'text-purple-300' : 'text-purple-600'}>🏨 Accommodation</span>
                      <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>+₹{accAmt}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-0">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}>Total Amount</span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <span className={`font-semibold text-[14px] ${isDark ? 'text-[#E2E8F0]' : 'text-gray-900'}`}>
                    {currentQuantity} × {isFree ? 'FREE' : `₹${unitPrice}`}
                  </span>
                  {!isFree && (
                    <span className={`text-[12px] italic ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      + ₹{platformFee} platform fee
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center sm:text-right sm:pl-4">
                {/* Compute grand total including addons */}
                {(() => {
                  const foodAmt = collectedAddons?.foodAddon?.selected && typeof collectedAddons.foodAddon.index === 'number'
                    ? Number(event?.food_details?.[collectedAddons.foodAddon.index]?.food_price || 0) : 0;
                  const accAmt = collectedAddons?.accommodationAddon?.selected && typeof collectedAddons.accommodationAddon.index === 'number'
                    ? Number(event?.accommodation_details?.[collectedAddons.accommodationAddon.index]?.accommodation_price || 0) : 0;
                  const grandTotal = isFree ? foodAmt + accAmt : total + foodAmt + accAmt;
                  return (
                    <span className={`font-semibold text-[24px] sm:text-[32px] leading-none tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isFree && grandTotal === 0 ? 'FREE' : `₹${grandTotal}`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-10 flex gap-3 justify-center items-center mt-auto w-full">
          <button
            onClick={onClose}
            style={{
              height: '40px',
              borderRadius: '20px',
              border: isDark ? '0.4px solid #9575CD' : '1px solid #9575CD',
              background: isDark ? "rgba(179, 184, 226, 0.1)" : "rgba(149, 117, 205, 0.05)",
              color: isDark ? "#FFFFFF" : "#1A1C2E",
            }}
            className="flex-1 max-w-[145px] text-[12px] sm:text-[13px] font-bold transition-all flex items-center justify-center hover:brightness-110 active:scale-95"
          >
            Cancel
          </button>

          <button
            onClick={onInitiateBooking}
            disabled={isBooking || !selectedTicketType}
            style={{
              height: '40px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
            }}
            className="flex-1 max-w-[145px] text-white text-[12px] sm:text-[13px] font-bold shadow-lg shadow-purple-500/10 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {isBooking ? 'Processing...' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </div>
  );
};
