import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import SearchBar from "../../components/HomePage/SearchBar";
import SideBar from "../../components/HomePage/SideBar";
import BottomNavigation from "../../components/HomePage/BottomNavigation";
import SeatingLayoutModal from "../../components/ViewSingleEvent/SeatingLayoutModal";
import GuideModal from "../../components/ViewSingleEvent/GuideModal";
import { EventCancelModal, EventCancelSuccessModal } from "../../components/Event/EventCancelModal";
import ReHostModal from "../../components/Event/ReHostModal";
import EventLocationModal from "../../components/ViewSingleEvent/EventLocationModal";
import WieLogo from "../../assets/HomePage/WieLogo.svg?url";
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from "react-hot-toast";
import {
  getMyLiveEventView,
  getGroupView,
  getTicketById, cancelEvent, cancelSubEvent, getCancellationReport, rehostEvent,
  getEventMetrics, getEventStatsByDate, getEventGrowthStats, getEventMonthlyChart,
  getEventFinancialSummary, getEventTransactions, initAttendance, scanAttendanceQR,
  getAttendanceList, downloadAttendance, completeAttendance, removeAttendee
} from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils";
import TicketDetailModal from "../../components/ViewSingleEvent/TicketDetailModal";
import {
  Radio,
  ArrowLeft,
  Lock,
  LayoutGrid,
  XCircle,
  Heart,
  Share2,
  Armchair,
  Users,
  MapPin,
  Landmark,
  Download,
  Bell,
  Ticket,
  TrendingUp,
  ChevronLeft,
  ChevronRight, QrCode, CheckCircle, UserCheck,
  ChevronDown, AlertTriangle, FileSpreadsheet, Ban, RefreshCw
} from "lucide-react";
import ActionCircleButton from "../../components/ViewSingleEvent/ActionCircleButton";
const HEADER_HEIGHT = 72; // From HomePage

