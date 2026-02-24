import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import SearchBar from "../../components/HomePage/SearchBar";
import SideBar from "../../components/HomePage/SideBar";
import BottomNavigation from "../../components/HomePage/BottomNavigation";
import EventLocationModal from "../../components/ViewSingleEvent/EventLocationModal";
import GuideModal from "../../components/ViewSingleEvent/GuideModal";
import WieLogo from "../../assets/HomePage/WieLogo.svg?url";
import { toast } from "react-hot-toast";
import {
  getMyLiveEventView,
  getGroupView,
  getTicketById,
  getAddOnEventLiveView,
  getEventMetrics, // Import the new service function
} from "../../services/ticketService";
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
  ChevronRight,
  ChevronDown,
  Hash,
} from "lucide-react";
import Card from "../../components/ViewSingleEvent/Card";
import InsetCard from "../../components/ViewSingleEvent/InsetCard";
import Bank_Details from "../../assets/ViewSingleEvent/Bank_Details.svg";
import LeftIcon from "../../assets/ViewSingleEvent/LeftIcon.svg";
import RightIcon from "../../assets/ViewSingleEvent/RightIcon.svg";
import { getImageUrl } from "../../utils/imageUtils";
import TicketDetailModal from "../../components/ViewSingleEvent/TicketDetailModal";
import SeatingLayoutModal from "../../components/ViewSingleEvent/SeatingLayoutModal";

const HEADER_HEIGHT = 72; // From HomePage

const getNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_5px_5px_10px_#1a1b1e,inset_-5px_-5px_10px_#3c3f44]"
    : "shadow-[inset_5px_5px_10px_#a4a4a4,inset_-5px_-5px_10px_#ffffff]";

