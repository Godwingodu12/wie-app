'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBookingById, cancelBooking, Booking } from '@/services/transactionService';
import SideBar from "@/components/home/SideBar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from '@/components/home/ThemeContext';
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Ticket,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import CalendarIcon from '@/assets/Event/CalenderIcon.svg';
import LocationIcon from '@/assets/Event/LocationIcon.svg';

export default function BookingDetailPage({ params }: { params: { bookingId: string } }) {
  const bookingId = params.bookingId;
  return (
    <SidebarProvider>
      <BookingDetailContent bookingId={bookingId} />
    </SidebarProvider>
  );
}

function BookingDetailContent({ bookingId }: { bookingId: string }) {
  useAuth(true);
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();

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
    link.download = `ticket-${bookingId.slice(-6)}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors duration-300"
        style={{ background: themeStyles.background, color: themeStyles.text }}
      >
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#8860D9] animate-spin" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors duration-300"
        style={{ background: themeStyles.background, color: themeStyles.text }}
      >
        <SideBar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 bg-rose-500/10 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="mb-8 max-w-sm" style={{ color: themeStyles.textSecondary }}>
            We couldn't find the booking you're looking for. It might have been deleted or doesn't exist.
          </p>
          <Button
            onClick={() => router.push('/bookings')}
            className="bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-90 text-white px-8 rounded-xl h-12 transition-all shadow-xl shadow-[#8860D9]/20"
          >
            Back to All Bookings
          </Button>
        </div>
      </div>
    );
  }

  const isConfirmed = booking.bookingStatus === 'CONFIRMED';
  const isCancelled = booking.bookingStatus === 'CANCELLED';
  const isAdminCancelled = booking.cancellationReason?.toLowerCase().includes('event cancelled') ||
                          booking.cancellationReason?.toLowerCase().includes('host');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-300 pb-20"
      style={{ background: isDark ? '#0C1014' : themeStyles.background, color: themeStyles.text }}
    >
      {/* Clean dark bg — no colour overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: isDark ? 'radial-gradient(ellipse at top right, rgba(255,255,255,0.02) 0%, transparent 60%)' : 'radial-gradient(ellipse at top right, rgba(0,0,0,0.03) 0%, transparent 60%)' }} />

      <SideBar />

      <div className={`transition-all duration-300 relative z-10`} style={{ marginLeft: isMobile ? "0" : (isCollapsed ? "92px" : "281px") }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex flex-row items-center justify-between gap-4 mb-8">
            <button
              onClick={() => router.push('/bookings')}
              className={`flex items-center gap-2 transition-all group`}
              style={{ color: themeStyles.textSecondary }}
            >
              <div className={`p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} group-hover:opacity-70 transition-all`}>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span className="font-bold text-sm tracking-tight transition-colors">My Bookings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Event Main Section */}
              <Card className="p-0 overflow-hidden border-white/5">
                <div className="p-5 sm:p-8">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 sm:mb-8">
                    <div className="w-full">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                            {booking.eventDetails.eventName}
                          </h1>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border ${getStatusStyle(booking.bookingStatus)}`}>
                            {booking.bookingStatus}
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-black/5 border-black/5 text-gray-500'} font-mono text-xs font-bold`}>
                          #{bookingId.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 sm:gap-y-6">
                    <div className="space-y-4 sm:space-y-5">
                      {/* Date */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'} shrink-0`}>
                            <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                          </div>
                          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black opacity-60'}`}>Date</p>
                        </div>
                        <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:ml-auto`}>
                          {booking.eventDetails.eventDate}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'} shrink-0`}>
                            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                          </div>
                          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black opacity-60'}`}>Time</p>
                        </div>
                        <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:ml-auto`}>
                          {booking.eventDetails.eventTime}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-5">
                      {/* Location */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'} shrink-0`}>
                            <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                          </div>
                          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black opacity-60'}`}>Location</p>
                        </div>
                        <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:ml-auto break-words max-w-[200px] sm:max-w-none text-right`}>
                          {booking.eventDetails.venue || 'TBA'}
                        </p>
                      </div>

                      {/* Tickets */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'} shrink-0`}>
                            <Ticket className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                          </div>
                          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black opacity-60'}`}>Tickets</p>
                        </div>
                        <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:ml-auto`}>
                          {booking.quantity} {booking.ticketType || 'Adults'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isAdminCancelled && (
                  <div className="bg-rose-500/5 border-t border-rose-500/10 p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-rose-500">Event Cancelled by Host</h4>
                      <p className={`text-sm ${themeStyles.textSecondary} mt-1`}>
                        This event has been cancelled. A full refund has been initiated and will reflect in your account within 5-7 business days.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Payment Info */}
              <Card className="p-5 sm:p-8">
                <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                  Payment Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className={`${themeStyles.textSecondary} opacity-70`}>Subtotal ({booking.quantity} tickets)</span>
                    <span className="font-bold font-mono">₹{booking.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className={`${themeStyles.textSecondary} opacity-70`}>GST (18%)</span>
                    <span className="font-bold font-mono">₹{booking.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm pb-4">
                    <span className={`${themeStyles.textSecondary} opacity-70`}>Platform Fee</span>
                    <span className="font-bold font-mono">₹{booking.platformFee.toLocaleString()}</span>
                  </div>
                  <div className={`pt-6 border-t ${themeStyles.border} flex items-center justify-between`}>
                    <span className="text-sm sm:text-lg font-bold">Total Amount Paid</span>
                    <span className="text-2xl sm:text-3xl font-bold text-[#8860D9] font-mono text-right">
                      ₹{booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {isCancelled && !isAdminCancelled && (
                <Card className="p-5 sm:p-8 border-rose-500/20 bg-rose-500/5">
                  <h2 className="text-lg sm:text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
                    <XCircle className="w-6 h-6 shrink-0" />
                    Cancellation Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary} opacity-60 mb-1`}>Reason</p>
                      <p className="font-bold text-sm sm:text-base leading-relaxed">{booking.cancellationReason || 'No reason provided'}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-8">
              {/* Ticket/QR Section */}
              {isConfirmed && booking.qrCode && (
                <Card className="p-0 overflow-hidden border-indigo-500/20">
                  <div className="p-8 pb-4 text-center">
                    <div className="relative group mx-auto max-w-[200px] mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-[#8860D9] to-fuchsia-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                      <div className="relative bg-white p-3 rounded-xl border border-black/5">
                        <img
                          src={booking.qrCode}
                          alt="Ticket QR Code"
                          className="w-full aspect-square object-contain"
                        />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl mb-1">Entry Ticket</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary} opacity-60`}>
                      Scan this at the venue entry
                    </p>
                  </div>
                  <div className="p-5 sm:p-8 pt-4">
                    <Button
                      onClick={downloadQRCode}
                      className="w-full h-14 bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-90 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#8860D9]/20 transition-all border-none"
                    >
                      <Download className="w-6 h-6" />
                      Save Ticket
                    </Button>
                    <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Verified QR Code</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {isConfirmed && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className={`w-full group flex items-center justify-between p-6 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/5'} hover:bg-[#8860D9]/10 hover:border hover:border-[#8860D9]/30 transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-[#8860D9]/10 text-[#8860D9] group-hover:scale-110 transition-transform">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg tracking-tight">Cancel Ticket</p>
                        <p className={`text-xs opacity-60`} style={{ color: themeStyles.textSecondary }}>Request a refund</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                  </button>
                )}

                <button
                  onClick={() => router.push('/events/nearby')}
                  className={`w-full group flex items-center justify-between p-5 rounded-xl transition-all hover:opacity-70`}
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={CalendarIcon.src}
                      className="w-6 h-6 flex-shrink-0"
                      style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(74%) saturate(3025%) rotate(245deg) brightness(98%) contrast(98%)' }}
                    />
                    <div className="text-left">
                      <p className="font-bold">More Events</p>
                      <p className="text-xs opacity-50" style={{ color: themeStyles.textSecondary }}>Discover what's next</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-60 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className={`max-w-md w-full p-6 sm:p-8 border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#8860D9]/10 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#8860D9]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: themeStyles.text }}>Cancel Ticket?</h2>
            </div>
            <p className={`${themeStyles.textSecondary} text-sm sm:text-base mb-6 leading-relaxed`}>
              Are you sure you want to cancel this booking? You will receive a refund of <span className="font-bold text-[#8860D9]">₹{booking.subtotal.toLocaleString()}</span>. Platform fees are non-refundable.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Reason (Required)</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Change of plans..."
                  className={`w-full px-5 py-4 rounded-xl border ${themeStyles.border} bg-black/5 dark:bg-white/5 focus:ring-2 focus:ring-[#8860D9] focus:outline-none transition-all resize-none h-32`}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  className={`flex-1 h-12 sm:h-14 rounded-xl font-bold bg-transparent border-black/10 dark:border-white/10 text-gray-400 hover:bg-black/5 dark:hover:bg-white/5`}
                  disabled={isCancelling}
                >
                  No, Keep it
                </Button>
                <Button
                  onClick={handleCancelBooking}
                  disabled={isCancelling || !cancellationReason.trim()}
                  className="flex-1 h-12 sm:h-14 bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-90 text-white rounded-xl font-bold shadow-xl shadow-[#8860D9]/20"
                >
                  {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Cancel"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
