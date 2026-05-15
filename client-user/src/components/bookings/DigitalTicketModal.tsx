"use client";

import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Loader2, Download, MapPin, Calendar, User, Ticket, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';
import RippleButton from '@/components/ui/Ripple';
import { getEventImage } from '@/utils/helpers';

interface DigitalTicketModalProps {
  show: boolean;
  onClose: () => void;
  booking: any;
}

export default function DigitalTicketModal({ show, onClose, booking }: DigitalTicketModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  if (!show || !booking) return null;

  // Attempt to get booking ID consistently
  const displayBookingId = (booking.id || booking._id || booking.bookingId || "TICKETX").toString();

  // Construct QR Data in human-readable format
  const qrData = [
    `Event: ${booking.eventDetails?.eventName}`,
    `Date & Time: ${booking.eventDetails?.eventDate} at ${booking.eventDetails?.eventTime}`,
    `Quantity: ${booking.quantity} * ${booking.ticketType || 'Standard'}`,
    `Location: ${booking.eventDetails?.venue || booking.eventDetails?.location || 'TBA'}`,
    `Booked By: ${booking.userDetails?.userName || booking.userDetails?.name || 'Guest'}`
  ].join('\n');

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(qrData)}`;

  const getBase64Image = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Failed to fetch image for dataURL conversion, falling back to original URL", e);
      return url;
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      const targetElement = ticketRef.current;
      if (!targetElement) return;

      // 1. Pre-load all images as data URLs to avoid CORS "tainted canvas" errors
      const images = Array.from(targetElement.querySelectorAll('img'));
      const originalSrcs = new Map<HTMLImageElement, string>();

      // Wait for all images to be converted to data URLs
      await Promise.all(images.map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
          // Check if image is already loaded
          if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }

          originalSrcs.set(img, img.src);
          const dataUrl = await getBase64Image(img.src);

          // Only update if we got a valid data URL
          if (dataUrl.startsWith('data:')) {
            img.src = dataUrl;
            // Wait for this specific image to re-load as data URL
            await new Promise((resolve) => {
              const check = () => {
                if (img.complete) resolve(null);
                else setTimeout(check, 50);
              };
              check();
            });
          }
        }
      }));

      // Final wait for any pending layout shifts
      await new Promise(resolve => setTimeout(resolve, 300));

      // Temporarily remove shadow/border to prevent artifacts
      const originalStyle = targetElement.style.cssText;
      targetElement.style.boxShadow = 'none';
      targetElement.style.border = 'none';
      targetElement.style.borderRadius = '32px';

      const dataUrl = await toPng(targetElement, {
        pixelRatio: 2,
        cacheBust: false,
        backgroundColor: isDark ? '#121418' : '#ffffff',
        style: {
          margin: '0',
          padding: '0',
          transform: 'scale(1)',
        }
      });

      // Restore original styles and sources
      targetElement.style.cssText = originalStyle;
      originalSrcs.forEach((src, img) => {
        img.src = src;
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Ticket_${displayBookingId.slice(-6).toUpperCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert("Failed to save ticket due to browser security restrictions. Please take a screenshot of this page instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  const bgClass = isDark ? 'bg-[#121418] text-white' : 'bg-white text-[#111]';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-white/5' : 'border-gray-100';

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="min-h-full flex flex-col items-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-[480px] flex flex-col gap-4 animate-in zoom-in-95 duration-300 my-auto px-4"
          onClick={e => e.stopPropagation()}
        >
        {/* Ticket Wrapping Container */}
        <div
          ref={ticketRef}
          data-export="card"
          className={`w-full max-w-[440px] mx-auto rounded-[32px] shadow-2xl flex flex-col ${bgClass} relative border ${borderColor} overflow-hidden`}
        >
          {/* Header Section */}
          <div className={`p-4 sm:p-8 flex items-start flex-row border-b ${borderColor} ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>

            <div className="w-24 h-32 sm:w-28 sm:h-40 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg bg-white/5 mr-5 sm:mr-7 ticket-img-container">
              <img
                src={getEventImage(booking.eventDetails, booking.qrPayload)}
                alt={booking.eventDetails?.eventName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>

            <div className="flex-1 min-w-0 pt-1 flex flex-col justify-between h-full">
              <div className="flex flex-col mb-4">
                {/* Badge Inline rather than absolute to prevent shifting */}
                <div className={`inline-flex w-fit h-8 px-3 mb-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-[#8860D9]/90' : 'bg-black/5 border-black/20 text-[#8860D9]'} items-center justify-center font-mono text-[11px] font-bold uppercase tracking-widest leading-none`}>
                  #{displayBookingId.slice(-8).toUpperCase()}
                </div>

                <h2 className={`text-xl sm:text-2xl font-bold leading-normal pb-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
                  {booking.eventDetails?.eventName}
                </h2>
              </div>

              <div className={`flex items-center flex-row ${isDark ? 'text-gray-300' : 'text-gray-600'} text-[12px] font-semibold`}>
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#8860D9]/10 border border-[#8860D9]/20 shrink-0 mr-2 overflow-visible">
                  <Ticket className="w-3.5 h-3.5 text-[#8860D9]" />
                </div>
                <span className="break-words leading-relaxed py-0.5">Entry Pass for {booking.quantity || '1'} {booking.ticketType || 'Person'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-6">

              <div className="flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#8860D9] flex flex-row items-center mb-2 pb-0.5 overflow-visible">
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  DATE & TIME
                </div>
                <div className={`pl-[22px] ${isDark ? 'text-white' : 'text-black'}`}>
                  <div className="text-[14px] font-bold uppercase leading-relaxed pb-0.5">
                    {booking.eventDetails?.eventDate || 'Date TBA'}
                  </div>
                  <div className="text-[12px] font-semibold mt-0.5 pb-0.5 text-[#8860D9]/80 leading-relaxed">{booking.eventDetails?.eventTime || 'Time TBA'}</div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#8860D9] flex flex-row items-center mb-2 pb-0.5 overflow-visible">
                  <MapPin className="w-3.5 h-3.5 mr-2" />
                  VENUE
                </div>
                <div className={`pl-[22px] ${isDark ? 'text-white' : 'text-black'}`}>
                  <div className="text-[14px] font-bold leading-relaxed pb-0.5">
                    {booking.eventDetails?.venue || booking.eventDetails?.location || 'Venue TBA'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#8860D9] flex flex-row items-center mb-2 pb-0.5 overflow-visible">
                  <User className="w-3.5 h-3.5 mr-2" />
                  BOOKED BY
                </div>
                <div className={`pl-[22px] ${isDark ? 'text-white' : 'text-black'}`}>
                  <div className="text-[14px] font-bold capitalize leading-relaxed pb-0.5 break-words">
                    {booking.userDetails?.userName || booking.userDetails?.name || 'Guest User'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#8860D9] flex flex-row items-center mb-2 pb-0.5 overflow-visible">
                  <Ticket className="w-3.5 h-3.5 mr-2" />
                  QUANTITY
                </div>
                <div className={`pl-[22px] ${isDark ? 'text-white' : 'text-black'}`}>
                  <div className="text-[14px] font-bold leading-relaxed pb-0.5">
                    {booking.quantity || '1'} <span className="text-[#8860D9] font-bold mx-1">×</span> <span className="capitalize">{booking.ticketType || 'Pass'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-4 sm:my-6 h-px w-full border-t border-dashed opacity-40 border-gray-400" />

            <div className="flex flex-row items-center justify-between">
               <div className="flex-1">
                  <div className={`text-[11px] uppercase font-bold tracking-widest ${mutedText} opacity-70 mb-1 pb-0.5`}>Total Amount</div>
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'} flex flex-row items-baseline mb-2 pb-1`}>
                    <span className="text-xl font-semibold opacity-80 mr-1">₹</span>
                    <span>{(booking.totalAmount || booking.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className={`text-[11px] font-bold flex flex-row items-center ${mutedText} opacity-80 uppercase tracking-wide pb-0.5`}>
                    <CheckCircle2 className="w-4 h-4 text-[#8860D9] mr-1.5 overflow-visible" />
                    <span>ALL TAXES INCLUDED</span>
                  </div>
               </div>

               <div className={`p-0.5 rounded-lg ${isDark ? 'bg-white' : 'bg-black/5'} qr-container-target`}>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-24 h-24 object-contain block"
                    crossOrigin="anonymous"
                  />
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center w-full mt-2">
          <RippleButton
            variant="outline"
            onClick={onClose}
            className="flex-1 !h-14 !rounded-2xl font-semibold mr-3"
          >
            Cancel
          </RippleButton>
          <RippleButton
            variant="primary"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 !h-14 !rounded-2xl font-bold bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] shadow-lg shadow-[#8860D9]/20 border-none"
          >
            <div className="flex items-center justify-center flex-row">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin mr-2.5" /> : <Download className="w-5 h-5 mr-2.5" />}
              <span>{isDownloading ? 'SAVING...' : 'SAVE TICKET'}</span>
            </div>
          </RippleButton>
        </div>
      </div>
    </div>
  </div>
  );
}