// Main Component
const LiveEventsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedDateStats, setSelectedDateStats] = useState(null);
  const [growthStats, setGrowthStats] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [dateError, setDateError] = useState(null);
  // Modal State
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentSeatingIndex, setCurrentSeatingIndex] = useState(0);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [showBankAccountDetailsModal, setShowBankAccountDetailsModal] = useState(false);
  const [showEventLocationModal, setShowEventLocationModal] = useState(false);
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [appAlert, setAppAlert] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  // API State Management
  const [eventData, setEventData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [metrics, setMetrics] = useState(null); // State for metrics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGuest, setSelectedGuest] = useState(null);
  // ── Event Cancellation State 
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showDownloadReport, setShowDownloadReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cancellationSummary, setCancellationSummary] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const [showRehostModal, setShowRehostModal] = useState(false);
  const [isRehosting, setIsRehosting] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [showTransactionPanel, setShowTransactionPanel] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAttendanceList, setShowAttendanceList] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [scanResult, setScanResult] = useState(null);  // last scan
  const [scanCount, setScanCount] = useState(0);
  const [scanError, setScanError] = useState('');
  const [isInitingAttendance, setIsInitingAttendance] = useState(false);
  const [isDownloadingAtt, setIsDownloadingAtt] = useState(false);
  const [activeSubEventIdForAtt, setActiveSubEventIdForAtt] = useState(null);
  // Update the fetchEventData useEffect to also fetch initial growth stats
  useEffect(() => {
    const fetchEventData = async () => {
      if (!ticketId) {
        setError("Event ID not found in URL parameters.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch ticket data using getTicketById (matches ConfirmEventView)
        const ticketResponse = await getTicketById(ticketId);

        // Extract event data - Handle multiple response structures (Robust extraction)
        const data =
          ticketResponse?.ticket ||
          ticketResponse?.data?.ticket ||
          ticketResponse?.data ||
          ticketResponse;

        if (!data) {
          throw new Error("No event data received from server");
        }

        if (!data.event_name) {
          throw new Error("Invalid event data structure");
        }
        setEventData(data);

        try {
          // For rehosted events (confirmed + version > 1), metrics should start at zero
          // Don't call getEventMetrics — use lifecycle_metrics from the ticket itself
          const isRehostedFresh =
            data.event_status === "confirmed" && (data.version ?? 1) > 1;

          if (isRehostedFresh) {
            // Use the reset lifecycle_metrics embedded in the ticket
            setMetrics({
              totalRevenue: data.lifecycle_metrics?.revenue ?? 0,
              totalTicketsSold: data.lifecycle_metrics?.totalBookings ?? 0,
              totalLikes: data.lifecycle_metrics?.like ?? 0,
              totalShare: data.lifecycle_metrics?.share ?? 0,
              total_cancellation: data.lifecycle_metrics?.total_cancellation ?? 0,
            });
          } else {
            const metricsResponse = await getEventMetrics(ticketId);
            if (metricsResponse?.data) {
              setMetrics(metricsResponse.data);
            }
          }
        } catch (metricsErr) {
          console.warn("Failed to fetch event metrics:", metricsErr);
          setMetrics({
            totalRevenue: 0,
            totalTicketsSold: 0,
            totalLikes: 0,
            totalShare: 0,
            total_cancellation: 0,
          });
        }
        // Fetch group data if groupId exists
        if (data.groupId) {
          try {
            const groupResponse = await getGroupView(ticketId);
            const fetchedGroupData =
              groupResponse?.data?.group ||
              groupResponse?.group ||
              groupResponse?.data ||
              groupResponse;
            setGroupData(fetchedGroupData);
            setGroupName(fetchedGroupData.name || "Unknown Group");
          } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
          }
        }

        try {
          const metricsResponse = await getEventMetrics(ticketId);
          if (metricsResponse?.data) {
            setMetrics(metricsResponse.data);
          }
        } catch (metricsErr) {
          console.warn("Failed to fetch event metrics:", metricsErr);
          setMetrics({
            totalRevenue: 0,
            totalBooking: 0,
            totalLikes: 0,
            totalShare: 0,
            total_cancellation: 0,
          });
        }

        // Fetch initial growth stats (yesterday vs day before)
        try {
          const yesterday = new Date();
          try {
            setLoadingFinancial(true);
            const financialResponse = await getEventFinancialSummary(ticketId);
            if (financialResponse?.data) {
              setFinancialSummary(financialResponse.data);
            }
          } catch (finErr) {
            console.warn('Failed to fetch financial summary:', finErr);
          } finally {
            setLoadingFinancial(false);
          }
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayFormatted = yesterday.toISOString().split('T')[0];

          const initialGrowthResponse = await getEventGrowthStats(
            ticketId,
            yesterdayFormatted,
            'daily'
          );
          if (initialGrowthResponse?.data) {
            setGrowthStats(initialGrowthResponse.data);
          }
        } catch (growthErr) {
          console.warn("Failed to fetch initial growth stats:", growthErr);
        }

      } catch (err) {
        console.error("Failed to fetch live event data:", err);
        const errorMessage =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load event details.";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [ticketId]);
  const groupId = eventData?.group_id || eventData?.groupId;
  // Replace the existing useEffect for date-based stats
  useEffect(() => {
    const fetchDateBasedStats = async () => {
      if (!eventData || !ticketId) return;

      // Don't fetch date-specific stats on initial load
      // Only fetch when user explicitly selects a date
      const isInitialLoad = currentDate.toDateString() === new Date().toDateString();

      if (isInitialLoad) {
        // On initial load, just use the metrics from getEventMetrics
        return;
      }

      const formattedDate = currentDate.toISOString().split('T')[0];

      try {
        // Fetch stats for selected date
        const statsResponse = await getEventStatsByDate(ticketId, formattedDate);
        if (statsResponse?.data) {
          setSelectedDateStats(statsResponse.data);
          setDateError(null);
        }

        // Fetch growth stats
        const growthResponse = await getEventGrowthStats(ticketId, formattedDate, 'daily');
        if (growthResponse?.data) {
          setGrowthStats(growthResponse.data);
        }

        // Fetch monthly chart data
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const chartResponse = await getEventMonthlyChart(ticketId, year, month);
        if (chartResponse?.data) {
          setMonthlyChartData(chartResponse.data.chartData || []);
        }

      } catch (error) {
        console.error("Error fetching date-based stats:", error);
        if (error.response?.status === 400 && error.response?.data?.message) {
          setDateError(error.response.data.message);
          toast.error(error.response.data.message);
          // Clear date-specific stats but keep showing total stats
          setSelectedDateStats(null);
          setGrowthStats(null);
          setMonthlyChartData([]);
        }
      }
    };

    // Only fetch if we have eventData
    if (eventData) {
      fetchDateBasedStats();
    }
  }, [currentDate, ticketId, eventData]);
  // Add a button to reset to total view
  const handleResetToTotalView = () => {
    setCurrentDate(new Date());
    setSelectedDateStats(null);
    setGrowthStats(null);
    setMonthlyChartData([]);
    setDateError(null);
  };
  const handleCancelEvent = async () => {
    if (!cancelReason.trim()) {
      setCancelReasonError("Please provide a cancellation reason.");
      return;
    }
    if (cancelReason.trim().length < 10) {
      setCancelReasonError("Reason must be at least 10 characters.");
      return;
    }
    try {
      setIsCancelling(true);
      setCancelReasonError("");
      const response = await cancelEvent(ticketId, cancelReason.trim());
      if (response.success) {
        setCancelSuccess(true);
        setShowDownloadReport(true);

        const promotion = response.data?.promotion;

        setCancellationSummary({
          eventName: eventData?.event_name,
          totalBookings: response.data?.affectedBookings || 0,
          refundPercentage: response.data?.refundPolicy?.refundPercentage ?? 100,
          cancellationTier: response.data?.refundPolicy?.cancellationTier,
          isPaid: eventData?.payment_type === "paid",
          reason: cancelReason.trim(),
          promoted: promotion?.promoted || false,
          newMainTicketId: promotion?.newMainTicketId || null,
        });

        setEventData((prev) => ({ ...prev, event_status: "cancelled" }));
        toast.success(
          promotion?.promoted
            ? "Event cancelled. First sub-event promoted to main event. Attendees notified."
            : "Event cancelled. All attendees have been notified."
        );
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to cancel event.";
      toast.error(msg);
      setCancelReasonError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    if (cancelSuccess) {
      setShowCancelModal(false);
    } else {
      setShowCancelModal(false);
      setCancelReason("");
      setCancelReasonError("");
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      setDownloadError("");
      await getCancellationReport(ticketId);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      const msg = err?.message || "Failed to download report. Please try again.";
      setDownloadError(msg);
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRehost = async (rehostAs) => {
    try {
      setIsRehosting(true);
      const response = await rehostEvent(ticketId, rehostAs);
      if (response.success) {
        setShowRehostModal(false);
        toast.success("Event re-hosted successfully! Loading new event...");

        // The backend always returns newTicketId for the fresh V2 ticket
        const newTicketId = response.data?.newTicketId;

        if (newTicketId) {
          // Navigate to the new ticket — this triggers a full fresh data load
          navigate(`/ticket/live-event-view/${newTicketId}`, { replace: true });
        } else {
          // Fallback: reload current page to force fresh fetch
          window.location.reload();
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to re-host event.";
      toast.error(msg);
    } finally {
      setIsRehosting(false);
    }
  };

  const computedEventData = eventData
    ? {
      name: eventData.event_name || 'Event Name',
      creator: eventData.created_by || 'Unknown Creator',

      totalRevenue:
        selectedDateStats?.totalRevenue ??
        metrics?.totalRevenue ??
        eventData.revenue ?? 0,

      totalBooking:
        selectedDateStats?.totalTicketsSold ??
        metrics?.totalBookings ??
        eventData.totalBookings ?? 0,

      totalTicketsSold:
        metrics?.totalTicketsSold ??
        eventData.totalTicketsSold ?? 0,

      totalLikes:
        metrics?.totalLikes ??
        eventData.like ?? 0,

      totalShare:
        metrics?.totalShare ??
        eventData.share ?? 0,

      totalCancellation:
        metrics?.total_cancellation ??
        eventData.total_cancellation ?? 0,

      paymentType: metrics?.paymentType ?? eventData.payment_type ?? 'paid',

      addOnRevenue: eventData.addon_revenue || '0',
      addOnRevenueMonth: eventData.addon_revenue_month || '0',
    }
    : null;
  // Theme setup from HomePage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  // Remove the static chartData definition and replace with this:
  const chartData = React.useMemo(() => {
    if (monthlyChartData && monthlyChartData.length > 0) {
      // User selected a specific date, show monthly chart
      return monthlyChartData.map(item => ({
        month: `Day ${item.day}`,
        value: item.revenue / 1000, // Convert to k
        bookingCount: item.bookingCount,
        height: Math.max(20, Math.min(160, (item.bookingCount || 1) * 15)) // Dynamic height in pixels
      }));
    }

    // Show default message - no static data
    return [];
  }, [monthlyChartData]);
  const generateCalendarDays = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        day: date
          .toLocaleDateString("en-US", { weekday: "short" })
          .toLowerCase(),
        date: date.getDate().toString(),
        active: date.toDateString() === currentDate.toDateString(),
        fullDate: date,
      });
    }
    return days;
  };
  const calendarDays = generateCalendarDays();
  const HIDDEN_STATUSES = ["deleted", "remove"];
  const addOnEvents =
    eventData?.sub_events
      ?.filter((subEvent) => !HIDDEN_STATUSES.includes(subEvent.event_status))
      ?.map((subEvent) => ({
        name: subEvent.event_name,
        id: subEvent._id,
        category: subEvent.event_category,
        banner: subEvent.event_banner,
      })) || [];
  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  const handleLocationClick = () => {
    if (eventData.location_type === "offline") {
      setShowEventLocationModal(true);
    } else {
      setAppAlert({
        message: "Location Inapplicable",
        description:
          "Location details are not applicable for this online/recorded event.",
        type: "error",
        show: true,
      });
    }
  };

  const formatImagePath = (path) => getImageUrl(path, "ticket");

  // Helper for Seating Events
  const seatingEvents = React.useMemo(() => {
    if (!eventData) return [];
    const allEvents = [];
    if (eventData.location_type === "offline" && eventData.ticket_layout) {
      allEvents.push(eventData);
    }
    if (eventData.sub_events) {
      eventData.sub_events.forEach((sub) => {
        if (sub.location_type === "offline" && sub.ticket_layout) {
          allEvents.push(sub);
        }
      });
    }
    return allEvents;
  }, [eventData]);
  // Google Maps API initialization
  useEffect(() => {
    const callbackName = "initLiveEventMapCallback";
    const scriptId = "google-maps-live-event-script";

    if (window.google && window.google.maps) {
      setIsApiReady(true);
      return;
    }

    if (!window[callbackName]) {
      window[callbackName] = () => {
        setIsApiReady(true);
      };
    }

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      setIsApiReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Add state for API ready
  const [isApiReady, setIsApiReady] = useState(false);

  const ticketTypes = eventData?.ticket_types || [];

  const handlePrevSeating = () => {
    const len = seatingEvents.length;
    if (len === 0) return;
    setCurrentSeatingIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  const handleNextSeating = () => {
    const len = seatingEvents.length;
    if (len === 0) return;
    setCurrentSeatingIndex((prev) => (prev + 1) % len);
  };

  const handlePrevTicket = () => {
    const len = ticketTypes.length;
    if (len === 0) return;
    setCurrentTicketIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  const handleNextTicket = () => {
    const len = ticketTypes.length;
    if (len === 0) return;
    setCurrentTicketIndex((prev) => (prev + 1) % len);
  };

  // Theme object from HomePage
  const theme = isDark
    ? {
      bg: "bg-[#212426]", // Using HomePage dark theme
      text: "text-white",
      subText: "text-[#c9c9cf]",
      cardBg: "bg-[#212426]", // Using HomePage dark theme
      border: "border-[#23233a]",
      inputBg: "bg-[#212426]",
      // Specific colors from screenshot for this page
      cardBgDarker: "bg-[#1C1C1E]", // A slightly darker card bg from screenshot
      purpleBtn: "bg-gradient-to-r from-[#6a47fa] to-[#5a3fea]",
      activePill: "bg-white text-black",
      inactivePill: "bg-transparent text-white border border-gray-700",
      // Modal specific theme props
      mainBg: "#212426",
      insetBg: "#2e3133",
      shadowOutset: "6px 6px 12px 0px #00000040, -6px -6px 12px 0px #FFFFFF0D",
      shadowInset: "inset 6px 6px 12px 0px #0000002E, inset -6px -6px 12px 0px #FFFFFF14",
      textColor: "text-white",
      isDark: true,
    }
    : {
      bg: "bg-[#f0f2f5]",
      text: "text-gray-900",
      subText: "text-gray-600",
      cardBg: "bg-[#ffffff]", // Using white for light mode cards
      border: "border-[#e4e6ea]",
      inputBg: "bg-[#ffffff]",
      // Specific colors for light mode
      cardBgDarker: "bg-gray-100",
      purpleBtn: "bg-gradient-to-r from-[#6a47fa] to-[#5a3fea] text-white",
      activePill: "bg-black text-white",
      inactivePill: "bg-transparent text-black border border-gray-300",
      // Modal specific theme props
      mainBg: "#f0f2f5",
      insetBg: "#ffffff",
      shadowOutset: "6px 6px 12px 0px rgba(0,0,0,0.1), -6px -6px 12px 0px rgba(255,255,255,0.8)",
      shadowInset: "inset 6px 6px 12px 0px rgba(0,0,0,0.05), inset -6px -6px 12px 0px rgba(255,255,255,0.8)",
      textColor: "text-gray-900",
      isDark: false,
    };

  // Neumorphism shadow style from HomePage
  const neumorphShadow = {
    boxShadow: isDark
      ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
      : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
  };

  // Specific shadows from user request (Dark Mode mainly)
  const controlShadow = isDark
    ? "4px 4px 12px 0px #00000029, -4px -4px 12px 0px #FFFFFF0A"
    : "4px 4px 12px 0px rgba(0,0,0,0.1), -4px -4px 12px 0px rgba(255,255,255,0.8)"; // Adapted for light

  const activeDateShadow = isDark
    ? "inset 6px 6px 12px 0px #0000002E, inset -6px -6px 12px 0px #FFFFFF14"
    : "inset 6px 6px 12px 0px rgba(0,0,0,0.1), inset -6px -6px 12px 0px rgba(255,255,255,0.8)";

  const calendarBg = isDark ? theme.cardBg : "bg-white";

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const fullMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  };

  const handleSelectMonth = (m) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(m);
      return n;
    });
  };

  const handleSelectYear = (y) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setFullYear(y);
      return n;
    });
  };
  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuest(null);
  };

  // A darker/flatter shadow for the inner cards, closer to the screenshot
  const cardStyle = {
    border: "3px solid transparent",
    backgroundImage: isDark
      ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
      : "linear-gradient(#F1F1F1, #F1F1F1), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
  };

  const calendarSpecificCardStyle = isDark
    ? { ...cardStyle, borderRadius: "36px", boxShadow: "none" }
    : {
      background: "#FFFFFF",
      borderRadius: "36px",
      boxShadow: "none",
      border: "none",
    };
  // Loading State
  if (loading) {
    return (
      <div
        className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading Live Event Data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !eventData) {
    return (
      <div
        className={`${theme.bg} min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8`}
      >
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Error Loading Event</p>
          <p className="text-lg">
            {error || `Event with ID "${ticketId}" not found.`}
          </p>
          <div className="text-sm text-gray-400 mt-4">
            <p>Ticket ID: {ticketId}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  // Replace the existing formattedDate and formattedEndDate logic with this:
  const formattedDate = eventData?.event_dates?.[0]?.start_date
    ? new Date(eventData.event_dates[0].start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "N/A";

  const formattedEndDate = eventData?.event_dates?.[0]?.end_date
    ? new Date(eventData.event_dates[0].end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null;

  // Check if dates are the same
  const isSameDate = eventData?.event_dates?.[0]?.start_date &&
    eventData?.event_dates?.[0]?.end_date &&
    new Date(eventData.event_dates[0].start_date).toDateString() ===
    new Date(eventData.event_dates[0].end_date).toDateString();

  const displayDate = isSameDate
    ? formattedDate
    : (formattedDate !== "N/A" && formattedEndDate
      ? `${formattedDate} - ${formattedEndDate}`
      : formattedDate);

  const handleOpenAttendanceScanner = async (subEventId = null) => {
    setIsInitingAttendance(true);
    try {
      await initAttendance(ticketId, subEventId);
      const res = await getAttendanceList(ticketId, subEventId);
      setAttendanceData(res?.data?.data || null);
      setScanCount(res?.data?.data?.totalPresent || 0);
      setActiveSubEventIdForAtt(subEventId);
      setScanResult(null);
      setScanError('');
      setShowAttendanceModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not open attendance scanner');
    } finally {
      setIsInitingAttendance(false);
    }
  };

  const handleQRScanned = async (qrData) => {
    if (!qrData || !qrData.trim()) return;
    setScanError('');
    setScanResult(null);

    console.log('[handleQRScanned] received qrData length:', qrData.length);

    try {
      const res = await scanAttendanceQR(ticketId, qrData.trim(), activeSubEventIdForAtt);
      const attendee = res?.data?.data?.scannedAttendee;

      if (!attendee) {
        setScanError('❌ Scan succeeded but no attendee data returned');
        return;
      }

      setScanResult(attendee);
      setScanCount(prev => prev + 1);
      setAttendanceData(prev =>
        prev
          ? {
            ...prev,
            totalPresent: (prev.totalPresent || 0) + 1,
            attendees: [...(prev.attendees || []), attendee],
          }
          : prev
      );

      // Auto-close after 3s — keep scanner open so hoster can scan more
      setTimeout(() => setScanResult(null), 3000);
      // ← removed setShowAttendanceModal(false) so scanner stays open for next person

    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Scan failed';

      console.error('[handleQRScanned] error:', status, msg);

      const isDouble = status === 409 || msg.toLowerCase().includes('already been scanned');
      const isBadQR = msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('unrecognised');
      const isWrongEv = msg.toLowerCase().includes('does not belong');
      const isCancel = msg.toLowerCase().includes('cancelled');
      const isTimeout = msg.toLowerCase().includes('timed out');

      setScanError(
        isDouble ? '⚠️ Already scanned — this ticket was marked present earlier'
          : isCancel ? '❌ Booking is cancelled — cannot mark attendance'
            : isWrongEv ? '❌ This QR belongs to a different event'
              : isBadQR ? '❌ QR code not recognised — ensure ticket QR is fully visible'
                : isTimeout ? '⏳ Verification timed out — please try again'
                  : `❌ ${msg}`
      );
      setTimeout(() => setScanError(''), 5000);
    }
  };

  const handleViewAttendanceList = async (subEventId = null) => {
    try {
      const res = await getAttendanceList(ticketId, subEventId);
      setAttendanceData(res?.data?.data || null);
      setActiveSubEventIdForAtt(subEventId);
      setShowAttendanceList(true);
    } catch (err) {
      toast.error('Could not fetch attendance list');
    }
  };

  const handleDownloadAttendance = async (format = 'excel') => {
    setIsDownloadingAtt(true);
    try {
      const res = await downloadAttendance(ticketId, format, activeSubEventIdForAtt); // ✅ ticketId
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', format === 'pdf' ? 'attendance.pdf' : 'attendance.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded successfully');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setIsDownloadingAtt(false);
    }
  };

  const handleCompleteAttendance = async () => {
    try {
      await completeAttendance(ticketId, activeSubEventIdForAtt);
      toast.success('Attendance session completed');
      setShowAttendanceModal(false);
      setScanResult(null);
      setScanError('');
      // Refresh list data so the list modal shows "Completed" status
      const res = await getAttendanceList(ticketId, activeSubEventIdForAtt);
      setAttendanceData(res?.data?.data || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete session');
    }
  };

  const handleRemoveAttendee = async (bookingId) => {
    try {
      await removeAttendee(ticketId, bookingId, activeSubEventIdForAtt);
      setAttendanceData(prev =>
        prev
          ? {
            ...prev,
            totalPresent: Math.max(0, (prev.totalPresent || 1) - 1),
            attendees: prev.attendees.filter(a => String(a.bookingId) !== String(bookingId)),
          }
          : prev
      );
      setScanCount(prev => Math.max(0, prev - 1));
      toast.success('Attendee removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove attendee');
    }
  };
  return (
    <>
      <style>{`
        /* Main page scrollbar (using HomePage style) */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track { background: ${isDark ? "#1f2937" : "#f1f1f1"
        }; }
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb { background: ${isDark ? "#4b5563" : "#cbd5e1"
        }; border-radius: 10px; }
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#6b7280" : "#94a3b8"
        }; }
        /* Hide scrollbar for specific elements */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
      <div
        className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
      >
        {/* Desktop Sidebar (from HomePage) */}
        <div
          className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg} border-r ${theme.border}`}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: HEADER_HEIGHT }}
          >
            <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
          </div>
          <div className="flex-1 sidebar-content overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        <div className="flex flex-col flex-1 relative overflow-hidden">
          {/* Header (from HomePage) */}
          <header
            className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Mobile Header (from HomePage) */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img
                  src={WieLogo}
                  alt="WIE Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>

            {/* Desktop Header (from HomePage) */}
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onTuneClick={() => { }}
                />
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          {/* --- Main Content Area (New Design) --- */}
          <main
            className={`main-scrollbar flex flex-col flex-1 p-4 md:p-6 lg:px-8 lg:pt-8 overflow-y-auto pb-32 md:pb-8 ${theme.bg}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10">
              {/* Page Header (Left) */}
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <button
                  onClick={() => navigate(-1)} // Use navigate(-1) to go back
                  style={neumorphShadow}
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text} hover:scale-105 transition-transform`}
                >
                  <ArrowLeft />
                </button>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-semibold flex items-center gap-3">
                    <Radio className="text-red-500" />
                    {computedEventData?.name || "Loading..."}
                    {/* Version badge */}
                    {eventData?.version && eventData.version > 1 && (
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-emerald-600 text-white">
                        V{eventData.version} (Re-hosted)
                      </span>
                    )}
                    {/* Status badge for cancelled events */}
                    {eventData?.event_status === "cancelled" && (
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-600 text-white">
                        Cancelled
                      </span>
                    )}
                  </h1>
                  <div className="mt-4">
                    <p className="text-base">
                      <span className={`${theme.subText}`}>
                        Created under: {""}
                      </span>
                      <span className={`${theme.text}`}>{groupName}</span>
                    </p>
                  </div>
                </div>
              </div>
              {/* Filter Pills (Right) */}
              <div className="flex items-center my-auto space-x-4 flex-shrink-0 ml-auto mr-4">
                {/* Edit button — hidden for cancelled events */}
                {eventData?.event_status === "live" && (
                  <ActionCircleButton
                    theme={theme}
                    type="edit"
                    groupId={groupId}
                    ticketId={ticketId}
                    setAppAlert={setAppAlert}
                  />
                )}

                {/* Cancel OR Re-host button */}
                {eventData?.event_status === "cancelled" && (
                  <button
                    onClick={() => setShowRehostModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                              bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200
                              hover:scale-105 shadow-lg"
                  >
                    <RefreshCw size={16} />
                    Re-host Event
                  </button>
                )}

                {eventData?.event_status === "confirmed" && (
                  <button
                    onClick={() => navigate(`/ticket/view-confirm-event/${ticketId}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                              bg-green-600 hover:bg-green-700 text-white transition-all duration-200
                              hover:scale-105 shadow-lg"
                  >
                    <Radio size={16} />
                    Add to Live
                  </button>
                )}

                {eventData?.event_status === "live" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                              bg-red-600 hover:bg-red-700 text-white transition-all duration-200
                              hover:scale-105 shadow-lg"
                  >
                    <Ban size={16} />
                    Cancel Event
                  </button>
                )}

                {/* Download Report — only for cancelled events */}
                {(showDownloadReport || eventData?.event_status === "cancelled") && eventData?.event_status !== "confirmed" && (
                  <button
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                              bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200
                              hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={16} />
                    {isDownloading ? "Downloading..." : "Download Report"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap pb-2 lg:pb-0 mt-4 lg:mt-0">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${theme.inactivePill} ml-auto lg:ml-0 text-blue-500`}
                >
                  {displayDate}
                </button>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

              {/* Revenue — hidden for free events */}
              {metrics?.paymentType !== 'free' && (
                <StatCard
                  theme={theme}
                  shadow={{ ...cardStyle, borderRadius: '20px' }}
                  icon={<Lock />}
                  title="TOTAL REVENUE"
                  value={`₹${computedEventData?.totalRevenue || '0'}`}
                  color={theme.subText}
                />
              )}

              {/* Total Bookings */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: '20px' }}
                icon={<LayoutGrid />}
                title="TOTAL BOOKINGS"
                value={computedEventData?.totalBooking || '0'}
                color={theme.subText}
              />

              {/* Total Tickets Sold */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: '20px' }}
                icon={<Ticket />}
                title="TOTAL TICKETS SOLD"
                value={
                  metrics?.totalTicketsSold ??
                  eventData?.totalTicketsSold ??
                  '0'
                }
                color={theme.subText}
              />

              {/* Total Cancellation */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: '20px' }}
                icon={<XCircle />}
                title="TOTAL CANCELLATION"
                value={computedEventData?.totalCancellation || '0'}
                color={theme.subText}
              />

              {/* Likes + Shares combined card */}
              <div
                className={`p-6 rounded-3xl ${theme.cardBgDarker}`}
                style={{ ...cardStyle, borderRadius: '20px' }}
              >
                <div className="flex justify-around items-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}>
                      TOTAL LIKES
                    </span>
                    <Heart className="text-pink-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalLikes || '0'}
                    </div>
                  </div>
                  <div className="h-16 w-px bg-gray-600" />
                  <div className="flex flex-col items-center">
                    <span className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}>
                      TOTAL SHARE
                    </span>
                    <Share2 className="text-blue-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalShare || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/*  Host Financial Summary Panel  */}
            {financialSummary && eventData?.payment_type !== 'free' && (
              <div
                className={`mb-8 p-6 rounded-3xl ${theme.cardBgDarker}`}
                style={{ ...cardStyle, borderRadius: '24px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wider">
                        Your Revenue & Payouts
                      </h3>
                      <p className={`text-xs ${theme.subText}`}>
                        What you earn from ticket sales
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransactionPanel(!showTransactionPanel)}
                    className="text-xs px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2"
                  >
                    <Ticket size={14} />
                    {showTransactionPanel ? 'Hide' : 'View'} All Transactions
                  </button>
                </div>

                {/* Revenue breakdown — 4 key numbers */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      label: 'Ticket Revenue',
                      value: `₹${financialSummary.revenue?.totalRevenue?.toFixed(2) || '0.00'}`,
                      note: 'Gross ticket sales (your share)',
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/10',
                    },
                    {
                      label: 'Refunds Issued',
                      value: `₹${financialSummary.revenue?.totalRefunded?.toFixed(2) || '0.00'}`,
                      note: 'Returned to attendees',
                      color: 'text-red-400',
                      bg: 'bg-red-500/10',
                    },
                    {
                      label: 'Net Payout',
                      value: `₹${financialSummary.revenue?.netHostPayout?.toFixed(2) || '0.00'}`,
                      note: 'Revenue after refunds',
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/10',
                    },
                    {
                      label: 'GST Collected',
                      value: `₹${financialSummary.revenue?.totalTax?.toFixed(2) || '0.00'}`,
                      note: 'Tax on ticket price',
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/10',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl ${item.bg} ${theme.bg}`}>
                      <p className={`text-xs uppercase font-semibold ${theme.subText} mb-1`}>
                        {item.label}
                      </p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      <p className={`text-xs mt-1 ${theme.subText} opacity-70`}>{item.note}</p>
                    </div>
                  ))}
                </div>

                {/* WIE fee transparency row */}
                <div className={`flex flex-wrap gap-4 p-4 rounded-2xl ${theme.bg} mb-6 border-l-4 border-indigo-500`}>
                  <p className={`text-xs ${theme.subText} w-full font-semibold mb-1`}>
                    WIE Platform Charges (deducted from user total, not from your payout)
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    <span className={`text-xs ${theme.subText}`}>
                      Platform Fee:{' '}
                      <span className="font-bold text-white">
                        ₹{financialSummary.revenue?.totalPlatformFee?.toFixed(2) || '0.00'}
                      </span>
                    </span>
                    <span className={`text-xs ${theme.subText}`}>
                      Gateway Fee (absorbed by WIE):{' '}
                      <span className="font-bold text-white">
                        ₹{financialSummary.revenue?.totalConvenienceFee?.toFixed(2) || '0.00'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Per ticket type breakdown */}
                {financialSummary.byTicketType?.length > 0 && (
                  <div>
                    <p className={`text-xs uppercase font-semibold ${theme.subText} mb-3`}>
                      Revenue by Ticket Type
                    </p>
                    <div className="flex flex-col gap-2">
                      {financialSummary.byTicketType.map((t, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl ${theme.bg}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className={`text-sm font-medium ${theme.text}`}>
                              {t.ticketType}
                            </span>
                            <span className={`text-xs ${theme.subText}`}>
                              ({t.count} ticket{t.count !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-emerald-400">
                              ₹{t.revenue?.toFixed(2)}
                            </span>
                            {t.refunded > 0 && (
                              <span className="text-xs text-red-400">
                                −₹{t.refunded?.toFixed(2)} refunded
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent transactions inline (collapsed by default, shown via toggle) */}
                {showTransactionPanel && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs uppercase font-semibold ${theme.subText}`}>
                        Transactions
                      </p>
                      {/* Status filter */}
                      <div className="flex gap-2">
                        {['all', 'CONFIRMED', 'CANCELLED'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setTransactionFilter(f)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${transactionFilter === f
                              ? 'bg-indigo-600 text-white'
                              : `${theme.bg} ${theme.subText} border border-gray-600`
                              }`}
                          >
                            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`${theme.bg}`}>
                            {['Booking ID', 'Attendee', 'Type', 'Qty', 'Your Share', 'Total Paid', 'Method', 'Status', 'Refund', 'Date'].map((h) => (
                              <th key={h} className={`text-left px-3 py-2 font-semibold ${theme.subText} whitespace-nowrap`}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(financialSummary.recentTransactions || [])
                            .filter((t) => transactionFilter === 'all' || t.bookingStatus === transactionFilter)
                            .map((t, idx) => (
                              <tr
                                key={idx}
                                className={`border-t ${theme.border} hover:opacity-80 transition-opacity`}
                              >
                                <td className={`px-3 py-2 font-mono ${theme.subText}`}>
                                  {t.bookingId?.slice(-10) || '—'}
                                </td>
                                <td className={`px-3 py-2 ${theme.text}`}>{t.userName}</td>
                                <td className={`px-3 py-2 ${theme.subText}`}>{t.ticketType}</td>
                                <td className={`px-3 py-2 text-center ${theme.text}`}>{t.quantity}</td>
                                <td className="px-3 py-2 text-emerald-400 font-semibold">
                                  ₹{t.subtotal?.toFixed(2)}
                                </td>
                                <td className={`px-3 py-2 font-semibold ${theme.text}`}>
                                  ₹{t.totalPaid?.toFixed(2)}
                                </td>
                                <td className={`px-3 py-2 ${theme.subText} uppercase`}>
                                  {t.paymentMethod || '—'}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.bookingStatus === 'CONFIRMED'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : t.bookingStatus === 'CANCELLED'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {t.bookingStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {t.refundAmount > 0 ? (
                                    <span className="text-red-400">−₹{t.refundAmount?.toFixed(2)}</span>
                                  ) : (
                                    <span className={theme.subText}>—</span>
                                  )}
                                </td>
                                <td className={`px-3 py-2 whitespace-nowrap ${theme.subText}`}>
                                  {t.createdAt
                                    ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit', month: 'short', year: '2-digit',
                                    })
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>

                      {(financialSummary.recentTransactions || []).filter(
                        (t) => transactionFilter === 'all' || t.bookingStatus === transactionFilter
                      ).length === 0 && (
                          <div className={`text-center py-8 ${theme.subText}`}>
                            No transactions found for this filter.
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
              {/* Left Column: Total Booking of Events Chart */}
              <div
                className={`lg:col-span-2 py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col`}
                style={{ ...cardStyle, borderRadius: "50px" }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="text-base font-semibold uppercase tracking-wider">
                    LIVE EVENTS EARNING STATISTICS
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold">
                      {selectedDateStats?.totalRevenue || computedEventData?.totalRevenue || "0"}
                    </div>
                    <div className={`${theme.subText} text-base`}>
                      {selectedDateStats
                        ? `Revenue on ${new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Total Revenue (All Time)'}
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${theme.bg} text-center`}>
                    <div className={`${theme.subText} text-sm`}>
                      {selectedDateStats ? 'Bookings on selected date' : 'Total Bookings (All Time)'}
                    </div>
                    <div className="text-xl font-bold">
                      {selectedDateStats
                        ? selectedDateStats.totalTicketsSold
                        : (computedEventData?.totalTicketsSold || "0")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-16 h-8 ${parseFloat(growthStats?.growthPercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <div
                      className={`w-10 h-10 rounded-full border ${theme.border} flex items-center justify-center`}
                    >
                      <span className="text-sm font-bold">
                        {growthStats
                          ? `${parseFloat(growthStats.growthPercentage) >= 0 ? '+' : ''}${parseFloat(growthStats.growthPercentage).toFixed(0)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Bar Chart */}
                <div className="flex justify-around items-end flex-1 overflow-x-auto min-h-[200px] px-2">
                  {chartData.length > 0 ? (
                    chartData.map((bar, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2 min-w-[40px]"
                      >
                        <span className={`text-xs ${theme.subText}`}>
                          ₹{typeof bar.value === 'number' ? bar.value.toFixed(1) : bar.value}k
                        </span>
                        <div
                          className={`w-6 rounded-t-lg bg-green-500 transition-all duration-300`}
                          style={{
                            height: `${bar.height}px`
                          }}
                        ></div>
                        <span className={`text-xs ${theme.subText}`}>
                          {bar.month}
                        </span>
                        <span className={`text-[10px] ${theme.subText} opacity-70`}>
                          {bar.bookingCount} booking{bar.bookingCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`flex flex-col items-center justify-center ${theme.subText} text-center w-full gap-3`}>
                      <TrendingUp className="w-12 h-12 opacity-30" />
                      <div>
                        <p className="text-base font-medium">No Booking Data Available</p>
                        <p className="text-xs mt-1 opacity-70">
                          {dateError
                            ? dateError
                            : selectedDateStats
                              ? 'Select a date within the event period to view statistics'
                              : 'Bookings will appear here once customers make purchases'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={`flex justify-between text-sm ${theme.subText} mt-4 pt-4 border-t ${theme.border}`}
                >
                  <span>
                    {selectedDateStats
                      ? `Selected Date: ${new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : `Event: ${computedEventData?.name || 'N/A'}`}
                  </span>
                </div>
              </div>
              {/* Right side: Ticket types, Seating layout, Calendar, and Add-on Events */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Top section: Ticket types, Seating layout, and Calendar */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-2">
                  {/* Ticket types and Seating layout */}
                  <div className="flex flex-row md:flex-col items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => {
                          if (ticketTypes && ticketTypes.length > 0) {
                            setShowTicketModal(true);
                          } else {
                            toast.error("No ticket types available.");
                          }
                        }}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.purpleBtn} text-white`}
                      >
                        <Ticket className="w-8 h-8 filter brightness-0 invert" />
                      </button>
                      <span className="text-xs font-medium">Ticket types</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => setShowSeatingModal(true)}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.purpleBtn} text-white`}
                      >
                        <Armchair className="w-8 h-8 filter brightness-0 invert" />
                      </button>
                      <span className="text-xs font-medium">
                        Seating
                      </span>
                    </div>
                  </div>
                  {/* Calendar */}
                  <div className="flex-1">
                    <div
                      className={`h-full p-4 sm:p-6 md:p-1 lg:p-6 ${isDark ? theme.cardBgDarker : ""}`}
                      style={calendarSpecificCardStyle}
                    >
                      <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-hide items-center justify-between gap-2 w-full mb-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevMonth}
                            style={{
                              boxShadow: "none",
                              borderRadius: "30px",
                            }}
                            className={`flex items-center justify-center ${calendarBg} w-10 h-10 md:w-12 md:h-12 flex-shrink-0`}
                          >
                            <ChevronLeft className={`${theme.text}`} size={20} />
                          </button>
                          <button
                            onClick={handleNextMonth}
                            style={{
                              boxShadow: "none",
                              borderRadius: "30px",
                            }}
                            className={`flex items-center justify-center ${calendarBg} w-10 h-10 md:w-12 md:h-12 flex-shrink-0`}
                          >
                            <ChevronRight className={`${theme.text}`} size={20} />
                          </button>
                        </div>

                        <div className="flex w-auto items-center gap-2">
                          {/* Month Selector */}
                          <div className="relative w-auto">
                            <button
                              onClick={() => {
                                setShowMonthSelector(!showMonthSelector);
                                setShowYearSelector(false);
                              }}
                              style={{
                                boxShadow: "none",
                                borderRadius: "30px",
                                paddingLeft: "12px",
                                paddingRight: "12px",
                              }}
                              className={`flex items-center justify-between ${calendarBg} flex-1 min-w-[90px] h-10 md:h-12`}
                            >
                              <span className={`text-sm font-semibold ${theme.text}`}>
                                {fullMonths[currentDate.getMonth()]}
                              </span>
                              <ChevronDown className={`w-4 h-4 ${theme.text}`} />
                            </button>
                            {showMonthSelector && (
                              <div className="absolute z-20 mt-2 right-0">
                                <MonthSelector
                                  currentMonth={currentDate.getMonth()}
                                  onSelectMonth={(m) => {
                                    handleSelectMonth(m);
                                    setShowMonthSelector(false);
                                  }}
                                  onClose={() => setShowMonthSelector(false)}
                                  isDark={isDark}
                                  theme={theme}
                                />
                              </div>
                            )}
                          </div>

                          {/* Year Selector */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowYearSelector(!showYearSelector);
                                setShowMonthSelector(false);
                              }}
                              style={{
                                boxShadow: "none",
                                borderRadius: "30px",
                                paddingLeft: "12px",
                                paddingRight: "12px",
                              }}
                              className={`flex items-center justify-between ${calendarBg} flex-1 min-w-[80px] h-10 md:h-12`}
                            >
                              <span className={`text-sm font-semibold ${theme.text}`}>
                                {currentDate.getFullYear()}
                              </span>
                              <ChevronDown className={`w-4 h-4 ${theme.text}`} />
                            </button>
                            {showYearSelector && (
                              <div className="absolute z-20 mt-2 right-0">
                                <YearSelector
                                  currentYear={currentDate.getFullYear()}
                                  onSelectYear={(y) => {
                                    handleSelectYear(y);
                                    setShowYearSelector(false);
                                  }}
                                  onClose={() => setShowYearSelector(false)}
                                  isDark={isDark}
                                  theme={theme}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reset Button - Place BEFORE calendar grid */}
                      {selectedDateStats && (
                        <div className="mb-3 flex justify-center">
                          <button
                            onClick={handleResetToTotalView}
                            className={`text-xs px-4 py-2 rounded-full ${theme.purpleBtn} text-white hover:opacity-90 transition-opacity flex items-center gap-2`}
                          >
                            <ArrowLeft size={14} />
                            View All Time Stats
                          </button>
                        </div>
                      )}

                      {/* Calendar Grid */}
                      <div
                        className={`grid grid-cols-7 gap-1 text-center rounded-3xl p-2 mb-2 mr-6 md:mr-0 ${isDark ? theme.bg : "bg-white"
                          }`}
                      >
                        {calendarDays.map((day, idx) => (
                          <div
                            key={idx}
                            onClick={() => setCurrentDate(new Date(day.fullDate))}
                            className={`flex flex-col items-center justify-center p-0.5 transition-all duration-300 cursor-pointer hover:opacity-80 ${day.active ? "text-white" : ""
                              }`}
                            style={
                              day.active
                                ? {
                                  backgroundColor: "#5E5CE6",
                                  borderRadius: "9999px",
                                  marginTop: "-2px",
                                  marginBottom: "-2px",
                                  zIndex: 10,
                                  height: "auto",
                                  minHeight: "50px",
                                  width: "100%",
                                  maxWidth: "36px",
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }
                                : {
                                  height: "auto",
                                  minHeight: "40px",
                                  width: "100%",
                                  maxWidth: "36px",
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }
                            }
                          >
                            <span className="text-[9px] uppercase mb-1 opacity-80">
                              {day.day}
                            </span>
                            <span className="text-sm md:text-base font-bold">
                              {day.date}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Growth Stats */}
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm">
                          <span className={`opacity-50`}>Common growth</span>{" "}
                          {growthStats
                            ? `${parseFloat(growthStats.growthPercentage) >= 0 ? '+' : ''}${growthStats.growthPercentage}%`
                            : 'N/A'} from last {growthStats?.comparisonType || 'day'}
                        </div>
                        <div className={`w-12 h-12 rounded-full ${parseFloat(growthStats?.growthPercentage || 0) >= 0
                          ? 'bg-green-500'
                          : 'bg-red-500'
                          } flex items-center justify-center text-sm font-bold text-white`}>
                          {growthStats
                            ? `${Math.abs(parseFloat(growthStats.growthPercentage)).toFixed(0)}%`
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-on Events */}
                {/* Add-on Events */}
                <div className="flex-1">
                  <div
                    className={`py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col h-full`}
                    style={{ ...cardStyle, borderRadius: "36px" }}
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                      Add-On Events
                    </h3>
                    <div className="flex items-center justify-between flex-1 px-4">
                      <button className={`${theme.subText}`}>
                        <ChevronLeft />
                      </button>
                      <div
                        className="flex gap-4 overflow-x-auto py-4 scrollbar-hide"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {addOnEvents.length > 0 ? (
                          addOnEvents.map((event, idx) => {
                            // Style logic adapted from ConfirmEventView
                            const baseStyle = {
                              borderRadius: "25.33px",
                              transition:
                                "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                            };
                            const shadowDimensions =
                              "6.75px 6.75px 10.13px 0px";

                            // Using "inactive" style as base but with 100% opacity for better visibility in a list
                            // or closely mimicking the "active" style for all since they are just items.
                            // Let's use a style in between: fully visible but using theme colors.

                            const cardStyle = {
                              ...baseStyle,
                              background: isDark ? "#212426" : "#E0E0E0",
                              border: isDark
                                ? "0.84px solid #33373A"
                                : "0.84px solid #D0D0D0",
                              boxShadow: isDark
                                ? `${shadowDimensions} #00000015,-${shadowDimensions} #FFFFFF06`
                                : `${shadowDimensions} #A0A0A040,-${shadowDimensions} #FFFFFF`,
                            };

                            return (
                              <div
                                key={event.id || idx}
                                className={`flex-shrink-0 lg:w-24 lg:h-36 w-20 h-28 p-2 rounded-xl transition-all duration-300 transform-gpu cursor-pointer hover:scale-105`}
                                style={cardStyle}
                                onClick={() => {
                                  navigate(`/ticket/live-add-on-event-view/${event.id}`);
                                }}
                              >
                                <div className="flex flex-col items-center justify-between h-full">
                                  <div className="lg:w-10 lg:h-10 h-8 w-8 mt-4 rounded-full overflow-hidden flex items-center justify-center bg-white">
                                    {event.banner ? (
                                      <img
                                        src={event.banner}
                                        alt={event.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Ticket className="w-5 h-5 text-black" />
                                    )}
                                  </div>
                                  <div
                                    className={`lg:text-xs text-[10px] font-bold ${isDark ? "text-white" : "text-gray-900"
                                      } text-center leading-tight mt-2`}
                                  >
                                    {event.name}
                                  </div>
                                  <p
                                    className={`text-[10px] text-center ${isDark ? "text-gray-400" : "text-gray-500"
                                      } leading-none truncate w-full px-1 mb-1`}
                                  >
                                    {formattedDate}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className={`${theme.subText} text-center py-4`}>
                            No add-on events available
                          </p>
                        )}
                      </div>
                      <button className={`${theme.subText}`}>
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div >
            {/* Footer Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <FooterButton
                theme={theme}
                icon={<Users />}
                text="Guests details"
                onClick={() => {
                  const guests = eventData?.guests || [];
                  if (guests.length > 0) {
                    // Open GuideModal with first guest
                    setSelectedGuest(guests[0]);
                    setShowGuideModal(true);
                  } else {
                    toast.error("No guest details available for this event.");
                  }
                }}
              />
              <FooterButton
                theme={theme}
                icon={<MapPin />}
                text="Event location"
                onClick={handleLocationClick}
              />
              <FooterButton
                theme={theme}
                icon={<Landmark />}
                text="Bank account details"
                onClick={() => {
                  if (eventData?.banking_details && eventData.banking_details.length > 0) {
                    setShowBankAccountDetailsModal(true);
                  } else {
                    toast.error("No bank account details available for this event.");
                  }
                }}
              />
              <FooterButton
                theme={theme}
                icon={<Download />}
                text="Download daily revenue report"
                onClick={() => {
                  toast.success("Download feature coming soon!");
                }}
              />
              {eventData?.event_status === 'live' && (
                <FooterButton
                  theme={theme}
                  icon={isInitingAttendance ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserCheck />}
                  text={isInitingAttendance ? 'Opening...' : 'Mark attendance'}
                  onClick={() => !isInitingAttendance && handleOpenAttendanceScanner(null)}
                />
              )}

              {/* View list — available for live AND completed/cancelled events */}
              {(eventData?.event_status === 'live' || eventData?.event_status === 'cancelled' || eventData?.event_status === 'confirmed') && (
                <FooterButton
                  theme={theme}
                  icon={<QrCode />}
                  text="View attendance list"
                  onClick={() => handleViewAttendanceList(null)}
                />
              )}
            </div>
            {/* Version History Panel — shows when event has been rehosted */}
            {eventData?.version > 1 && (
              <div
                className={`mt-8 p-6 rounded-3xl ${theme.cardBgDarker}`}
                style={{ ...cardStyle, borderRadius: "24px" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="text-emerald-400" size={20} />
                  <h3 className="text-base font-semibold uppercase tracking-wider">
                    Event History
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Current version */}
                  <div className={`flex items-center justify-between p-4 rounded-2xl ${theme.bg}`}>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase">
                        Current — V{eventData.version}
                      </span>
                      <p className={`text-sm mt-1 ${theme.text}`}>
                        Re-hosted on{" "}
                        {eventData.rehosted_at
                          ? new Date(eventData.rehosted_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                          : new Date(eventData.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className={`text-xs ${theme.subText}`}>Revenue</p>
                        <p className={`text-base font-bold text-emerald-400`}>
                          ₹{computedEventData?.totalRevenue ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${theme.subText}`}>Bookings</p>
                        <p className={`text-base font-bold ${theme.text}`}>
                          {computedEventData?.totalBooking ?? 0}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-600 text-white">
                        {eventData.event_status}
                      </span>
                    </div>
                  </div>

                  {/* Previous cancelled version link */}
                  {eventData.original_event_id && (
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${theme.bg} opacity-60`}>
                      <div>
                        <span className="text-xs font-bold text-red-400 uppercase">
                          Previous — V{(eventData.version ?? 2) - 1} (Cancelled)
                        </span>
                        <p className={`text-sm mt-1 ${theme.subText}`}>
                          Original event ID: {eventData.original_event_id?.toString?.()?.slice(-8)}...
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/ticket/live-event-view/${eventData.original_event_id}`
                          )
                        }
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                      >
                        View Old Version
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Modals */}
            {showSeatingModal && (
              <SeatingLayoutModal
                eventData={seatingEvents[currentSeatingIndex] || eventData}
                theme={theme}
                onClose={() => setShowSeatingModal(false)}
                totalSeatingLayouts={seatingEvents.length}
                currentSeatingIndex={currentSeatingIndex}
                onPrevSeating={handlePrevSeating}
                onNextSeating={handleNextSeating}
                formatImagePath={formatImagePath}
              />
            )}

            {showTicketModal && (
              <TicketDetailModal
                theme={theme}
                onClose={() => setShowTicketModal(false)}
                ticketTypes={ticketTypes}
                currentTicketIndex={currentTicketIndex}
                onPrevTicket={handlePrevTicket}
                onNextTicket={handleNextTicket}
                formatImagePath={formatImagePath}
              />
            )}

            {showGuideModal && selectedGuest && (
              <GuideModal
                guest={selectedGuest}
                theme={theme}
                onClose={() => {
                  setShowGuideModal(false);
                  setSelectedGuest(null);
                }}
                formatImagePath={formatImagePath}
                setAppAlert={setAppAlert}
              />
            )}

            {showEventLocationModal && (
              <EventLocationModal
                eventData={eventData}
                theme={theme}
                onClose={() => setShowEventLocationModal(false)}
                setAppAlert={setAppAlert}
              />
            )}

            {showBankAccountDetailsModal && (
              <BankAccountDetailsModal
                theme={theme}
                onClose={() => setShowBankAccountDetailsModal(false)}
                eventData={eventData}
              />
            )}
          </main>
          {/* --- End of Main Content Area --- */}
          < BottomNavigation theme={theme} user={user} />
        </div >
      </div >
      {/* <-- This closing div was missing */}
      {showCancelModal && !cancelSuccess && (
        <EventCancelModal
          theme={theme}
          isDark={isDark}
          eventData={eventData}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          cancelReasonError={cancelReasonError}
          setCancelReasonError={setCancelReasonError}
          isCancelling={isCancelling}
          onConfirm={handleCancelEvent}
          onClose={handleCloseCancelModal}
        />
      )}

      {showCancelModal && cancelSuccess && (
        <EventCancelSuccessModal
          theme={theme}
          isDark={isDark}
          cancellationSummary={cancellationSummary}
          isDownloading={isDownloading}
          downloadError={downloadError}
          onDownload={handleDownloadReport}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showRehostModal && (
        <ReHostModal
          theme={theme}
          isDark={isDark}
          eventData={eventData}
          isRehosting={isRehosting}
          onConfirm={handleRehost}
          onClose={() => setShowRehostModal(false)}
        />
      )}
      {showAttendanceModal && (
        <AttendanceScannerModal
          theme={theme}
          isDark={isDark}
          onClose={() => { setShowAttendanceModal(false); setScanResult(null); setScanError(''); }}
          onScan={handleQRScanned}
          onComplete={handleCompleteAttendance}
          scanResult={scanResult}
          scanError={scanError}
          scanCount={scanCount}
          eventName={eventData?.event_name}
        />
      )}
      {showAttendanceList && (
        <AttendanceListModal
          theme={theme}
          isDark={isDark}
          onClose={() => setShowAttendanceList(false)}
          attendanceData={attendanceData}
          onDownload={handleDownloadAttendance}
          isDownloading={isDownloadingAtt}
          onRemove={handleRemoveAttendee}
        />
      )}
    </>
  );
};

// --- Sub-Components for this page ---

const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]"
    : "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";

function MonthSelector({
  currentMonth,
  onSelectMonth,
  onClose,
  style,
  isDark,
  theme,
}) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg`}
      style={style}
    >
      {months.map((monthName, index) => (
        <button
          key={monthName}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${currentMonth === index
            ? "bg-blue-600 text-blue-100"
            : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
            }`}
          onClick={() => {
            onSelectMonth(index);
            onClose();
          }}
        >
          {monthName}
        </button>
      ))}
    </div>
  );
}

function YearSelector({
  currentYear,
  onSelectYear,
  onClose,
  style,
  isDark,
  theme,
}) {
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg max-h-[13.5rem] overflow-y-auto`}
      style={style}
    >
      {years.map((yearNum) => (
        <button
          key={yearNum}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${currentYear === yearNum
            ? "bg-blue-600 text-blue-100"
            : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
            }`}
          onClick={() => {
            onSelectYear(yearNum);
            onClose();
          }}
        >
          {yearNum}
        </button>
      ))}
    </div>
  );
}

const StatCard = ({ theme, shadow, icon, title, value, color = "" }) => {
  return (
    <div className={`p-6 rounded-3xl ${theme.cardBgDarker}`} style={shadow}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs uppercase font-semibold ${theme.subText}`}>
          {title}
        </span>
        <span className={`text-lg ${color || theme.text}`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color || theme.text}`}>{value}</div>
    </div>
  );
};
const FooterButton = ({ theme, icon, text, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center text-center gap-3 p-4 rounded-full text-white font-medium text-sm hover:opacity-90 transition-opacity`}
    style={{
      background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
    }}
  >
    {icon}
    <span>{text}</span>
  </button>
);
// Bank Account Details Modal Component
const BankAccountDetailsModal = ({ theme, onClose, eventData }) => {
  // Extract bank details from the banking_details array
  const bankDetailsArray = eventData?.banking_details || [];
  const bankDetails = bankDetailsArray.length > 0 ? bankDetailsArray[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`${theme.cardBg} rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}
        style={{
          boxShadow: theme.isDark
            ? "8px 8px 16px 0px #00000040, -8px -8px 16px 0px #FFFFFF0D"
            : "8px 8px 16px 0px #0000001A, -8px -8px 16px 0px #FFFFFF80",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>
            Bank Account Details
          </h2>
          <button
            onClick={onClose}
            className={`${theme.text} hover:opacity-70 transition-opacity`}
          >
            <XCircle size={24} />
          </button>
        </div>

        {bankDetails ? (
          <div className="space-y-4">
            <DetailRow
              label="Account Holder Name"
              value={bankDetails.bank_acc_holder || "N/A"}
              theme={theme}
            />
            <DetailRow
              label="Account Number"
              value={bankDetails.bank_acc_no || "N/A"}
              theme={theme}
            />
            <DetailRow
              label="IFSC Code"
              value={bankDetails.bank_ifsc || "N/A"}
              theme={theme}
            />
            <DetailRow
              label="Account Type"
              value={bankDetails.bank_acc_type || "N/A"}
              theme={theme}
            />
          </div>
        ) : (
          <div className={`text-center py-8 ${theme.subText}`}>
            <p>No bank account details available for this event.</p>
          </div>
        )}
      </div>
    </div>
  );
};
// Helper component for bank details rows
const DetailRow = ({ label, value, theme }) => (
  <div className={`p-4 rounded-xl ${theme.bg}`}>
    <div className={`text-sm ${theme.subText} mb-1`}>{label}</div>
    <div className={`text-base font-semibold ${theme.text}`}>{value}</div>
  </div>
);
const AttendanceScannerModal = ({
  theme, isDark, onClose, onScan, onComplete,
  scanResult, scanError, scanCount, eventName,
}) => {
  const html5QrRef = React.useRef(null);
  const mountedRef = React.useRef(true);
  const lastScanRef = React.useRef(0); // timestamp debounce
  const [scanning, setScanning] = React.useState(false);
  const [camError, setCamError] = React.useState('');
  const [starting, setStarting] = React.useState(true);

  // ── Teardown helper ─────────────────────────────────────────────────────────
  const destroyScanner = React.useCallback(async () => {
    const s = html5QrRef.current;
    if (!s) return;
    html5QrRef.current = null;
    try {
      if (s.isScanning) await s.stop();
    } catch { /* ignore */ }
    try { s.clear(); } catch { /* ignore */ }
  }, []);

  // ── Init once on mount
  React.useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-attendance', { verbose: false });
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.7);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: false,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          },
          (decoded) => {
            if (!decoded || !decoded.trim()) return;
            // Debounce: only block repeat scans, not first-time scans
            const now = Date.now();
            if (now - lastScanRef.current < 2000) return;
            lastScanRef.current = now;
            console.log('[Scanner] QR decoded, length:', decoded.length, 'preview:', decoded.slice(0, 40));
            onScan(decoded);
          },
          () => { } // per-frame fail is normal — stay silent
        );

        if (mountedRef.current) {
          setScanning(true);
          setStarting(false);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setStarting(false);
        const msg = err?.message || '';
        if (msg.includes('NotAllowed') || msg.includes('Permission') || msg.includes('denied')) {
          setCamError('Camera permission denied. Allow camera access in your browser settings and tap "Try Again".');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setCamError('No camera found on this device.');
        } else {
          setCamError(`Could not start camera: ${msg}`);
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      // fire-and-forget cleanup on unmount
      const s = html5QrRef.current;
      if (!s) return;
      html5QrRef.current = null;
      (s.isScanning ? s.stop() : Promise.resolve())
        .catch(() => { })
        .finally(() => { try { s.clear(); } catch { } });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = React.useCallback(async () => {
    setCamError('');
    setStarting(true);
    await destroyScanner();

    try {
      const scanner = new Html5Qrcode('qr-reader-attendance', { verbose: false });
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 30,
          qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decoded) => {
          if (!decoded || !decoded.trim()) return;
          const now = Date.now();
          if (now - lastScanRef.current < 2000) return;
          lastScanRef.current = now;
          onScan(decoded);
        },
        () => { }
      );

      if (mountedRef.current) {
        setScanning(true);
        setStarting(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setStarting(false);
      setCamError(err?.message || 'Could not start camera. Try Again.');
    }
  }, [destroyScanner, onScan]);

  const handleClose = React.useCallback(async () => {
    await destroyScanner();
    onClose();
  }, [destroyScanner, onClose]);

  const handleComplete = React.useCallback(async () => {
    await destroyScanner();
    onComplete();
  }, [destroyScanner, onComplete]);

  // ── Camera viewport ─────────────────────────────────────────────────────────
  const renderCamera = () => {
    if (camError) {
      return (
        <div style={{
          borderRadius: 16, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', padding: '32px 24px', textAlign: 'center'
        }}>
          <XCircle style={{ width: 48, height: 48, color: '#EF4444', margin: '0 auto 12px' }} />
          <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{camError}</p>
          <button onClick={handleRetry}
            style={{
              background: '#6549B8', border: 'none', borderRadius: 10, padding: '8px 20px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, marginTop: 8
            }}>
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        background: '#000', minHeight: 280
      }}>
        {/* Html5Qrcode always needs this element in the DOM from the start */}
        <div id="qr-reader-attendance" style={{ width: '100%' }} />

        {/* Spinner overlay until camera stream starts */}
        {starting && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid #6549B8', borderTopColor: 'transparent',
              animation: 'qrSpin 0.7s linear infinite', marginBottom: 12
            }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Starting camera…</p>
            <style>{`@keyframes qrSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Corner guides */}
        {scanning && !starting && (
          <>
            {[
              { top: 12, left: 12, borderTop: '3px solid #6549B8', borderLeft: '3px solid #6549B8', borderRadius: '6px 0 0 0' },
              { top: 12, right: 12, borderTop: '3px solid #6549B8', borderRight: '3px solid #6549B8', borderRadius: '0 6px 0 0' },
              { bottom: 12, left: 12, borderBottom: '3px solid #6549B8', borderLeft: '3px solid #6549B8', borderRadius: '0 0 0 6px' },
              { bottom: 12, right: 12, borderBottom: '3px solid #6549B8', borderRight: '3px solid #6549B8', borderRadius: '0 0 6px 0' },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', width: 28, height: 28,
                pointerEvents: 'none', ...s
              }} />
            ))}
            <div style={{
              position: 'absolute', left: '14%', right: '14%', height: 2,
              background: 'linear-gradient(90deg,transparent,#6549B8,transparent)',
              animation: 'qrLine 1.6s ease-in-out infinite', top: '50%'
            }} />
            <style>{`
              @keyframes qrLine {
                0%   { transform: translateY(-90px); opacity: 0; }
                10%  { opacity: 1; }
                90%  { opacity: 1; }
                100% { transform: translateY(90px); opacity: 0; }
              }
            `}</style>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className={`${theme.cardBg} rounded-3xl w-full max-w-md overflow-hidden`}
        style={{
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '95vh',
          display: 'flex', flexDirection: 'column'
        }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#6549B8,#1E1242)',
          padding: '20px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode style={{ width: 22, height: 22, color: '#fff' }} />
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>
                Attendance Scanner
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{eventName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleComplete}
              style={{
                background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.5)',
                borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: '#10B981',
                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5
              }}>
              <CheckCircle style={{ width: 13, height: 13 }} /> Done
            </button>
            <button onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
              <XCircle style={{ width: 16, height: 16, color: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Scan counter */}
        <div style={{
          padding: '12px 24px 0', display: 'flex',
          justifyContent: 'center', flexShrink: 0
        }}>
          <div style={{
            background: '#6549B8', borderRadius: 20, padding: '6px 20px',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <UserCheck style={{ width: 16, height: 16, color: '#fff' }} />
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {scanCount} scanned
            </span>
          </div>
        </div>

        {/* Camera area */}
        <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
          {renderCamera()}
          <p style={{
            textAlign: 'center', marginTop: 8, marginBottom: 0, fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
          }}>
            {camError ? '' :
              scanning ? 'Hold ticket QR steady inside the frame' :
                'Initialising camera…'}
          </p>
        </div>

        {/* Result / error */}
        <div style={{ padding: '12px 24px 20px', overflowY: 'auto', flex: 1 }}>
          {scanResult && (
            <div style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.28)', borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(16,185,129,0.20)', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <CheckCircle style={{ width: 17, height: 17, color: '#10B981', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#10B981', fontWeight: 700, fontSize: 12, margin: 0 }}>
                    ✓ Attendance marked — closing in 3 s
                  </p>
                  <p style={{
                    color: 'rgba(16,185,129,0.7)', fontSize: 10, margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    #{(scanResult.bookingRef || scanResult.transactionId || scanResult.bookingId || '').toUpperCase()}
                  </p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.25)', borderRadius: 6, padding: '3px 8px' }}>
                  <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, margin: 0 }}>
                    #{scanCount}
                  </p>
                </div>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <ScanDetailRow label="Ticket holder"
                  value={scanResult.holderName || scanResult.userName || '—'}
                  isDark={isDark} fullWidth />
                <ScanDetailRow label="Event"
                  value={scanResult.eventName || '—'} isDark={isDark} fullWidth />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 5, marginBottom: 5 }}>
                  <ScanDetailRow label="Type" value={scanResult.ticketType || '—'} isDark={isDark} />
                  <ScanDetailRow label="Qty" value={String(scanResult.quantity ?? 1)} isDark={isDark} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 5 }}>
                  <ScanDetailRow label="Date" value={scanResult.eventDate || '—'} isDark={isDark} />
                  <ScanDetailRow label="Time" value={scanResult.eventTime || '—'} isDark={isDark} />
                </div>
                <ScanDetailRow label="Venue" value={scanResult.venue || '—'} isDark={isDark} fullWidth />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 5 }}>
                  <ScanDetailRow label="Payment" value={scanResult.paymentMethod || '—'} isDark={isDark} />
                  <ScanDetailRow label="Amount"
                    value={scanResult.totalAmount > 0
                      ? `₹${Number(scanResult.totalAmount).toLocaleString('en-IN')}`
                      : 'Free'}
                    isDark={isDark} highlight />
                </div>
                <ScanDetailRow label="Transaction ID"
                  value={scanResult.bookingRef || scanResult.bookingId || '—'}
                  isDark={isDark} fullWidth mono />
              </div>
            </div>
          )}

          {scanError && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14,
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <XCircle style={{ width: 18, height: 18, color: '#EF4444', flexShrink: 0 }} />
              <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{scanError}</p>
            </div>
          )}

          {!scanResult && !scanError && scanning && (
            <div style={{
              textAlign: 'center', padding: '8px 0', fontSize: 13,
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }}>
              Waiting for scan…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Attendance List Modal 
const AttendanceListModal = ({ theme, isDark, onClose, attendanceData, onDownload, isDownloading, onRemove }) => {
  const rows = attendanceData?.attendees || [];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className={`${theme.cardBg} rounded-3xl w-full max-w-3xl`} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#6549B8,#1E1242)', padding: '20px 24px', borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck style={{ width: 22, height: 22, color: '#fff' }} />
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Attendance List</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{attendanceData?.eventName || 'Event'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onDownload('excel')} disabled={isDownloading} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download style={{ width: 14, height: 14 }} /> Excel
            </button>
            <button onClick={() => onDownload('pdf')} disabled={isDownloading} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download style={{ width: 14, height: 14 }} /> PDF
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle style={{ width: 16, height: 16, color: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, display: 'flex', gap: 24, flexShrink: 0 }}>
          {[
            { label: 'Total Booked', val: attendanceData?.totalBooked || 0, color: '#6549B8' },
            { label: 'Present', val: attendanceData?.totalPresent || 0, color: '#10B981' },
            { label: 'Absent', val: Math.max(0, (attendanceData?.totalBooked || 0) - (attendanceData?.totalPresent || 0)), color: '#EF4444' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ color, fontWeight: 700, fontSize: 20, margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', padding: '0 8px 16px', flex: 1 }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
              <UserCheck style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No attendees scanned yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                  {['#', 'Name', 'Ticket Type', 'Qty', 'Payment', 'Scanned At', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((att, idx) => (
                  <tr key={att.bookingId || idx} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                    <td style={{ padding: '10px 14px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{idx + 1}</td>
                    {/* ✅ Fix: use holderName first */}
                    <td style={{ padding: '10px 14px', color: isDark ? '#fff' : '#111', fontWeight: 500 }}>
                      {att.holderName || att.userName || att.userId}
                    </td>
                    <td style={{ padding: '10px 14px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{att.ticketType || '-'}</td>
                    <td style={{ padding: '10px 14px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{att.quantity}</td>
                    <td style={{ padding: '10px 14px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{att.paymentMethod || '-'}</td>
                    <td style={{ padding: '10px 14px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 12 }}>
                      {att.scannedAt ? new Date(att.scannedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    {/* ✅ New: undo scan button */}
                    {onRemove && (
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => onRemove(att.bookingId)}
                          title="Undo scan"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#EF4444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <XCircle style={{ width: 12, height: 12 }} /> Undo
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
// ── Shared scan detail row — used inside scanner modals for both main and sub-events ──
function ScanDetailRow({ label, value, isDark, fullWidth = false, mono = false, highlight = false }) {
  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      borderRadius: 8,
      padding: '6px 9px',
      marginBottom: fullWidth ? 5 : 0,
      width: '100%',
    }}>
      <p style={{
        color: isDark ? 'rgba(209,250,229,0.40)' : 'rgba(6,95,70,0.45)',
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        margin: '0 0 2px',
      }}>
        {label}
      </p>
      <p style={{
        color: highlight
          ? '#10B981'
          : isDark ? '#d1fae5' : '#065f46',
        fontSize: 11,
        fontWeight: highlight ? 700 : 600,
        margin: 0,
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all',
        lineHeight: 1.4,
      }}>
        {value}
      </p>
    </div>
  );
}
export default LiveEventsPage;
