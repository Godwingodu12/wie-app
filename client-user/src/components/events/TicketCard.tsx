'use client';

import React from "react";
import { Armchair } from "lucide-react";
import { Booking } from "@/services/transactionService";
import { useTheme } from "@/components/home/ThemeContext";

export interface TicketCardProps {
  event?: any;
  booking?: Booking;
  selectedSeats?: any[];
  quantity?: number;
  total?: number;
  currency?: string;
  isFree?: boolean;
  platformFee?: number;
  showQR?: boolean;
  ticketType?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  event,
  booking,
  selectedSeats,
  quantity,
  total,
  currency = "INR",
  isFree,
  platformFee,
  showQR = false,
  ticketType,
}) => {
  const { isDark } = useTheme();

  // Data normalization
  const eventData = booking?.eventDetails || event;
  const imageUrl = event?.event_images?.[0]?.path
    || (event as any)?.event_banner
    || (event as any)?.banner
    || (event as any)?.image
    || eventData?.imageUrl
    || eventData?.bannerUrl
    || eventData?.event_banner
    || (eventData as any)?.image
    || (eventData as any)?.path;
  const eventName = eventData?.eventName || eventData?.event_name || event?.event_name || "EVENT TICKET";

  const dateStr = eventData?.eventDate || eventData?.start_date || eventData?.event_dates?.[0]?.start_date;
  let day = "--", month = "", weekday = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        day = d.getDate().toString().padStart(2, "0");
        month = d.toLocaleString("default", { month: "short" }).toUpperCase();
        weekday = d.toLocaleString("default", { weekday: "short" }).toUpperCase();
      }
    } catch (e) { }
  }

  const eventTime = eventData?.eventTime || eventData?.start_time || eventData?.event_dates?.[0]?.start_time;
  const timeDisplay = eventTime ? eventTime.replace(/(AM|PM|am|pm)/i, "").trim() : "--";
  const amPm = eventTime?.match(/(AM|PM|am|pm)/i)?.[0]?.toUpperCase() || "";

  const venueStr = eventData?.venue || eventData?.location || eventData?.location_name || "TBA";
  const venueParts = venueStr.split(",");
  const mainVenue = venueParts[0]?.trim().toUpperCase();
  const subVenue = venueParts.slice(1).join(",").trim().toUpperCase();

  const bookingData = booking as any;
  const displayQuantity = quantity !== undefined ? quantity : (bookingData?.quantity || (selectedSeats ? selectedSeats.length : 0));
  const displayTotal = total !== undefined ? total : (bookingData?.totalAmount ?? bookingData?.total_amount ?? bookingData?.total);
  const displayIsFree = isFree !== undefined ? isFree : (displayTotal === 0);
  const currencySymbol = (bookingData?.currency || currency) === "USD" ? "$" : "₹";

  const displayBookingId = (bookingData?.id || bookingData?._id || bookingData?.bookingId || "TICKETX").toString();

  const isOnlineOrRecorded = eventData?.location_type?.toLowerCase() === 'online' || eventData?.location_type?.toLowerCase() === 'recorded';
  const isTBA = !mainVenue ||
    mainVenue === 'TBA' ||
    mainVenue === 'VIRTUAL/TBD' ||
    mainVenue === 'LOCATION TBA' ||
    mainVenue.includes('TBA') ||
    mainVenue.includes('TBD');

  const [clientQrCode, setClientQrCode] = React.useState<string>("");

  React.useEffect(() => {
    if (!showQR) return;

    // If booking already has a valid data URL QR code, use it
    if (booking?.qrCode?.startsWith("data:image/")) {
      setClientQrCode(booking.qrCode);
      return;
    }

    const generateClientQR = async () => {
      try {
        const payload = {
          bookingId: (bookingData?.bookingId || bookingData?.id || bookingData?._id || "TICKETX").toString(),
          userId: (bookingData?.userId || "").toString(),
          ticketId: (bookingData?.ticketId || eventData?.id || eventData?._id || eventData?.ticketId || "").toString(),
          eventName: eventName || "",
          ticketType: ticketType || bookingData?.ticketType || bookingData?.ticket_type || eventData?.ticketType || "General Admission",
          quantity: Number(displayQuantity) || 1,
          holderName: bookingData?.userDetails?.userName || bookingData?.userDetails?.name || bookingData?.user_details?.userName || bookingData?.user_details?.name || "GUEST",
          eventDate: eventData?.eventDate || eventData?.start_date || eventData?.event_dates?.[0]?.start_date || "",
          eventTime: eventData?.eventTime || eventData?.start_time || eventData?.event_dates?.[0]?.start_time || "",
          venue: eventData?.venue || eventData?.location || eventData?.location_name || "",
          paymentMethod: bookingData?.paymentMethod || bookingData?.payment_method || (displayIsFree ? "free" : ""),
          totalAmount: Number(displayTotal) || 0,
          subtotal: Number(bookingData?.subtotal) || (Number(bookingData?.pricePerTicket || bookingData?.price_per_ticket || 0) * Number(displayQuantity || 1)) || 0,
          v: 1,
        };

        const qrString = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

        const QRCodeLib = await import("qrcode");
        const dataUrl = await QRCodeLib.toDataURL(qrString, {
          errorCorrectionLevel: "H",
          width: 400,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setClientQrCode(dataUrl);
      } catch (err) {
        console.error("Error generating client QR code:", err);
      }
    };

    generateClientQR();
  }, [
    showQR,
    booking,
    event,
    bookingData,
    eventData,
    eventName,
    ticketType,
    displayQuantity,
    displayTotal,
    displayIsFree,
  ]);

  const qrCodeUrl = React.useMemo(() => {
    if (!showQR) return "";
    return clientQrCode || booking?.qrCode || "";
  }, [showQR, clientQrCode, booking?.qrCode]);

  return (
    <div
      id="ticket-card-content"
      className="relative w-full max-w-[310px] sm:max-w-[340px] shadow-xl drop-shadow-2xl overflow-hidden bg-white mx-auto transition-all duration-300"
      style={{
        borderRadius: "16px",
        maskImage: `radial-gradient(circle at 0 0, transparent 12px, black 13px),
                    radial-gradient(circle at 100% 0, transparent 12px, black 13px),
                    radial-gradient(circle at 0 100%, transparent 12px, black 13px),
                    radial-gradient(circle at 100% 100%, transparent 12px, black 13px),
                    radial-gradient(circle at 0 165px, transparent 12px, black 13px),
                    radial-gradient(circle at 100% 165px, transparent 12px, black 13px)`,
        maskComposite: "intersect",
        WebkitMaskImage: `radial-gradient(circle at 0 0, transparent 12px, black 13px),
                          radial-gradient(circle at 100% 0, transparent 12px, black 13px),
                          radial-gradient(circle at 0 100%, transparent 12px, black 13px),
                          radial-gradient(circle at 100% 100%, transparent 12px, black 13px),
                          radial-gradient(circle at 0 165px, transparent 12px, black 13px),
                          radial-gradient(circle at 100% 165px, transparent 12px, black 13px)`,
        WebkitMaskComposite: "source-in",
      }}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: "16px" }}>
        {/* Top Image Section */}
        <div className="relative h-[165px] w-full bg-gray-300 overflow-hidden">
          <img src={imageUrl || ""} alt={eventName} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-[clamp(18px,5vw,22px)] font-bold text-white uppercase leading-[1.1] tracking-wide drop-shadow-md line-clamp-2">
              {eventName}
            </h2>
          </div>
        </div>

        {/* Ticket Divider Line */}
        <div className="relative h-0 w-full z-10 px-3">
          <div
            className="w-full border-t-[2px] border-dashed"
            style={{ borderColor: "rgba(0, 0, 0, 0.2)", transform: "translateY(-1px)" }}
          />
        </div>

        {/* Bottom Data Section */}
        <div
          className="w-full p-4 sm:p-5 pt-4 sm:pt-5 relative bg-[#F1F5F9] transition-all duration-300"
          style={{ background: isDark ? "#F8F9FA" : "#F1F5F9" }}
        >
          {/* Row 1: Date, Time, Amount */}
          <div className="flex justify-between items-start mb-4 w-full px-1">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Date</span>
              <div className="flex items-center gap-1 text-slate-900">
                <span className="text-[clamp(16px,4vw,20px)] font-black leading-none tracking-tighter">{day}</span>
                <div className="flex flex-col justify-center">
                  <span className="text-[clamp(8px,1.8vw,9px)] font-bold leading-none">{month}</span>
                  <span className="text-[clamp(8px,1.8vw,9px)] font-bold leading-none mt-[2px]">{weekday}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Time</span>
              <div className="flex items-end gap-1 text-slate-900">
                <span className="text-[clamp(14px,3.8vw,18px)] font-black leading-none tracking-tighter">{timeDisplay}</span>
                <span className="text-[clamp(8px,1.8vw,10px)] font-bold leading-none pb-[2px]">{amPm}</span>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Amount</span>
              <span className="text-[clamp(14px,3.8vw,18px)] font-black leading-none tracking-tighter text-slate-900">
                {displayIsFree ? "FREE" : `${currencySymbol}${displayTotal?.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Row 2: Seats */}
          <div className="flex justify-between items-start mb-4 w-full pr-1">
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Seats</span>
              <div className="flex items-baseline gap-[4px] text-slate-900 min-w-0">
                <span className="text-[clamp(13px,3vw,16px)] font-black leading-none tracking-tighter shrink-0">{displayQuantity}</span>
                <span className="text-[clamp(10px,2.5vw,13px)] font-black leading-none uppercase tracking-tighter truncate">
                  ✕ {ticketType || bookingData?.ticketType || bookingData?.ticket_type || eventData?.ticketType || (selectedSeats ? "Selected" : "Ticket")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 min-w-[80px] shrink-0">
              <Armchair className="w-4 h-4 text-[#9575CD] opacity-70 mb-0.5" strokeWidth={1.5} />
              {(selectedSeats || bookingData?.selectedSeats) && (selectedSeats || bookingData?.selectedSeats).length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                  {(selectedSeats || bookingData?.selectedSeats).map((s: any, idx: number) => {
                    const label = typeof s === 'string' ? s : (s.label || (s.row && s.col ? `${s.row}${s.col}` : null));
                    if (!label) return null;
                    return (
                      <span key={idx} className="text-[8px] font-black bg-[#9575CD]/10 text-[#9575CD] px-1.5 py-0.5 rounded leading-none uppercase border border-[#9575CD]/20">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Location */}
          {!isOnlineOrRecorded && !isTBA && (
            <div className="flex flex-col w-full pb-1">
              <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Location</span>
              <span className="text-[clamp(10px,2.5vw,12px)] font-black leading-tight tracking-tight uppercase text-slate-900 line-clamp-2">
                {mainVenue}
              </span>
              {subVenue && <span className="text-[9px] font-bold text-[#6A729A] uppercase mt-0.5 line-clamp-1 opacity-80">{subVenue}</span>}
            </div>
          )}

          {/* Row 4: QR Section when showQR is true */}
          {showQR && qrCodeUrl && (
            <>
              <div className="my-3 h-0 w-full z-10">
                <div
                  className="w-full border-t-[2px] border-dashed"
                  style={{ borderColor: "rgba(0, 0, 0, 0.15)" }}
                />
              </div>
              <div className="flex flex-row items-center justify-between w-full pt-1.5">
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="text-[9px] font-bold text-[#6A729A] uppercase tracking-widest mb-1">Booked By</span>
                  <span className="text-[12px] font-black leading-tight tracking-tight uppercase text-slate-900 line-clamp-1 truncate mb-2">
                    {bookingData?.userDetails?.userName || bookingData?.userDetails?.name || bookingData?.user_details?.userName || bookingData?.user_details?.name || "GUEST"}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm shrink-0 qr-container-target">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-[120px] h-[120px] object-contain block"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