// Main Component
const LiveAddOnEventView = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  // Modal State
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentSeatingIndex, setCurrentSeatingIndex] = useState(0);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [showEventLocationModal, setShowEventLocationModal] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [appAlert, setAppAlert] = useState(null);
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  // API State Management
  const [eventData, setEventData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [metrics, setMetrics] = useState(null); // State for metrics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const dateOptions = { month: "short", day: "numeric" };
  const eventDates = eventData?.event_dates || [];
  const rawStart = eventDates[0]?.start_date;
  const lastEntry = eventDates[eventDates.length - 1];
  const rawEnd   = lastEntry?.end_date || lastEntry?.start_date;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleGuestClick = (guest) => {
    setSelectedGuest(guest);
    setShowGuideModal(true);
  };
  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuest(null);
  };
  const handlePrevGuide = () => {
    setCurrentGuideIndex((prev) => Math.max(0, prev - 1));
  };
  
  const handleNextGuide = () => {
    const guidesToShow = viewportWidth >= 768 ? 3 : 2;
    const maxIndex = Math.max(0, (eventData?.guests?.length || 0) - guidesToShow);
    setCurrentGuideIndex((prev) => Math.min(maxIndex, prev + 1));
  };
  // Fetch event data
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

        // Fetch sub-event data using getAddOnEventLiveView
        const ticketResponse = await getAddOnEventLiveView(ticketId);

        // Extract event data - Handle multiple response structures (Robust extraction)
        let data;
        if (ticketResponse?.data?.subEvent) {
          data = {
            ...ticketResponse.data.subEvent,
            groupId: ticketResponse.data.parentEvent?.groupId,
            parentEventId: ticketResponse.data.parentEvent?._id, // Store parent event ID
          };
        } else {
          data =
            ticketResponse?.ticket ||
            ticketResponse?.data?.ticket ||
            ticketResponse?.data ||
            ticketResponse;
        }

        if (!data) {
          throw new Error("No event data received from server");
        }

        if (!data.event_name) {
          throw new Error("Invalid event data structure");
        }
        setEventData(data);

        // Fetch group data using parent event ID if available
        if (data.parentEventId) {
          try {
            const groupResponse = await getGroupView(data.parentEventId); // Use parent event ID instead
            const fetchedGroup =
              groupResponse?.data?.group ||
              groupResponse?.group ||
              groupResponse?.data ||
              groupResponse;

            if (fetchedGroup) {
              setGroupData(fetchedGroup);
              setGroupName(fetchedGroup.name || "Unknown Group");
            }
          } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
            // Don't block UI, continue without group data
          }
        } else if (data.groupId) {
          // Fallback: If we have groupId but no parentEventId, try with current ticketId
          // (This might fail but worth trying)
          try {
            const groupResponse = await getGroupView(ticketId);
            const fetchedGroup =
              groupResponse?.data?.group ||
              groupResponse?.group ||
              groupResponse?.data ||
              groupResponse;

            if (fetchedGroup) {
              setGroupData(fetchedGroup);
              setGroupName(fetchedGroup.name || "Unknown Group");
            }
          } catch (groupErr) {
            console.warn("Failed to fetch group data with ticketId:", groupErr);
          }
        }

        // Fetch event metrics
        try {
          const metricsResponse = await getEventMetrics(ticketId);
          if (metricsResponse?.data) {
            setMetrics(metricsResponse.data);
          }
        } catch (metricsErr) {
          console.warn("Failed to fetch event metrics:", metricsErr);
          // Don't block the UI if metrics fail, just use defaults
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
  // Computed values from API data
  const computedEventData = eventData
    ? {
      name: eventData.event_name || "Event Name",
      creator: eventData.created_by || "Unknown Creator",
      // These fields are now fetched from getEventMetrics, falling back to eventData or defaults
      totalRevenue: metrics?.totalRevenue ?? eventData.total_revenue ?? "0",
      totalBooking: metrics?.totalTicketsSold ?? eventData.totalTicketsSold ?? "0",
      totalLikes: metrics?.totalLikes ?? eventData.like ?? "0",
      totalShare: metrics?.totalShare ?? eventData.share_count ?? "0",
      totalCancellation: metrics?.total_cancellation ?? eventData.total_cancellations ?? "0",
      addOnRevenue: eventData.addon_revenue || "$0",
      addOnRevenueMonth: eventData.addon_revenue_month || "$0",
    }
    : null;

  // Bank View Logic (Moved here to have access to eventData)
  const allEventsForBankView = React.useMemo(() => {
    if (!eventData) return [];

    const currentEvent = {
      name: eventData.event_name,
      isPaid: eventData.payment_type === "paid",
      isPrimary: true,
      bankDetails:
        eventData.banking_details || groupData?.banking_details || [],
      order: 0,
    };
    return [currentEvent];
  }, [eventData, groupData]);
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
  const [currentEventBankIndex, setCurrentEventBankIndex] = useState(0);

  const currentEventForBankView = React.useMemo(() => {
    return allEventsForBankView[currentEventBankIndex] || {};
  }, [allEventsForBankView, currentEventBankIndex]);

  const currentBankDetailsList = React.useMemo(() => {
    return currentEventForBankView.bankDetails || [];
  }, [currentEventForBankView]);

  const [currentBankDetailsIndex, setCurrentBankDetailsIndex] = useState(0);

  const currentBankInfo = React.useMemo(() => {
    return currentBankDetailsList[currentBankDetailsIndex] || {};
  }, [currentBankDetailsList, currentBankDetailsIndex]);

  const handlePrevEventForBankView = () => {
    setCurrentEventBankIndex((prev) => {
      const newIndex = prev === 0 ? allEventsForBankView.length - 1 : prev - 1;
      setCurrentBankDetailsIndex(0);
      return newIndex;
    });
  };

  const handleNextEventForBankView = () => {
    setCurrentEventBankIndex((prev) => {
      const newIndex = prev === allEventsForBankView.length - 1 ? 0 : prev + 1;
      setCurrentBankDetailsIndex(0);
      return newIndex;
    });
  };

  const formatImagePath = (path) => getImageUrl(path, "ticket");

  // Helper for Seating Events
  const seatingEvents = React.useMemo(() => {
    if (!eventData) return [];
    const allEvents = [];
    if (eventData.location_type === "offline" && eventData.ticket_layout) {
      allEvents.push(eventData);
    }
    // Sub-events usually don't have their own sub-events, but keeping logic consistent
    if (eventData.sub_events) {
      eventData.sub_events.forEach((sub) => {
        if (sub.location_type === "offline" && sub.ticket_layout) {
          allEvents.push(sub);
        }
      });
    }
    return allEvents;
  }, [eventData]);

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
  const chartData = eventData?.revenue_data || [
    { month: "JAN", value: 320, height: "h-24" },
    { month: "FEB", value: 320, height: "h-32" },
    { month: "MAR", value: 320, height: "h-28" },
    { month: "APR", value: 320, height: "h-20" },
    { month: "MAY", value: 320, height: "h-40" },
    { month: "JUN", value: 320, height: "h-28" },
    { month: "JUL", value: 320, height: "h-24" },
    { month: "AUG", value: 320, height: "h-16" },
  ];
  const generateCalendarDays = () => {
    // Rely on currentDate state for calendar navigation
    // We want to show a week or a month? The original code showed a week starting from event date or today.
    // To support "Calendar Controls" (Month/Year), we usually show the whole month or at least a week within that month.
    // The user's request is "check for calendar controls... implement the same buttons".
    // I will anchor the 7-day view to the 'currentDate' state.

    // Logic: Show 7 days starting from the beginning of the week of 'currentDate'
    // OR if we want to show strict days of the selected month/year.
    // Let's stick to the "week" view but updated by the controls for now, as the grid is 7 cols but only 1 row (based on original code).
    // Wait, original code: for (let i = 0; i < 7; i++)

    // Better Approach: 'currentDate' represents the focal point.
    // If the user changes Month/Year, 'currentDate' updates.
    // We display the week containing 'currentDate', or just the first 7 days of that month?
    // Let's display the week containing 'currentDate'.

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
  const addOnEvents =
    eventData?.sub_events?.map((subEvent) => ({
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
      shadowOutset:
        "6px 6px 12px 0px #00000040, -6px -6px 12px 0px #FFFFFF0D",
      shadowInset:
        "inset 6px 6px 12px 0px #0000002E, inset -6px -6px 12px 0px #FFFFFF14",
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
      shadowOutset:
        "6px 6px 12px 0px rgba(0,0,0,0.1), -6px -6px 12px 0px rgba(255,255,255,0.8)",
      shadowInset:
        "inset 6px 6px 12px 0px rgba(0,0,0,0.05), inset -6px -6px 12px 0px rgba(255,255,255,0.8)",
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

  const formattedDate    = rawStart
  ? new Date(rawStart).toLocaleDateString("en-US", dateOptions)
  : "N/A";
  const formattedEndDate = rawEnd
    ? new Date(rawEnd).toLocaleDateString("en-US", dateOptions)
    : "N/A";

  const isSameDay =
    formattedDate !== "N/A" &&
    formattedEndDate !== "N/A" &&
    formattedDate === formattedEndDate;

  const formattedDateLabel =
    formattedDate === "N/A"
      ? "N/A"
      : isSameDay
      ? formattedDate                              
      : formattedEndDate !== "N/A"
      ? `${formattedDate} – ${formattedEndDate}` 
      : formattedDate;                            

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
              <div className="flex items-center gap-3 flex-wrap pb-2 lg:pb-0 mt-4 lg:mt-0">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${theme.inactivePill} ml-auto lg:ml-0 text-blue-500`}
                >
                  {formattedDateLabel}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Left Side: Total Revenue & Total Booking */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<Lock />}
                title="TOTAL REVENUE"
                value={`$${computedEventData?.totalRevenue || "0"}`}
                color={theme.subText}
              />
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<LayoutGrid />}
                title="TOTAL BOOKING"
                value={computedEventData?.totalBooking || "0"}
                color={theme.subText}
              />
              {/* Right Side: Combined Likes/Share (Total Cancellation removed) */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<XCircle />}
                title="TOTAL CANCELLATION"
                value={computedEventData?.totalCancellation || "0"}
                color={theme.subText}
              />
              <div
                className={`p-6 rounded-3xl ${theme.cardBgDarker}`}
                style={{ ...cardStyle, borderRadius: "20px" }}
              >
                <div className="flex justify-around items-center">
                  {/* Total Likes Section */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}
                    >
                      TOTAL LIKES
                    </span>
                    <Heart className="text-pink-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalLikes || "0"}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-16 w-px bg-gray-600"></div>

                  {/* Total Share Section */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}
                    >
                      TOTAL SHARE
                    </span>
                    <Share2 className="text-blue-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalShare || "0"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
              {/* Left Column: Total Booking of Add-On Events Chart */}
              {/* Left Column: Guides and Bank Details */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Guides Container */}
                <div
                  style={{
                    height: "252px",
                    borderRadius: "36px",
                    padding: "28px 21px",
                    gap: "16px",
                    ...cardStyle,
                  }}
                  className={`py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col h-full`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-yellow-500" />
                    <h3 className={`text-lg font-bold ${theme.text}`}>Guest</h3>
                  </div>

                  {eventData?.guests && eventData.guests.length > 0 ? (
                    <div className="flex items-center gap-2 h-full">
                      {/* Previous Button */}
                      <button
                        onClick={handlePrevGuide}
                        disabled={currentGuideIndex === 0}
                        className={`flex-shrink-0 p-2 rounded-full ${
                          currentGuideIndex === 0
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:opacity-70 cursor-pointer"
                        } ${theme.text}`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      {/* Guide Carousel Container */}
                      <div className="flex-grow relative overflow-hidden h-full py-2">
                        <div className="flex justify-center items-start h-full">
                          <div
                            className="flex items-center gap-4 transition-transform duration-300 -mt-2"
                            style={{
                              transform: `translateX(calc(-${
                                currentGuideIndex * (viewportWidth >= 768 ? 33.33 : 50)
                              }%))`,
                            }}
                          >
                            {eventData.guests.map((guest, index) => (
                              <div
                                key={guest.guest_name || index}
                                onClick={() => handleGuestClick(guest)}
                                style={{
                                  borderRadius: "17.82px",
                                  background: theme.isDark ? "#212426" : "#E0E0E0",
                                  boxShadow: theme.isDark
                                    ? `3.71px 4.45px 6.68px 0px #00000075,
                                      -1.48px -1.48px 7.42px 0px #63636336`
                                    : `3.71px 4.45px 6.68px 0px #A0A0A099,
                                      -1.48px -1.48px 7.42px 0px #FFFFFF`,
                                  minWidth: viewportWidth >= 768 ? 'calc(33.33% - 10.67px)' : 'calc(50% - 8px)',
                                  flexShrink: 0,
                                }}
                                className="
                                  p-4 text-center rounded-lg cursor-pointer
                                  transition-transform duration-300
                                  hover:-translate-y-1
                                "
                              >
                                <div
                                  className="relative w-full rounded-lg mx-auto mb-3 overflow-hidden"
                                  style={{ paddingTop: '100%' }}
                                >
                                  <img
                                    src={getImageUrl(guest.guest_profile, 'ticket')}
                                    alt={guest.guest_name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                </div>
                                <p className={`text-base font-medium ${theme.textColor} truncate px-1`}>
                                  {guest.guest_name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Next Button */}
                      <button
                        onClick={handleNextGuide}
                        disabled={
                          currentGuideIndex >=
                          (eventData?.guests?.length || 0) - (viewportWidth >= 768 ? 3 : 2)
                        }
                        className={`flex-shrink-0 p-2 rounded-full ${
                          currentGuideIndex >=
                          (eventData?.guests?.length || 0) - (viewportWidth >= 768 ? 3 : 2)
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:opacity-70 cursor-pointer"
                        } ${theme.text}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1">
                      <p className={`${theme.subText} text-center`}>
                        You haven't added any guides or guest.
                      </p>
                    </div>
                  )}
                </div>
                {/* Bank Details Container (Updated to match ConfirmEvents.jsx) */}
                {(() => {
                  // Helper function for neumorphic shadows
                  const getNeumorphicShadows = (isDark) => {
                    if (isDark) {
                      return "shadow-[8px_8px_12px_0px_#00000029,-8px_-8px_12px_0px_#FFFFFF0A]";
                    } else {
                      return "shadow-[8px_8px_12px_0px_#A0A0A099,-8px_-8px_12px_0px_#FFFFFF]";
                    }
                  };

                  const bankDetails = currentBankDetailsList;
                  const currentIndex = currentBankDetailsIndex;
                  const currentAccount = currentBankInfo;
                  const loadingBank = false; // Data is already loaded

                  if (bankDetails.length === 0) {
                    return (
                      <div
                        className={`w-full p-4 sm:p-6 rounded-3xl font-sans ${theme.cardBgDarker} flex flex-col justify-between`}
                        style={{
                          minHeight: "280px",
                          borderRadius: "36px",
                          ...cardStyle,
                        }}
                      >
                        {/* Always show Header even in empty state */}
                        <header className="flex items-center justify-between pb-4 mb-6 flex-wrap gap-4">
                          <div className="flex items-center">
                            <Landmark className="h-6 w-6 text-green-500" />
                            <h1
                              className={`ml-3 text-sm sm:text-base font-bold ${theme.text} tracking-wide`}
                            >
                              BANK ACCOUNT DETAILS
                            </h1>
                          </div>
                        </header>

                        <div className="flex flex-col items-center justify-center flex-1 text-center">
                          <p className={`${theme.subText} text-lg font-medium`}>
                            No bank account added
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`w-full p-4 sm:p-6 rounded-3xl font-sans ${theme.cardBgDarker} flex flex-col justify-between`}
                      style={{
                        minHeight: "280px",
                        borderRadius: "36px",
                        ...cardStyle,
                      }}
                    >
                      {/* Card Header */}
                      <header
                        className={`flex items-center justify-between border-b ${isDark ? "border-gray-700" : "border-gray-200"
                          } pb-4 mb-6 flex-wrap gap-4`}
                      >
                        <div className="flex items-center">
                          <Landmark className="h-8 w-8 text-green-500" />
                          <h1
                            className={`ml-3 text-sm sm:text-base font-bold ${theme.text} tracking-wide`}
                          >
                            BANK ACCOUNT DETAILS
                          </h1>
                        </div>
                        {bankDetails.length > 1 && (
                          <button
                            onClick={() => navigate("/ticket/bank-details")}
                            className="whitespace-nowrap text-xs sm:text-sm font-semibold text-purple-600 border border-purple-300 rounded-full px-4 py-1.5 sm:px-5 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300"
                          >
                            see all
                          </button>
                        )}
                      </header>

                      {/* Card Body with Details */}
                      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 content-center">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${theme.subText}`}>
                            Account holder:
                          </p>
                          <p
                            className={`text-sm ${theme.text} ${isDark ? "bg-gray-700" : "bg-gray-500"
                              } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[140px] md:max-w-[200px]`}
                          >
                            {currentAccount.bank_acc_holder || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${theme.subText}`}>
                            Account type:
                          </p>
                          <p
                            className={`text-sm ${theme.text} ${isDark ? "bg-gray-700" : "bg-gray-500"
                              } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[140px] md:max-w-[200px]`}
                          >
                            {currentAccount.bank_acc_type || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${theme.subText}`}>
                            IFSC code:
                          </p>
                          <p
                            className={`text-sm ${theme.text} ${isDark ? "bg-gray-700" : "bg-gray-500"
                              } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[140px] md:max-w-[200px]`}
                          >
                            {currentAccount.bank_ifsc || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${theme.subText}`}>
                            Account number:
                          </p>
                          <p
                            className={`text-sm ${theme.text} ${isDark ? "bg-gray-700" : "bg-gray-500"
                              } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[140px] md:max-w-[200px]`}
                          >
                            {currentAccount.bank_acc_no || "N/A"}
                          </p>
                        </div>
                      </main>

                      {/* Card Footer/Pagination indicator */}
                      <footer className="flex justify-center items-center gap-3 mt-6">
                        {bankDetails.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setCurrentBankDetailsIndex(
                                  Math.max(0, currentIndex - 1),
                                )
                              }
                              disabled={currentIndex === 0}
                              className={`text-xs ${currentIndex === 0
                                  ? "opacity-30 cursor-not-allowed"
                                  : "hover:opacity-80 cursor-pointer"
                                } ${theme.text}`}
                            >
                              ←
                            </button>
                            <div className="flex gap-2">
                              {bankDetails.map((_, index) => (
                                <div
                                  key={index}
                                  onClick={() =>
                                    setCurrentBankDetailsIndex(index)
                                  }
                                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${index === currentIndex
                                      ? isDark
                                        ? "bg-purple-500"
                                        : "bg-purple-600"
                                      : isDark
                                        ? "bg-gray-600"
                                        : "bg-gray-400"
                                    }`}
                                ></div>
                              ))}
                            </div>
                            <button
                              onClick={() =>
                                setCurrentBankDetailsIndex(
                                  Math.min(
                                    bankDetails.length - 1,
                                    currentIndex + 1,
                                  ),
                                )
                              }
                              disabled={currentIndex === bankDetails.length - 1}
                              className={`text-xs ${currentIndex === bankDetails.length - 1
                                  ? "opacity-30 cursor-not-allowed"
                                  : "hover:opacity-80 cursor-pointer"
                                } ${theme.text}`}
                            >
                              →
                            </button>
                          </>
                        )}
                        {bankDetails.length === 1 && (
                          <div
                            className={`w-2.5 h-2.5 ${isDark ? "bg-purple-500" : "bg-purple-600"
                              } rounded-full`}
                          ></div>
                        )}
                      </footer>
                    </div>
                  );
                })()}
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
                        Seating layout
                      </span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="flex-1">
                    <div
                      className={`h-full p-4 sm:p-6 md:p-1 lg:p-6 ${isDark ? theme.cardBgDarker : ""
                        }`}
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
                            <ChevronLeft
                              className={`${theme.text}`}
                              size={20}
                            />
                          </button>
                          <button
                            onClick={handleNextMonth}
                            style={{
                              boxShadow: "none",
                              borderRadius: "30px",
                            }}
                            className={`flex items-center justify-center ${calendarBg} w-10 h-10 md:w-12 md:h-12 flex-shrink-0`}
                          >
                            <ChevronRight
                              className={`${theme.text}`}
                              size={20}
                            />
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
                              <span
                                className={`text-sm font-semibold ${theme.text}`}
                              >
                                {fullMonths[currentDate.getMonth()]}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 ${theme.text}`}
                              />
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
                              <span
                                className={`text-sm font-semibold ${theme.text}`}
                              >
                                {currentDate.getFullYear()}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 ${theme.text}`}
                              />
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
                      <div
                        className={`grid grid-cols-7 gap-1 text-center rounded-3xl p-2 mb-2 mr-6 md:mr-0 ${isDark ? theme.bg : "bg-white"
                          }`}
                      >
                        {calendarDays.map((day, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center justify-center p-0.5 transition-all duration-300 ${day.active ? "text-white" : ""
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
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm">
                          <span className={`opacity-50`}>Common growth</span>{" "}
                          14% from last day
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-black">
                          64%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-on Events */}
                {/* Add-on Events */}
                {/* HASHTAGS Section */}
                <div className="">
                  <div
                    className={`py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col`}
                    style={{
                      ...cardStyle,
                      borderRadius: "36px",
                      minHeight: "280px",
                    }}
                  >
                    {/* Hashtags Section - Replaces Add-On Events */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500 rounded-full p-1.5 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-white" />
                      </div>
                      <h3 className={`text-lg font-bold ${theme.text}`}>
                        HASHTAGS
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-[10px] content-start overflow-y-auto h-full p-2">
                      {eventData?.hashtag && eventData.hashtag.length > 0 ? (
                        eventData.hashtag.map((tag, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-center text-white"
                            style={{
                              width: "145px",
                              height: "37px",
                              background: "#249EFF",
                              borderRadius: "12px",
                              padding: "10px 40px",
                              opacity: 1,
                              // Angle 0 deg? Assuming normal rotation.
                            }}
                          >
                            #{tag.replace(/^#/, "")}
                          </div>
                        ))
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className={`${theme.subText} text-sm text-center`}>
                            No hashtags added
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Footer Buttons moved below Hashtags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FooterButton
                  theme={theme}
                  icon={<MapPin />}
                  text="Event location"
                  onClick={handleLocationClick}
                />
                  <FooterButton
                    theme={theme}
                    icon={<Download />}
                    text="Download daily revenue report"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
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
            {showEventLocationModal && isApiReady && (
              <EventLocationModal
                eventData={eventData}
                theme={theme}
                onClose={() => setShowEventLocationModal(false)}
                setAppAlert={setAppAlert}
              />
            )}
            {showGuideModal && selectedGuest && (
              <GuideModal
                guest={selectedGuest}
                theme={theme}
                onClose={handleCloseGuideModal}
                formatImagePath={formatImagePath}
                setAppAlert={setAppAlert}
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
          </main>
          {/* --- End of Main Content Area --- */}
          <BottomNavigation theme={theme} user={user} />
        </div>
      </div>
      {/* <-- This closing div was missing */}
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
export default LiveAddOnEventView;
