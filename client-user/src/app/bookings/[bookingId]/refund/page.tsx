'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { trackRefund } from '@/services/transactionService';
import SideBar from "@/components/home/SideBar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from '@/components/home/ThemeContext';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  IndianRupee,
  Calendar,
  Ticket,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  MapPin,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import RefundSkeleton from '@/components/skeletons/RefundSkeleton';

const LAYOUT = {
  SIDEBAR_EXPANDED_WIDTH: '281px',
  SIDEBAR_COLLAPSED_WIDTH: '92px',
  BACKGROUND_DARK: '#0C1014',
};

export default function RefundTrackingPage() {
  return (
    <SidebarProvider>
      <RefundTrackingContent />
    </SidebarProvider>
  );
}

function RefundTrackingContent() {
  useAuth(true);
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [refundData, setRefundData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRefundData();
  }, [bookingId]);

  const loadRefundData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trackRefund(bookingId);
      setRefundData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refund details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRefundData();
    setRefreshing(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />,
          title: 'Refund Disbursed',
          message: 'Your funds have been successfully returned to your original payment method.',
          variant: 'success',
          accent: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          glow: 'shadow-emerald-500/10'
        };
      case 'PROCESSING':
        return {
          icon: <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-[#8860D9]" />,
          title: 'Processing Refund',
          message: 'Our financial partners are currently processing your request. Please allow 5-7 business days.',
          variant: 'processing',
          accent: 'text-[#8860D9]',
          bg: 'bg-[#8860D9]/10',
          border: 'border-[#8860D9]/20',
          glow: 'shadow-[#8860D9]/10'
        };
      case 'FAILED':
        return {
          icon: <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500" />,
          title: 'Action Required',
          message: 'We encountered an issue with the automated refund. Our support team is assisting manually.',
          variant: 'error',
          accent: 'text-rose-500',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          glow: 'shadow-rose-500/10'
        };
      default:
        return {
          icon: <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />,
          title: 'Refund Initiated',
          message: 'Your refund request has been logged and is awaiting bank verification.',
          variant: 'pending',
          accent: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          glow: 'shadow-gray-400/10'
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors duration-300"
        style={{ background: isDark ? LAYOUT.BACKGROUND_DARK : themeStyles.background, color: themeStyles.text }}
      >
        <SideBar />
        <div
          className="flex-1 transition-all duration-300 relative z-10"
          style={{ paddingLeft: isMobile ? "0" : (isCollapsed ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH : LAYOUT.SIDEBAR_EXPANDED_WIDTH) }}
        >
          <RefundSkeleton />
        </div>
      </div>
    );
  }

  if (error || !refundData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 lg:p-0"
        style={{ background: isDark ? '#0C1014' : themeStyles.background }}
      >
        <div className="max-w-md w-full">
          <Card className="p-8 sm:p-12 text-center flex flex-col items-center">
            <div className="p-5 bg-rose-500/10 rounded-2xl mb-6">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Sync Issue</h2>
            <p className="opacity-60 mb-8 leading-relaxed" style={{ color: themeStyles.textSecondary }}>
              {error || 'Unable to fetch refund details at this time.'}
            </p>
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto px-10 py-4 bg-[#8860D9] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-[#8860D9]/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Booking
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const { booking, refundTransactions, refundSummary } = refundData;
  const refundStatus = refundSummary?.status ?? booking?.refundStatus ?? 'PENDING';
  const refundAmount = refundSummary?.refundAmount ?? booking?.refundAmount ?? 0;
  const refundId = refundSummary?.refundId ?? booking?.refundId ?? null;
  const processedAt = refundSummary?.refundProcessedAt ?? booking?.refundProcessedAt ?? null;
  const initiatedAt = refundSummary?.refundInitiatedAt ?? booking?.refundInitiatedAt ?? null;
  const isCompleted = refundStatus === 'COMPLETED';
  const isFailed = refundStatus === 'FAILED';
  const cfg = getStatusConfig(refundStatus);

  const steps = [
    { label: 'Booking Cancelled', done: true, time: booking?.cancelledAt },
    { label: 'Refund Initiated', done: !!initiatedAt, time: initiatedAt },
    { label: 'Verified by Bank', done: refundStatus === 'PROCESSING' || isCompleted, time: null },
    { label: 'Funds Disbursed', done: isCompleted, time: processedAt },
  ];

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-300 pb-24 lg:pb-12"
      style={{ background: isDark ? '#0C1014' : themeStyles.background, color: themeStyles.text }}
    >
      {!isDark && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at top right, rgba(136,96,217,0.05) 0%, transparent 50%)'
        }} />
      )}

      <SideBar />

      <div className={`transition-all duration-300 relative z-10 w-full`} style={{
        paddingLeft: isMobile ? "0" : (isCollapsed ? "92px" : "281px"),
      }}>
        <Header title="" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 lg:mt-10">
          {/* Back Action */}
          <button
            onClick={() => router.push(`/bookings/${bookingId}`)}
            className={`flex items-center gap-2.5 transition-all group mb-6 sm:mb-8 lg:mb-10`}
            style={{ color: themeStyles.textSecondary }}
          >
            <div className={`p-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/5'} group-hover:bg-[#8860D9]/10 group-hover:border-[#8860D9]/20 transition-all`}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-tight hidden sm:inline">Back to Booking</span>
            <span className="font-bold text-xs sm:text-sm tracking-tight sm:hidden">Back</span>
          </button>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">

              {/* Primary Status Card */}
              {/* Primary Status Card - Compact & Optimized */}
              <Card className={`p-5 sm:p-7 overflow-hidden relative border-white/5 shadow-2xl ${isDark ? '' : cfg.glow}`}>

                {/* Top Row: Hash ID & Encrypted Badge */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  {refundId ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                       <span className="text-[8px] sm:text-[9px] font-bold tracking-widest opacity-30 uppercase shrink-0">Hash ID</span>
                       <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg ${isDark ? 'bg-white/5 border border-white/5' : 'bg-black/5 border border-transparent'} font-mono text-[8px] sm:text-[9px] opacity-50 flex items-center gap-1.5 overflow-hidden`}>
                          <span className="truncate">{refundId}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(refundId)}
                            className="p-0.5 hover:text-[#8860D9] transition-colors shrink-0"
                            title="Copy ID"
                          >
                            <CreditCard className="w-2.5 h-2.5" />
                          </button>
                       </div>
                    </div>
                  ) : <div />}

                  <div className="self-start sm:self-auto flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] sm:text-[9px] font-bold tracking-wider">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ENCRYPTED
                  </div>
                </div>

                {/* Middle Row: Event Portrait & Status Info */}
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8">
                  <div className="relative shrink-0 w-32 sm:w-40 aspect-[3/4]">
                     {/* Glow effect */}
                    <div className={`absolute -inset-4 ${isDark ? 'bg-[#8860D9]/10' : 'bg-[#8860D9]/5'} rounded-[2rem] blur-2xl opacity-50`} />

                    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10">
                      <img
                        src={(booking?.eventDetails as any)?.event_portrait || (booking?.eventDetails as any)?.image || (booking?.eventDetails as any)?.event_banner || "/placeholder-event.jpg"}
                        alt="Event Portrait"
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center">
                    <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 mb-3">
                      <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">{cfg.title}</h1>
                    </div>

                    <p className="text-sm sm:text-base opacity-60 font-medium leading-relaxed max-w-xl mx-auto sm:mx-0" style={{ color: themeStyles.textSecondary }}>
                      {cfg.message}
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} border ${cfg.border} border-white/5 text-[10px] font-bold uppercase tracking-wider ${cfg.accent}`}>
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refundStatus}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Amount Label & Value */}
                <div className={`p-3.5 sm:p-4 rounded-xl ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-[#FAFBFF] border-[#8860D9]/10'} border flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#8860D9]/10 shrink-0">
                        <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8860D9]" />
                      </div>
                      <span className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase opacity-40">Total Reversal</span>
                    </div>

                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] sm:text-xs font-bold opacity-30">₹</span>
                      <span className="text-lg sm:text-2xl font-black tracking-tighter text-[#8860D9]">
                        {parseFloat(refundAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                </div>

                {/* Action Row - Refresh only if needed */}
                {!isCompleted && !isFailed && (
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-[#8860D9]/20 hover:bg-[#8860D9]/5'} transition-all font-bold text-[9px] tracking-tight bg-transparent`}
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#8860D9]' : ''}`} />
                      {refreshing ? 'Syncing...' : 'Refresh Status'}
                    </button>
                  </div>
                )}
              </Card>

              {/* Journey Timeline - Responsive Padding */}
              <Card className="p-5 sm:p-10 border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#8860D9]/10">
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-[#8860D9]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Timeline</h2>
                  </div>
                  <div className={`self-start sm:self-auto px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-bold tracking-[0.1em] uppercase ${cfg.bg} ${cfg.accent} border ${cfg.border}`}>
                    {refundStatus}
                  </div>
                </div>

                <div className="space-y-8 sm:space-y-10 relative before:absolute before:left-[15px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] sm:before:w-[3px] before:bg-gradient-to-b before:from-[#8860D9]/40 before:to-transparent">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-4 sm:gap-8 relative group">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                        step.done
                          ? 'bg-[#8860D9] shadow-xl shadow-[#8860D9]/30 ring-3 sm:ring-4 ring-[#8860D9]/10'
                          : `${isDark ? 'bg-[#1A202C]' : 'bg-[#E2E8F0]'} opacity-80 border-2 border-transparent`
                      }`}>
                        {step.done ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-500/30" />}
                      </div>
                      <div className="flex-1 pt-0.5 sm:pt-1.5 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                          <p className={`font-bold text-xs sm:text-sm tracking-tight ${step.done ? '' : 'opacity-40'}`}>{step.label}</p>
                          {step.done && step.time && (
                            <p className="text-[10px] sm:text-[11px] font-medium opacity-40 capitalize flex items-center gap-1.5">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {formatDate(step.time)}
                            </p>
                          )}
                        </div>
                        {i === steps.length - 1 && isCompleted && (
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/10">
                            <CheckCircle className="w-4 h-4" />
                            SETTLEMENT FINALIZED
                          </div>
                        )}
                        {!step.done && i === 2 && refundStatus === 'PROCESSING' && (
                          <p className="text-xs opacity-50 mt-2 italic">Awaiting final gateway clearance...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar Details Column */}
            <div className="flex flex-col gap-6 sm:gap-8">

              {/* Event Context Card */}
              <Card className="p-5 sm:p-7 border-white/5 overflow-hidden group">
                <div className="flex flex-col gap-5 sm:gap-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] sm:text-[11px] font-bold tracking-[0.2em] opacity-40 uppercase">Event Context</p>
                    <div className="p-1.5 rounded-lg bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      <Ticket className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg sm:text-xl leading-tight mb-2 sm:mb-3 group-hover:text-[#8860D9] transition-colors line-clamp-2">
                       {(booking?.eventDetails as any)?.eventName || 'Event Booking'}
                    </h3>
                    <div className="flex items-start gap-2 opacity-60">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8860D9]" />
                      <span className="text-[9px] sm:text-[11px] font-bold tracking-tight leading-relaxed uppercase">
                        {(booking?.eventDetails as any)?.venue || 'Premium Venue'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.02] border-black/5'} border space-y-3 sm:space-y-4`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] opacity-40 font-bold uppercase tracking-wider">Pass Group</span>
                      <span className="text-xs sm:text-[13px] font-bold">Standard Access</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] opacity-40 font-bold uppercase tracking-wider">Reference</span>
                      <span className="text-xs sm:text-[13px] font-mono font-bold truncate ml-4">#{bookingId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] opacity-40 font-bold uppercase tracking-wider">Tickets</span>
                      <span className="text-xs sm:text-[13px] font-bold bg-[#8860D9]/10 text-[#8860D9] px-2 py-0.5 rounded-lg">{booking?.quantity || 1} x</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Enhanced Calculation Card */}
              <Card className="p-5 sm:p-7 border-white/5 relative bg-gradient-to-br from-transparent to-[#8860D9]/[0.02]">
                <h3 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 tracking-tight flex items-center gap-2">
                   Calculation Logic
                   <HelpCircle className="w-4 h-4 opacity-30" />
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center text-xs sm:text-[13px] opacity-70">
                    <span className="font-medium">Booking Amount</span>
                    <span className="font-bold">₹{booking?.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-[13px] opacity-70">
                    <span className="font-medium">Taxes (GST 18%)</span>
                    <span className="font-bold font-mono">₹{booking?.tax?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-[13px] text-rose-500 bg-rose-500/5 px-3 py-2 -mx-3 rounded-xl border border-rose-500/10">
                    <span className="font-medium">Refund Surcharge</span>
                    <span className="font-bold">-₹{booking?.platformFee?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className={`mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2 border-dashed ${isDark ? 'border-white/10' : 'border-black/5'} flex items-end justify-between`}>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-[9px] sm:text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">Net Payout</span>
                      <span className="text-xs sm:text-sm font-bold opacity-60">Bank Transfer</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#8860D9] font-mono flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                      {parseFloat(refundAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dynamic Action / Support Card */}
              {isFailed && (
                <Card className="p-8 bg-rose-500 border-none text-white overflow-hidden relative shadow-2xl shadow-rose-500/20">
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-lg tracking-tight">Protocol Alert</h4>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      Automatic verification stalled. Our engineers are resolving this manually.
                    </p>
                    <button
                      onClick={() => router.push('/support')}
                      className="w-full py-4 bg-white text-rose-500 rounded-[1.25rem] font-bold text-sm hover:translate-y-[-2px] active:scale-95 shadow-lg transition-all flex items-center justify-center gap-3"
                    >
                      Priority Support
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-[80px]" />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
