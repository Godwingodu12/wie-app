'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getUserBookings, getUserCancelledBookings, Booking, CancelledBooking } from '@/services/transactionService';
import SideBar from "@/components/home/SideBar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from '@/components/home/ThemeContext';
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
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function BookingsPage() {
  return (
    <SidebarProvider>
      <BookingsContent />
    </SidebarProvider>
  );
}

function BookingsContent() {
  useAuth(true);
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<CancelledBooking[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const [regularRes, cancelledRes] = await Promise.all([
        getUserBookings({ limit: 100 }),
        getUserCancelledBookings(),
      ]);

      const regular = regularRes.data.bookings || [];
      const cancelled = cancelledRes.data.cancelledBookings || [];
      
      setBookings(regular.filter((b: any) => b.bookingStatus !== 'CANCELLED'));
      setCancelledBookings(cancelled);
      setPendingRefundsCount(
        cancelled.filter((b: any) => b.refundStatus && b.refundStatus !== 'COMPLETED' && b.refundAmount > 0).length
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
      console.error(err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PENDING':   return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CANCELLED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'VERIFIED':  return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:          return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  };

  const filteredBookings = (filter === 'all' 
    ? [...bookings, ...cancelledBookings]
    : filter === 'cancelled' ? cancelledBookings : bookings.filter(b => b.bookingStatus === filter.toUpperCase())
  ).filter((booking) => {
    const matchesSearch =
      (booking.eventDetails?.eventName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (booking.bookingId?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeTabClass = isDark
    ? "bg-white/10 text-white shadow-xl shadow-white/5 border-white/10"
    : "bg-indigo-600 text-white shadow-lg border-indigo-700";
  const inactiveTabClass = isDark
    ? "text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent"
    : "text-gray-500 hover:text-gray-900 border-transparent";

  if (isInitialLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: themeStyles.background }}
      >
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <Loader2 className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{ background: isDark ? '#0C1014' : themeStyles.background }}
    >

      <SideBar />

      <main
        className="flex-1 transition-all duration-300 relative z-10"
        style={{ marginLeft: isMobile ? "0" : (isCollapsed ? "92px" : "281px") }}
      >


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: themeStyles.text }}>My Bookings</h1>
            <p
              className="max-w-2xl text-sm"
              style={{ color: isDark ? "#6B7280" : "#6B7280" }}
            >
              Manage your event tickets, track refunds, and relive your favorite moments.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
            {/* Search Box */}
            <div className="lg:col-span-8 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search
                  className="h-5 w-5 transition-colors"
                  style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}
                />
              </div>
              <input
                type="text"
                placeholder="Search events or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#8860D9]/50 focus:border-[#8860D9]/50 outline-none text-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
              />
            </div>

            {/* Filter Tabs */}
            <div
              className="lg:col-span-4 flex flex-nowrap overflow-x-auto gap-1 items-center p-1 rounded-xl transition-colors scrollbar-none"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                scrollbarWidth: 'none',
              }}
            >
              {['all', 'confirmed', 'pending', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-grow px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all border ${
                    filter === tab ? activeTabClass : inactiveTabClass
                  }`}
                >
                  {tab}
                  {tab === 'cancelled' && pendingRefundsCount > 0 && (
                    <span className="ml-1.5 px-1 py-0.5 rounded-md bg-rose-500 text-[8px] text-white animate-pulse font-bold">
                      {pendingRefundsCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
              <button
                onClick={loadBookings}
                className="ml-auto p-2 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Retry loading"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Content Lists */}
          <div className="space-y-6 relative min-h-[400px]">
            <div className="transition-all duration-500 opacity-100">
              <div className="space-y-4">
                {/* Unified List Header */}
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: themeStyles.text }}>
                    {filter === 'cancelled' ? (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        Cancelled Events
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 text-[#8860D9]" />
                        {filter === 'all' ? 'Your Schedule' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`}
                      </>
                    )}
                  </h2>
                </div>

                {/* Unified Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type={booking.bookingStatus === 'CANCELLED' ? 'cancelled' : 'active'}
                      getStyle={getStatusStyle}
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                    />
                  ))}
                </div>

                {/* Empty State Check */}
                {filteredBookings.length === 0 && (
                   <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl animate-in fade-in duration-1000">
                    <div className="w-24 h-24 bg-[#8860D9]/10 border border-[#8860D9]/20 rounded-full flex items-center justify-center mb-6 relative">
                      <Loader2 className="w-12 h-12 text-[#8860D9] animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">No events found</h3>
                    <p className="text-sm opacity-50 mb-8 max-w-xs text-center" style={{ color: themeStyles.textSecondary }}>
                      {searchQuery ? `No matches for "${searchQuery}"` : "You haven't made any bookings in this category yet."}
                    </p>
                    <button
                      onClick={() => router.push('/events/nearby')}
                      className="bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-90 text-white px-8 h-14 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-[#8860D9]/20 transition-all border-none"
                    >
                      Browse Events
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BookingCard({ booking, type, getStyle, onClick }: any) {
  const { themeStyles, theme } = useTheme();
  const isDark = theme === 'dark';
  const isCancelled = type === 'cancelled' || booking.bookingStatus === 'CANCELLED';
  const event = booking.eventDetails;

  return (
    <Card
      onClick={onClick}
      className={`group relative p-6 rounded-xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-[#15191D]/80 border-white/5' : 'bg-white border-black/5'} ${isCancelled ? 'hover:bg-gray-500/[0.02]' : 'hover:bg-[#8860D9]/[0.02]'}`}
      style={{ background: themeStyles.cardBg }}
    >
      {/* Visual Accents */}
      {!isCancelled && (
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity duration-500 group-hover:opacity-100 opacity-60 ${isCancelled ? 'from-gray-500/40' : 'from-[#8860D9]/40'} to-transparent blur-3xl rounded-full -mr-10 -mt-10`} />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className={`text-lg font-bold transition-colors leading-tight ${isCancelled ? 'opacity-70 group-hover:text-gray-400' : 'group-hover:text-[#8860D9]'}`}
              style={{ color: themeStyles.text }}
            >
              {event?.eventName || 'Untitled Event'}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-widest ${getStyle(booking.bookingStatus)}`}>
              {booking.bookingStatus}
            </span>
          </div>
          <span
            className="text-[10px] font-bold mt-1.5 flex-shrink-0"
            style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
          >
             #{booking.bookingId?.slice(-8) || booking.id?.slice(-8)}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-xs font-bold" style={{ color: themeStyles.textSecondary }}>
            <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }} />
            </div>
            <span>{event?.eventDate || 'Date TBD'}</span>
            {event?.eventTime && (
              <>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
                <span>{event?.eventTime}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold" style={{ color: themeStyles.textSecondary }}>
            <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }} />
            </div>
            <span className="whitespace-normal break-words leading-snug">{event?.venue || 'Virtual/TBD'}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold" style={{ color: themeStyles.textSecondary }}>
            <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
              <Ticket className="w-3.5 h-3.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }} />
            </div>
            <span>{booking.ticketType} • {booking.quantity}x</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
          <div>
            <p
              className="text-[10px] font-bold mb-0.5 tracking-widest"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
            >
              {isCancelled && booking.refundAmount > 0 ? "Refund Status" : "Amount Paid"}
            </p>
            {isCancelled && booking.refundAmount > 0 ? (
              <p className={`text-lg font-bold ${booking.refundStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                ₹{booking.refundAmount} • {booking.refundStatus?.toLowerCase()}
              </p>
            ) : (
              <p className="text-2xl font-bold" style={{ color: themeStyles.text }}>
                ₹{booking.totalAmount?.toLocaleString()}
              </p>
            )}
          </div>

          <div className={`p-4 rounded-xl transition-all duration-300 ${isCancelled ? 'bg-gray-500 text-white shadow-gray-500/20' : 'bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] text-white shadow-[#8860D9]/20 font-bold'}`}>
            {isCancelled ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              booking.bookingStatus === 'CONFIRMED' && booking.qrCode ? (
                <QrCode className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
