'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { getUserBookings, getUserCancelledBookings, Booking, CancelledBooking, markAsRead, getUnreadCount } from '@/services/transactionService';
import SideBar from "@/components/home/SideBar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from '@/components/home/ThemeContext';
import BookingSkeleton from '@/components/skeletons/BookingSkeleton';
import { getEventImage } from '@/utils/helpers';
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

// Constants for maintainability
const BOOKING_STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  COMPLETED: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  PENDING:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  VERIFIED:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DEFAULT:   'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

const FILTER_TABS = [
  { id: 'all', label: 'all' },
  { id: 'confirmed', label: 'confirmed' },
  { id: 'completed', label: 'completed' },
  { id: 'pending', label: 'pending' },
  { id: 'cancelled', label: 'cancelled' },
] as const;

const LAYOUT = {
  SIDEBAR_EXPANDED_WIDTH: '281px',
  SIDEBAR_COLLAPSED_WIDTH: '92px',
  BACKGROUND_DARK: '#0C1014',
  TEXT_MUTED: '#6B7280',
};

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
  const [unreadCounts, setUnreadCounts] = useState({ confirmed: 0, pending: 0, cancelled: 0 });

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

      // Fetch unread count
      const unreadRes = await getUnreadCount();
      if (unreadRes.success && unreadRes.data) {
        setUnreadCounts({
          confirmed: unreadRes.data.confirmed || 0,
          pending: unreadRes.data.pending || 0,
          cancelled: unreadRes.data.cancelled || 0
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
      console.error(err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialLoading) return;

    let statusesToClear: string[] = [];
    if (filter === 'confirmed' && unreadCounts.confirmed > 0) statusesToClear = ['CONFIRMED', 'VERIFIED'];
    else if (filter === 'cancelled' && unreadCounts.cancelled > 0) statusesToClear = ['CANCELLED'];
    else if (filter === 'pending' && unreadCounts.pending > 0) statusesToClear = ['PENDING'];
    else if (filter === 'all' && (unreadCounts.confirmed > 0 || unreadCounts.cancelled > 0 || unreadCounts.pending > 0)) {
       statusesToClear = ['CONFIRMED', 'VERIFIED', 'CANCELLED', 'PENDING'];
    }

    if (statusesToClear.length > 0) {
      markAsRead({ statuses: statusesToClear })
        .then(() => {
          if (filter === 'all') {
            setUnreadCounts({ confirmed: 0, pending: 0, cancelled: 0 });
          } else {
            setUnreadCounts(prev => ({ ...prev, [filter]: 0 }));
          }

          setBookings(prev => prev.map(b => statusesToClear.includes(b.bookingStatus) ? { ...b, isRead: true } : b));
          if (statusesToClear.includes('CANCELLED')) {
             setCancelledBookings(prev => prev.map(b => ({ ...b, isRead: true } as CancelledBooking)));
          }
        })
        .catch(console.error);
    }
  }, [filter, isInitialLoading, unreadCounts]);

  const isEventCompleted = (booking: any): boolean => {
    const activeStatuses = ['CONFIRMED', 'VERIFIED'];
    if (!activeStatuses.includes(booking.bookingStatus)) return false;

    const event = booking.eventDetails;
    const endDateStr = event?.eventEndDate || event?.eventDate;
    if (!endDateStr) return false;
    try {
      const eventEnd = new Date(endDateStr);
      if (isNaN(eventEnd.getTime())) return false;
      eventEnd.setHours(23, 59, 59, 999);
      return eventEnd < new Date();
    } catch {
      return false;
    }
  };

  const getDisplayStatus = (booking: any): string => {
    if (isEventCompleted(booking)) return 'COMPLETED';
    return booking.bookingStatus;
  };

  const getStatusStyle = (status: string) => {
    return BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES.DEFAULT;
  };

  const filteredBookings = (filter === 'all'
    ? [...bookings, ...cancelledBookings]
    : filter === 'cancelled' ? cancelledBookings
    : filter === 'completed' ? bookings.filter(b => isEventCompleted(b))
    : filter === 'confirmed' ? bookings.filter(b => (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'VERIFIED') && !isEventCompleted(b))
    : bookings.filter(b => b.bookingStatus === filter.toUpperCase())
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
        className="min-h-screen relative overflow-hidden transition-colors duration-300"
        style={{ background: isDark ? LAYOUT.BACKGROUND_DARK : themeStyles.background }}
      >
        <SideBar />
        <main
          className="flex-1 transition-all duration-300 relative z-10"
          style={{
            marginLeft: isMobile ? "0" : (isCollapsed ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH : LAYOUT.SIDEBAR_EXPANDED_WIDTH)
          }}
        >
          <BookingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{ background: isDark ? LAYOUT.BACKGROUND_DARK : themeStyles.background }}
    >

      <SideBar />

      <main
        className="flex-1 transition-all duration-300 relative z-10"
        style={{ marginLeft: isMobile ? "0" : (isCollapsed ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH : LAYOUT.SIDEBAR_EXPANDED_WIDTH) }}
      >


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: themeStyles.text }}>My Bookings</h1>
            <p
              className="max-w-2xl text-sm"
              style={{ color: LAYOUT.TEXT_MUTED }}
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
              {FILTER_TABS.map((tab) => {
                const count = tab.id === 'confirmed' ? unreadCounts.confirmed :
                              tab.id === 'cancelled' ? unreadCounts.cancelled :
                              tab.id === 'pending' ? unreadCounts.pending : 0;
                return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex-grow px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all border relative ${
                    filter === tab.id ? activeTabClass : inactiveTabClass
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] text-white animate-pulse font-bold">
                      {count}
                    </span>
                  )}
                </button>
              )})}
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

                {/* Hybrid Table/Card View */}
                <div className="w-full">
                  <div className="space-y-4 lg:space-y-2">
                    {/* Table Header (Desktop only) */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                      <div className="col-span-4">Event Details</div>
                      <div className="col-span-2">Date & Time</div>
                      <div className="col-span-2">Venue</div>
                      <div className="col-span-1">Ticket</div>
                      <div className="col-span-1 text-right">Amount</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>

                    {/* Body */}
                    <div className="space-y-4 lg:space-y-2">
                      {filteredBookings.map((booking) => (
                        <BookingRow
                          key={booking.id}
                          booking={booking}
                          type={booking.bookingStatus === 'CANCELLED' ? 'cancelled' : 'active'}
                          getStyle={getStatusStyle}
                          displayStatus={getDisplayStatus(booking)}
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Empty State Check */}
                {filteredBookings.length === 0 && (
                   <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl animate-in fade-in duration-1000">
                    <div className="w-24 h-24 bg-[#8860D9]/10 border border-[#8860D9]/20 rounded-full flex items-center justify-center mb-6 relative">
                      <Ticket className="w-12 h-12 text-[#8860D9]" />
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

function BookingRow({ booking, type, getStyle, displayStatus, onClick }: any) {
  const { themeStyles, theme } = useTheme();
  const isDark = theme === 'dark';
  const isCancelled = type === 'cancelled' || booking.bookingStatus === 'CANCELLED';
  const event = booking.eventDetails;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isDark ? 'hover:bg-white/5 border-white/5 bg-[#15191D]/40' : 'hover:bg-black/5 border-black/5 bg-white'
      } ${isCancelled ? 'opacity-70' : ''}`}
    >
      {/* Desktop Layout (Table Row) */}
      <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-6 py-6">
        {/* Event Details */}
        <div className="col-span-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
            <img
              src={getEventImage(event, booking.qrPayload)}
              alt={event?.eventName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate" style={{ color: themeStyles.text }}>
              {event?.eventName || 'Untitled Event'}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: themeStyles.text }}>
              #{booking.bookingId?.slice(-8) || booking.id?.slice(-8)}
            </p>
          </div>
          {!booking.isRead && booking.bookingStatus === 'CONFIRMED' && (
            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_10px_rgba(136,96,217,0.5)]"></div>
          )}
        </div>

        {/* Date & Time */}
        <div className="col-span-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: themeStyles.text }}>
              <Calendar className="w-3.5 h-3.5 opacity-40" />
              <span>{event?.eventDate || 'TBD'}</span>
            </div>
            {event?.eventTime && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-40" style={{ color: themeStyles.text }}>
                <Clock className="w-3.5 h-3.5" />
                <span>{event?.eventTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Venue */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold truncate" style={{ color: themeStyles.text }}>
            <MapPin className="w-3.5 h-3.5 opacity-40 shrink-0" />
            <span className="truncate">{event?.venue || 'Virtual/TBD'}</span>
          </div>
        </div>

        {/* Ticket Type */}
        <div className="col-span-1">
          <span className="text-[10px] font-bold opacity-40" style={{ color: themeStyles.text }}>
            {booking.ticketType}
          </span>
        </div>

        {/* Amount */}
        <div className="col-span-1 text-right">
          <p className="font-bold text-base" style={{ color: themeStyles.text }}>
            ₹{(isCancelled && booking.refundAmount > 0 ? booking.refundAmount : booking.totalAmount)?.toLocaleString()}
          </p>
          <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter" style={{ color: themeStyles.text }}>
            {booking.quantity}x tickets
          </p>
        </div>

        {/* Status */}
        <div className="col-span-2 flex justify-end items-center">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border tracking-wider capitalize ${getStyle(displayStatus)}`}>
            {displayStatus.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Mobile Layout (Card View) */}
      <div className="block lg:hidden p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
              <img
                src={getEventImage(event, booking.qrPayload)}
                alt={event?.eventName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight" style={{ color: themeStyles.text }}>
                {event?.eventName || 'Untitled Event'}
              </h3>
              <p className="text-[10px] font-bold opacity-40 mt-0.5">
                ORDER #{booking.bookingId?.slice(-8) || booking.id?.slice(-8)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border capitalize ${getStyle(displayStatus)}`}>
            {displayStatus.toLowerCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Date & Time</p>
            <p className="text-xs font-bold" style={{ color: themeStyles.text }}>
              {event?.eventDate} <span className="opacity-30 mx-1">•</span> {event?.eventTime || 'TBD'}
            </p>
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Venue</p>
            <p className="text-xs font-bold truncate" style={{ color: themeStyles.text }}>
              {event?.venue || 'Virtual/TBD'}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <div>
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">{booking.ticketType} ({booking.quantity}x)</p>
            <p className="text-xl font-bold" style={{ color: themeStyles.text }}>
              ₹{(isCancelled && booking.refundAmount > 0 ? booking.refundAmount : booking.totalAmount)?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#8860D9]/0 via-[#8860D9]/5 to-[#8860D9]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
