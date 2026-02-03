import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import { getMyPreviousEventView, getGroupView, getPreviousEventMonthlyStats, getPreviousEventCapacityStats,getPreviousEventView } from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import CalenderIcon from "../../assets/PreviousEventView/CalenderIcon.svg";
import DownloadIcon from "../../assets/PreviousEventView/DownloadIcon.svg";
import EarningIcon from "../../assets/PreviousEventView/EarningIcon.svg";
import LikeIcon from "../../assets/PreviousEventView/LikeIcon.svg";
import MapIcon from "../../assets/PreviousEventView/MapIcon.svg";
import PublicIcon from "../../assets/PreviousEventView/PublicIcon.svg";
import ShareIcon from "../../assets/PreviousEventView/ShareIcon.svg";
import TagIcon from "../../assets/PreviousEventView/TagIcon.svg";
import ViewIcon from "../../assets/PreviousEventView/ViewIcon.svg";
import SeatIcon from "../../assets/PreviousEventView/SeatIcon.svg";
import TicketIcon from "../../assets/PreviousEventView/TicketIcon.svg";
import CancelIcon from "../../assets/PreviousEventView/CancelIcon.svg";
import BoxIcon from "../../assets/PreviousEventView/BoxIcon.svg";
import LiveEventIcon from "../../assets/PreviousEventView/LiveEventIcon.svg";
import BankIcon from "../../assets/PreviousEventView/BankIcon.svg";
import ChatIcon from "../../assets/PreviousEventView/ChatIcon.svg";
import NotificationIcon from "../../assets/PreviousEventView/NotificationIcon.svg";
import ImageModal from "../../components/ViewSingleEvent/ImageModal";
import { ChevronLeft } from "lucide-react";


const HEADER_HEIGHT = 72;

const CustomScrollbarStyles = () => (
  <style>{`
    * {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    *::-webkit-scrollbar {
      display: none;
    }

    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }

    /* Custom scrollbar for quarters section */
    .scrollbar-thin {
      scrollbar-width: thin;
      scrollbar-color: #4b5563 transparent;
    }

    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
      display: block;
    }

    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: #6a47fa;
      border-radius: 3px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: #5a3fea;
    }

    /* hide scrollbar for overflow-x containers where we want to allow touch scroll only */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @media (min-width: 1024px) and (max-width: 1024px) and (min-height: 600px) and (max-height: 600px) {
      html {
        font-size: 12px;
      }
    }

    @media (min-width: 1280px) and (max-width: 1280px) and (min-height: 800px) and (max-height: 800px) {
      html {
        font-size: 14px;
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      html {
        font-size: 13px;
      }
    }

    @media (min-width: 1440px) {
      html {
        font-size: 16px;
      }
    }
  `}</style>
);

const PreviousEventView = () => {
  const { ticketId } = useParams(); // Note: Change from ticketId to ticketId if needed
  const { user } = useSelector((state) => state.auth);
  const [eventData, setEventData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [quarterStats, setQuarterStats] = useState([]);
  const [capacityStats, setCapacityStats] = useState(null);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!ticketId) {
        setError("Event ID not found in URL parameters.");
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
        setError(null);
        
        // ✅ Fetch main event data
        const eventResponse = await getPreviousEventView(ticketId);
        
        if (!eventResponse.success) {
          throw new Error(eventResponse.message || "Failed to load event data");
        }
  
        const data = eventResponse.data;
        
        // Transform data to match component structure
        const transformedData = {
          event_name: data.eventName,
          event_banner: data.eventBanner,
          event_logo: data.eventLogo,
          event_images: data.eventImages || [],
          like: data.totalLikes,
          share_count: data.totalShares,
          location_type: data.location_type,
          location: data.location,
          venue: data.venue,
          total_bookings: data.totalBookings,
          total_earnings: data.totalRevenue,
          total_cancellations: data.totalCancellations,
          hashtag: Array(data.tagCount).fill('#'),
          banking_details: data.bankDetails,
          sub_events: data.subEvents,
          event_dates: data.eventDates,
          total_capacity: data.totalCapacity,
        };
        
        setEventData(transformedData);
  
        // ✅ Fetch monthly and quarterly stats
        try {
          const statsResponse = await getPreviousEventMonthlyStats(ticketId);
          if (statsResponse.success) {
            setMonthlyStats(statsResponse.data.monthlyStats || []);
            setQuarterStats(statsResponse.data.quarterStats || []);
          }
        } catch (statsErr) {
          console.warn("Monthly stats not available:", statsErr);
          setMonthlyStats([]);
          setQuarterStats([]);
        }
  
        // ✅ Fetch capacity stats
        try {
          const capacityResponse = await getPreviousEventCapacityStats(ticketId);
          if (capacityResponse.success) {
            setCapacityStats(capacityResponse.data);
          }
        } catch (capacityErr) {
          console.warn("Capacity stats not available:", capacityErr);
          setCapacityStats(null);
        }
  
        // Fetch group data if exists
        if (data.groupId) {
          try {
            const groupResponse = await getGroupView(ticketId);
            const fetchedGroupData = groupResponse?.group || null;
            if (fetchedGroupData) {
              setGroupData(fetchedGroupData);
            }
          } catch (groupErr) {
            console.error("❌ Failed to fetch group data:", groupErr);
            toast.error("Could not load organization details");
          }
        }
        
      } catch (err) {
        console.error("Failed to fetch event data:", err);
        const errorMessage = err?.response?.data?.message || err.message || "Failed to load event details.";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAndSetData();
  }, [ticketId]);

  const theme = isDark
    ? {
      bg: "bg-[#212426]",
      text: "text-white",
      subText: "text-[#c9c9cf]",
      cardBg: "bg-[#212426]",
      innerCardBg: "bg-[#24272d]",
      border: "border-gray-700/30",
      cardShadow: "7px 7px 14px #1c1f20,-7px -7px 14px #26292c",
      smallCardShadow: "7px 7px 14px #1c1f20,-7px -7px 14px #26292c",
      insetShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
      buttonShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)"
    }
    : {
      bg: "bg-[#f9f9f9]",
      text: "text-gray-900",
      subText: "text-gray-600",
      cardBg: "bg-[#f2f2f2]",
      innerCardBg: "bg-gray-50",
      border: "border-gray-300",
      cardShadow: "8px 8px 24px rgba(0,0,0,0.1), -8px -8px 24px rgba(255,255,255,0.8)",
      smallCardShadow: "6px 6px 12px #6a6a6a,-6px -6px 12px #ffffff",
      insetShadow: "inset 0 2px 8px rgba(0,0,0,0.1)",
      buttonShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)"
    };

  // Neumorphism shadow style from LiveEventView
  const neumorphShadow = {
    boxShadow: isDark
      ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
      : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
  };

  // A darker/flatter shadow for the inner cards, derived from LiveEventView
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
  const chartData = useMemo(() => {
    if (!monthlyStats || monthlyStats.length === 0) {
      return [
        { month: "JAN", value: "0", percentage: 0 },
        { month: "FEB", value: "0", percentage: 0 },
        { month: "MAR", value: "0", percentage: 0 },
        { month: "APR", value: "0", percentage: 0 },
        { month: "MAY", value: "0", percentage: 0 },
        { month: "JUN", value: "0", percentage: 0 },
        { month: "JUL", value: "0", percentage: 0 },
        { month: "AUG", value: "0", percentage: 0 }
      ];
    }

    const maxRevenue = Math.max(...monthlyStats.map(m => m.revenue), 1);
    
    return monthlyStats.map(stat => ({
      month: stat.month,
      value: `${(stat.revenue / 1000).toFixed(1)}k`,
      percentage: Math.round((stat.revenue / maxRevenue) * 100)
    }));
  }, [monthlyStats]);
  const quarters = useMemo(() => {
    if (!quarterStats || quarterStats.length === 0) {
      return [
        { period: "No Data", bookings: "0", earnings: "0", percentage: 0 }
      ];
    }
    return quarterStats;
  }, [quarterStats]);
  const addOnEvents = useMemo(() => {
    if (eventData?.sub_events?.length > 0) {
      return eventData.sub_events.map((subEvent) => ({
        id: subEvent._id,
        name: subEvent.event_name,
        banner: subEvent.event_banner,
      }));
    }
    return [
        { name: "No Add-on Events", icon: "📅", ticketId: null }
      ];
  }, [eventData]);
  const handleSubEventClick = (subEventId) => {
    if (!subEventId) return;
    navigate(`/ticket/previous-sub-event-view/${subEventId}`);
  };
  const [activeIndex, setActiveIndex] = useState(Math.floor(addOnEvents.length / 2 || 1));
  const prevAddOn = () => setActiveIndex((i) => (i - 1 + addOnEvents.length) % addOnEvents.length);
  const nextAddOn = () => setActiveIndex((i) => (i + 1) % addOnEvents.length);
  // Image Modal Logic
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = useMemo(() => {
  const images = [];
    // Add banner if exists
    if (eventData?.event_banner) {
      const bannerUrl = getImageUrl(eventData.event_banner, "ticket");
      images.push({
        path: bannerUrl,
        type: "banner",
        name: "Event Banner",
        originalName: "Event Banner",
      });
    }

    // Add logo if exists
    if (eventData?.event_logo) {
      const logoUrl =
        eventData.event_logo.startsWith("http://") ||
          eventData.event_logo.startsWith("https://")
          ? eventData.event_logo
          : getImageUrl(eventData.event_logo, "ticket");

      images.push({
        path: logoUrl,
        type: "logo",
        name: "Event Logo",
        originalName: "Event Logo",
      });
    }

    // Add event_images if exist
    if (eventData?.event_images?.length > 0) {
      eventData.event_images.forEach((img, index) => {
        const imgPath = img.path || img;
        const imgUrl =
          imgPath.startsWith("http://") || imgPath.startsWith("https://")
            ? imgPath
            : getImageUrl(imgPath, "ticket");

        images.push({
          path: imgUrl,
          type: "event_image",
          name: img.originalName || `Event Image ${index + 1}`,
          originalName: img.originalName || `Event Image ${index + 1}`,
        });
      });
    }
    return images;
  }, [eventData]);

  const handleEventLogoClick = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex(0);
      setShowImageModal(true);
    } else {
      toast.error("No images available for preview.");
    }
  };

  const handleNextImage = () => {
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };


  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center text-xl ${theme.text}`}
        style={{ backgroundColor: theme.bg.replace('bg-', '') }}
      >
        Loading Previous Event Data...
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8`}
        style={{ backgroundColor: theme.bg.replace('bg-', '') }}
      >
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Error Loading Event</p>
          <p className="text-lg">{error || `Event with ID "${ticketId}" not found.`}</p>
          <div className="text-sm text-gray-400 mt-4">
            <p>Event ID: {ticketId}</p>
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
  };

  // Continue with your existing JSX...
  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} min-h-screen flex flex-col text-sm transition-colors duration-300`}>
        {/* Header */}
        <header className={`flex items-center justify-between px-3 md:px-6 border-b ${theme.border}`} style={{ height: HEADER_HEIGHT }}>
          <div className="flex items-center gap-2 md:gap-4 w-full">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <img src={WieLogo} alt="Wie Logo" className="w-8 h-8 md:w-10 md:h-10" />
              {/* Desktop search stays in header (hidden on mobile) */}
              <div className="hidden md:flex flex-1 min-w-0">
                <SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
              </div>
            </div>
            {/* Desktop: Theme toggle */}
            <div className="hidden md:flex">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>

            <div className="flex md:hidden items-center gap-3">
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: isDark ? "#212426" : "#FFFFFF",
                  boxShadow: isDark
                    ? "inset -2px -2px 5px rgba(255,255,255,0.05), inset 2px 2px 5px rgba(0,0,0,0.6)"
                    : "inset -2px -2px 5px rgba(255,255,255,0.9), inset 2px 2px 5px rgba(0,0,0,0.2)"
                }}
                aria-label="Notifications"
              >
                <img
                  src={NotificationIcon}
                  alt="Notification"
                  className="w-5 h-5"
                  style={{ filter: isDark ? "invert(0)" : "invert(1)" }} />
              </button>

              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: isDark ? "#212426" : "#FFFFFF",
                  boxShadow: isDark
                    ? "inset -2px -2px 5px rgba(255,255,255,0.05), inset 2px 2px 5px rgba(0,0,0,0.6)"
                    : "inset -2px -2px 5px rgba(255,255,255,0.9), inset 2px 2px 5px rgba(0,0,0,0.2)"
                }}
                aria-label="Chat"
              >
                <img
                  src={ChatIcon}
                  alt="Chat"
                  className="w-5 h-5"
                  style={{ filter: isDark ? "invert(0)" : "invert(1)" }}
                />
              </button>
            </div>


          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 lg:p-10 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Top row with back + title */}
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="hidden md:flex w-10 h-10 md:w-12 md:h-12 bg-[linear-gradient(180.23deg,_#1E1242_-0.04%,_#6549B8_99.57%)] rounded-full items-center justify-center hover:scale-105 transition"
                aria-label="back"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>

              {/* Desktop title (unchanged) */}
              <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${theme.text}`}>Previous Event</h1>
            </div>

            {/* MOBILE: Search bar under the top row */}
            <div className="md:hidden mb-4">
              <SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
            </div>

            <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-10`} style={cardStyle}>
              {/* Event category row (desktop: above, mobile: we'll show mobile-specific below) */}
              <div className="hidden md:flex items-center justify-start gap-2 md:gap-4 mb-3">
                <span className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}>
                  {eventData.event_category?.toUpperCase()}
                </span>
                <span className={theme.subText}></span>
                <span className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}>
                  {eventData.event_subcategory?.toUpperCase()}
                </span>
              </div>

              {/* Main event header */}
              <div className="relative mb-6 md:mb-8">
                {/* MOBILE: Title, subheading + public, center image, then pill-like location/date stacked */}
                <div className="md:hidden flex flex-col items-center gap-3">
                  <h2 className={`text-xl font-extrabold tracking-wider text-center ${theme.text}`}>
                    {eventData.event_name?.toUpperCase() || "EVENT NAME"}
                  </h2>
                  {/* subheading + public in one line */}
                  <div className="flex items-center gap-2">
                    <span className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}>
                      {eventData.event_category?.toUpperCase()}
                    </span>
                    <span className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}>
                      {eventData.event_subcategory?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <img src={PublicIcon} alt="Public" className="w-4 h-4" />
                      <span className={`font-semibold text-sm md:text-lg ${theme.text}`}>
                        {eventData.event_type === "private" ? "Private" : "Public"}
                      </span>
                    </div>
                  </div>
                  <div
                    onClick={handleEventLogoClick}
                    className="rounded-full border-4 bg-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                    style={{
                      width: "clamp(72px, 18vw, 100px)",
                      height: "clamp(72px, 18vw, 100px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.6)"
                    }}
                  >
                    <img
                      src={getImageUrl(eventData.event_banner)}
                      alt="event_banner"
                      className="w-full h-full object-cover rounded-full"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>

                  {/* Mobile pill-style location and date (stacked) */}
                  <div className="w-full flex flex-col items-center gap-3">
                    {/* Location pill */}
                    <div
                      className="relative rounded-full p-3 flex items-center justify-between w-[90%] max-w-[320px]"
                      style={{
                        background: isDark
                          ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))"
                          : "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                      }}
                    >
                      <div className="relative flex items-center gap-2 w-full">
                        {/* Floating circle logo (left) */}
                        <div
                          className="absolute -top-4 -left-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                          style={{
                            background: "linear-gradient(180.23deg, #8b5cf6 0%, #6366f1 100%)",
                          }}
                        >
                          <img src={MapIcon} alt="map" className="w-6 h-6" />
                        </div>

                        {/* Text content */}
                        <div className="pl-12 flex items-center gap-1 overflow-hidden">
                          <h3 className={`font-semibold text-sm ${theme.text}`}>
                            {eventData.venue || eventData.location_type}
                          </h3>

                        </div>
                      </div>
                    </div>
                    {/* Date pill (inline text + floating icon) */}
                    <div
                      className="relative rounded-full p-3 flex items-center justify-between w-[90%] max-w-[320px]"
                      style={{
                        background: isDark
                          ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))"
                          : "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                      }}
                    >
                      {/* Inline date text */}
                      <div className="flex items-center gap-1 pl-2">
                        <span className={`text-xs ${theme.subText}`}>Event on :</span>
                        <span className={`font-bold text-sm ${theme.text}`}>
                          {eventData.event_dates?.[0]?.start_date
                            ? new Date(eventData.event_dates[0].start_date).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              timeZone: "UTC",
                            })
                            : "Date TBA"}
                        </span>
                      </div>
                      {/* Floating calendar icon (right) */}
                      <div
                        className="absolute  -right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background: "linear-gradient(180.23deg, #8b5cf6 0%, #6366f1 100%)",
                        }}
                      >
                        <img src={CalenderIcon} alt="calendar" className="w-5 h-5" />
                      </div>
                    </div>
                  </div>


                </div>

                {/* Desktop: Public badge (keeps original desktop look) */}
                <div className="absolute -top-4 md:-top-6 right-0 hidden md:flex items-center gap-2">
                  <img src={PublicIcon} className={`w-5 h-5 md:w-6 md:h-6 ${!isDark ? 'filter brightness-0' : ''}`} alt="Public" />
                  <span className={`font-semibold text-sm md:text-lg ${theme.text}`}>
                    {eventData.event_type === "private" ? "Private" : "Public"}
                  </span>
                </div>
                {/* Desktop Title (keep for desktop only) */}
                <h2 className={`hidden md:block text-xl md:text-2xl lg:text-3xl font-extrabold tracking-wider mb-3 text-center pb-4 ${theme.text}`}>
                  {eventData.event_name?.toUpperCase() || "EVENT NAME"}
                </h2>
                {/* Event details bar - Desktop only (hidden on mobile because mobile has stacked pills) */}
                <div className="relative w-full">
                  <div className="mx-auto w-full md:w-[85%] lg:w-[80%]">
                    <div
                      className={`rounded-xl md:rounded-2xl px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 hidden md:flex`}
                      style={{ backgroundColor: theme.innerCardBg.replace('bg-', ''), boxShadow: theme.insetShadow, minHeight: '60px' }}
                    >
                      {/* Location */}
                      <div className="flex items-center md:pl-[50px] lg:pl-[95px]">
                        <div className="relative group max-w-[160px] md:max-w-[220px]">
                          <span
                            className={`text-xs md:text-sm ${theme.subText} truncate cursor-default block`}
                          >
                            {eventData.location || eventData.location_type}
                          </span>

                          {(eventData.location || eventData.location_type)?.length > 25 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                              <div className="bg-black text-white text-[10px] md:text-xs px-2 py-1 rounded shadow-lg max-w-xs whitespace-normal text-center">
                                {eventData.location || eventData.location_type}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Date */}
                      <div className="flex items-center gap-2 md:gap-3 md:pr-[50px] lg:pr-[95px]">Event Start Date:
                        <img src={CalenderIcon} className={`w-4 h-4 md:w-5 md:h-5 ${!isDark ? 'filter brightness-0' : ''}`} alt="Calendar" />
                        <span className={`font-bold text-sm ${theme.text}`}>
                          {eventData.event_dates?.[0]?.start_date
                            ? new Date(eventData.event_dates[0].start_date).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              timeZone: "UTC",
                            })
                            : "Date TBA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating icons - Desktop / Tablet */}
                  <div className="hidden md:block">
                    {/* left floating */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{
                        left: "2%", // Adjusted for tablet/desktop visibility
                        width: "clamp(50px, 7vw, 90px)",
                        height: "clamp(50px, 7vw, 90px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                        zIndex: 20,
                        background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)"
                      }}
                    >
                      <img src={MapIcon} alt="Map" style={{ width: "clamp(32px, 5vw, 50px)", height: "clamp(32px, 5vw, 50px)" }} />
                    </div>

                    {/* center floating */}
                    <div
                      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ zIndex: 30 }}
                    >
                      <div
                        onClick={handleEventLogoClick}
                        className="rounded-full border-4 bg-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform pointer-events-auto overflow-hidden"
                        style={{
                          width: "clamp(64px, 12vw, 100px)",
                          height: "clamp(64px, 12vw, 100px)",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.6)"
                        }}
                      >
                        <img
                          src={getImageUrl(eventData.event_banner)}
                          alt="Event Banner"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>

                    {/* right floating */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{
                        right: "2%", // Adjusted for tablet/desktop visibility
                        width: "clamp(50px, 7vw, 90px)",
                        height: "clamp(50px, 7vw, 90px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                        zIndex: 20,
                        background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)"
                      }}
                    >
                      <img
                        src={CalenderIcon}
                        alt="Calendar"
                        style={{
                          width: "clamp(32px, 5vw, 42px)",
                          height: "clamp(32px, 5vw, 42px)",
                          filter: "brightness(0) invert(1)"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats and chart grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
                {/* Stats card */}
                {/* Stats card */}
                <div className={`rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-8 py-4 md:py-6`} style={{ ...cardStyle }}>
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    {/* BoxIcon: show only on large desktop to preserve original desktop UI and hide on mobile/ipad */}
                    <img src={BoxIcon} alt="Stats" className={`hidden sm:block  lg:block w-5 h-5 md:w-6 md:h-6 transition duration-300 ${isDark ? 'invert' : 'brightness-0'}`} />
                    <h3 className={`hidden sm:block text-lg md:text-xl lg:text-2xl font-bold tracking-wide ${theme.text}`}>{eventData.event_name}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 w-full">
                  {[
                    { 
                      title: "Total event earnings", 
                      value: eventData.total_earnings || "0", 
                      accent: "text-emerald-400", 
                      icon: EarningIcon 
                    },
                    { 
                      title: "Total bookings", 
                      value: eventData.total_bookings || "0", 
                      accent: "text-blue-400", 
                      icon: TicketIcon, 
                      isBlue: true 
                    },
                    { 
                      title: "Total cancellation", 
                      value: eventData.total_cancellations || "0", 
                      accent: "text-red-400", 
                      icon: CancelIcon 
                    },
                    { 
                      title: "People liked", 
                      value: eventData.like || "0", 
                      accent: "text-red-400", 
                      icon: LikeIcon 
                    },
                    { 
                      title: "People Shared", 
                      value: eventData.share_count || "0", 
                      accent: "text-blue-400", 
                      icon: ShareIcon, 
                      needsInvert: true 
                    },
                    { 
                      title: "Tag Count", 
                      value: eventData.hashtag?.length || "0", 
                      accent: isDark ? "text-white" : "text-gray-900", 
                      icon: TagIcon, 
                      needsInvert: true 
                    }
                  ].map((st, i) => (
                      <div
                        key={i}
                        className={`relative rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 flex flex-col justify-between w-full h-full`}
                        style={{ ...cardStyle, minHeight: '90px' }}
                      >
                        <img
                          src={st.icon}
                          alt=""
                          className={`w-4 h-4 md:w-5 md:h-5 absolute top-3 md:top-6 right-2 md:right-3 ${st.isBlue ? "" : st.needsInvert && !isDark ? "filter brightness-0" : "opacity-80"
                            }`}
                          style={
                            st.isBlue
                              ? {
                                filter:
                                  "invert(41%) sepia(93%) saturate(7491%) hue-rotate(205deg) brightness(100%) contrast(105%)"
                              }
                              : {}
                          }
                        />

                        <div className="mb-1 pr-6 md:pr-8">
                          <span className={`text-xs md:text-sm leading-tight block ${theme.subText}`}>
                            {st.title}
                          </span>
                        </div>

                        <div className="flex items-end justify-between pt-1 md:pt-2 pb-1 md:pb-2">
                          <div className={`text-xl md:text-2xl lg:text-[2.3rem] font-extrabold ${st.accent}`}>
                            {st.title === "Total event earnings"
                              ? eventData.total_earnings || "0"
                              : st.title === "Total bookings"
                                ? eventData.total_bookings || "0"
                                : st.title === "Total cancellation"
                                  ? eventData.total_cancellations || "0"
                                  : st.title === "People liked"
                                    ? eventData.like || "0"
                                    : st.title === "People Shared"
                                      ? eventData.share_count || "0"
                                      : st.title === "Tag Count"
                                        ? eventData.hashtag?.length || "0"
                                        : st.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart card */}
                <div className={`rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-8 py-4 md:py-6 flex flex-col`} style={cardStyle}>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <img src={LiveEventIcon} alt="Live Events" className="w-4 h-4 md:w-6 md:h-6" />
                      <h3 className={`text-xs md:text-lg font-bold tracking-wide ${theme.text}`}>PREVIOUS EVENT EARNING STATISTICS</h3>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 text-xs md:text-sm font-semibold">
                      <span>↗</span>
                      <span>14%</span>
                    </div>
                  </div>

                  <div className="mb-3 md:mb-4">
                    <span className={`text-xs md:text-sm ${theme.subText}`}>Bellie Ellish Concert</span>
                    <div className="flex items-end gap-2 md:gap-4 mt-2">
                      <span className={`text-2xl md:text-3xl font-bold leading-none ${theme.text}`}>66,672.61</span>
                      <span className={`text-xs self-end ${theme.subText}`}>Total amount</span>
                    </div>
                  </div>

                  {/* Pill chart */}
                  <div className="flex items-end justify-between gap-2 md:gap-4 mt-3 md:mt-4 w-full">
                    {chartData.map((d, i) => {
                      const baseHeight = 120;
                      const heightPx = Math.max(18, Math.round((d.percentage / 100) * baseHeight));

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                          <span className={`text-[10px] md:text-xs mb-1 md:mb-2 ${theme.subText} truncate w-full text-center`}>{d.value}</span>

                          <div className="relative flex items-end justify-center w-full" style={{ height: baseHeight }}>
                            <div
                              className="w-full max-w-[24px] md:max-w-[40px] rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-md"
                              style={{
                                height: `${heightPx}px`,
                                transition: "height 400ms ease",
                                boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.12)"
                              }}
                            />
                          </div>

                          <div className={`text-[10px] md:text-xs font-medium mt-2 md:mt-3 ${theme.subText} truncate w-full text-center`}>{d.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Add-on section */}
              {/* Mobile / iPad specific layout: md:hidden -> show compact company + add-on in one line, then actions row below */}
              <div className="md:hidden mb-6 px-2">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  {/* compact company */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                      <img src={getImageUrl(eventData.event_banner)} alt="company" className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1 ${theme.text}`}>Company</span>
                  </div>
                  {/* add-on icons inline with horizontal scroll if needed - Only show if sub-events exist */}
                  {addOnEvents && addOnEvents.length > 0 && addOnEvents[0]?.id && (
                    <div className="flex-1 min-w-0">
                      <div className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 ${theme.cardBg ?? ''}`} style={cardStyle}>
                        <span className={`text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 ${theme.text}`}>Add on events</span>

                        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1">
                          {addOnEvents.map((subEvent) => (
                            <button
                              key={subEvent.id}
                              onClick={() => handleSubEventClick(subEvent.id)}
                              className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                            >
                              <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-600 hover:scale-105 transition">
                                <img
                                  src={getImageUrl(subEvent.banner, "ticket")}
                                  alt={subEvent.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-center text-white truncate max-w-[56px]">
                                {subEvent.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* actions in next line: try to keep all three visible on mobile and iPad; allow horizontal scroll on very narrow */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-2">
                    {[
                      { icon: ViewIcon, label: "View" },
                      { icon: SeatIcon, label: "Seat layout" },
                      { icon: TicketIcon, label: "Ticket info" }
                    ].map((action, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-shrink-0 w-16 sm:w-20">
                        <button
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                          style={{ background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)" }}
                          aria-label={action.label}
                        >
                          <img src={action.icon} alt={action.label} className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <span className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center ${theme.text}`}>{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop / md+ responsive grid layout */}
              <div className="hidden md:grid grid-cols-12 gap-4 lg:gap-6 items-center mb-6 md:mb-10">
                {/* Company */}
                <div className={`col-span-3 lg:col-span-2 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center h-full justify-center`}>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center mb-2 overflow-hidden">
                    <img src={getImageUrl(eventData.event_banner)} alt="company" className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm lg:text-base font-semibold ${theme.text} text-center`}>Company</span>
                </div>

                {/* Add on Events - Only show if sub-events exist */}
                {addOnEvents && addOnEvents.length > 0 && addOnEvents[0]?.id && (
                  <div
                    className={`col-span-12 md:col-span-9 lg:col-span-6 rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col items-center h-full justify-center w-full ${theme.cardBg ?? ''}`}
                    style={cardStyle}
                  >
                    <div className="flex items-center w-full justify-between relative px-2">
                      <span className={`text-sm md:text-base lg:text-lg font-bold ${theme.text} whitespace-nowrap`}>Add on events</span>

                      <div className="flex items-center gap-2 flex-1 justify-center min-w-0 mx-2">
                        <button
                          onClick={prevAddOn}
                          className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-30 flex-shrink-0 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer text-gray-800"
                          aria-label="previous"
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="relative flex-1 flex items-center justify-center overflow-hidden h-20 md:h-28">
                          <div className="flex items-center gap-2 md:gap-4 justify-center w-full">
                            {addOnEvents?.map((subEvent) => {
                              return (
                                <div
                                  key={subEvent.id}
                                  onClick={() => handleSubEventClick(subEvent.id)}
                                  className="flex flex-col items-center justify-center transition-all duration-300 cursor-pointer flex-shrink"
                                  style={{
                                    transform: "scale(0.95)",
                                    opacity: 0.9,
                                  }}
                                >
                                  <div
                                    className="flex items-center justify-center rounded-full overflow-hidden shadow-md
                                      w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20
                                      transition-all duration-200"
                                  >
                                    <img
                                      src={getImageUrl(subEvent.banner, "ticket")}
                                      alt={subEvent.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <span className="mt-1 text-[10px] md:text-xs text-center text-white truncate max-w-[80px]">
                                    {subEvent.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={nextAddOn}
                          className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-30 flex-shrink-0 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer text-gray-800"
                          aria-label="next"
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons - Adjust column span based on whether add-on events exist */}
                <div className={`col-span-12 ${addOnEvents && addOnEvents.length > 0 && addOnEvents[0]?.id ? 'lg:col-span-4' : 'lg:col-span-10'} w-full flex justify-center lg:justify-end`}>
                  <div className="flex items-center gap-4 lg:gap-8 justify-between w-full lg:w-auto">
                    {[
                      { icon: ViewIcon, label: "View" },
                      { icon: SeatIcon, label: "Seat layout" },
                      { icon: TicketIcon, label: "Ticket info" }
                    ].map((action, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1 lg:flex-none w-auto">
                        <button
                          className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                          style={{ background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)" }}
                          aria-label={action.label}
                        >
                          <img src={action.icon} alt={action.label} className="w-7 h-7 lg:w-8 lg:h-8" />
                        </button>
                        <span className={`text-xs lg:text-sm mt-2 font-medium text-center ${theme.text} whitespace-nowrap`}>{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bank + quarters + donut */}
              <div className={`rounded-xl md:rounded-2xl p-4 md:p-6 mt-6 md:mt-8`} style={{ ...cardStyle }}>
                <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 items-start">
                  {/* Bank details */}
                  <div className="w-full md:w-[36%] md:pr-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
                      <img src={BankIcon} alt="Bank" className={`w-5 h-5 md:w-6 md:h-6 ${!isDark ? 'filter brightness-0' : ''}`} />
                      <h3 className={`text-lg md:text-xl font-extrabold tracking-wide ${theme.text}`}>Bank Details</h3>
                    </div>
                    <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-xs md:text-sm">
                      {eventData.banking_details && eventData.banking_details.length > 0 ? (
                        eventData.banking_details.map((bank, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>Bank name :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {bank.bank_acc_holder || "N/A"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>Amount before event :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {eventData.total_earnings ? (eventData.total_earnings * 0.1).toFixed(2) : "0"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>Account no :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {bank.bank_acc_no || "N/A"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>Amount after event :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {eventData.total_earnings || "0"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>IFSC code :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {bank.bank_ifsc || "N/A"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${theme.subText}`}>Total Profit :</p>
                                <p className={`text-xs md:text-sm font-semibold ${theme.text}`}>
                                  {eventData.total_earnings ? (eventData.total_earnings * 0.9).toFixed(2) : "0"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className={`text-sm ${theme.subText}`}>No banking details available</p>
                      )}
                    </div>
                    {/* Download button */}
                    <div className="w-full flex justify-center mt-4">
                      <div className="relative flex items-center w-full md:w-[250px]">
                        <div
                          className="absolute -left-5 md:-left-6 z-20 flex items-center justify-center rounded-full"
                          style={{
                            width: 56,
                            height: 56,
                            background: isDark ? "#0f1112" : "#e5e7eb",
                            boxShadow: theme.buttonShadow,
                          }}
                        >
                          <div
                            className="flex items-center justify-center rounded-full"
                            style={{
                              width: 32,
                              height: 32,
                              background: isDark ? "#0b0d0e" : "#d1d5db",
                              boxShadow: theme.insetShadow,
                            }}
                          >
                            <img src={DownloadIcon} alt="download" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                          </div>
                        </div>

                        <button
                          className={`w-full h-10 md:h-11 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${theme.text}`}
                          style={{
                            backgroundColor: theme.cardBg.replace('bg-', ''),
                            boxShadow: theme.buttonShadow,
                            paddingLeft: 48,
                            paddingRight: 20,
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider - Hidden on mobile */}
                  <div className={`hidden md:block w-px bg-[#6a47fa]`} />

                  {/* Quarters */}
                  <div className="relative flex-1 w-full">
                    {/* Scrollbar on left */}
                    <div className="absolute top-0 left-0 h-full w-2 bg-transparent z-10"></div>

                    <div className="md:pl-4 md:pr-2 max-h-full md:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#6a47fa] scrollbar-track-transparent [direction:rtl]">
                      <div className="[direction:ltr] space-y-3 ml-2">
                        {quarters.map((q, idx) => {
                          const pct = Math.max(4, Math.min(100, q.percentage));

                          return (
                            <div
                              key={idx}
                              className={`rounded-xl p-3 w-full`}
                              style={{
                                minHeight: 85,
                                background: isDark
                                  ? "linear-gradient(92.38deg, rgba(255,255,255,0.1) 0.43%, rgba(153,153,153,0.1) 99.63%)"
                                  : "linear-gradient(92.38deg, rgba(200,200,200,0.3) 0.43%, rgba(220,220,220,0.3) 99.63%)",
                                boxShadow: "none"
                              }}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500 inline-block flex-shrink-0" />

                                  <h4 className={`text-sm md:text-base lg:text-lg font-semibold tracking-tight ${theme.text}`}>
                                    {q.period}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                  <div className="flex-1 md:flex-none flex justify-center">
                                    <div
                                      className="rounded-full"
                                      style={{
                                        width: 100,
                                        height: 10,
                                        background:
                                          "linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 100%)"
                                      }}
                                    />
                                  </div>

                                  <div className={`text-sm md:text-base font-semibold ${theme.text}`}>
                                    {q.percentage}%
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`text-xs ${theme.subText}`}>Total Bookings</div>
                                  <div className="text-base md:text-lg font-bold text-emerald-400">{q.bookings}</div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`text-xs ${theme.subText}`}>Total earnings</div>
                                  <div className="text-base md:text-lg font-bold text-emerald-400">{q.earnings}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Divider - Hidden on mobile */}
                  <div className={`hidden md:block w-px bg-[#6a47fa]`} />
                  {/* Donut chart (bigger + responsive inner text) */}
                  <div className="w-full md:w-[25%] flex flex-col items-center justify-center mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200/50 pt-6 md:pt-0 md:pr-12">
                    {/* control visual size with Tailwind widths; SVG scales inside */}
                    <div className="relative w-40 sm:w-48 md:w-32 lg:w-48 xl:w-56 max-w-full overflow-visible">
                      {(() => {
                        const R = 80;
                        const stroke = 16;
                        const progress = capacityStats?.mainEvent?.percentage 
                          ? capacityStats.mainEvent.percentage / 100 
                          : 0.85;
                        const C = 2 * Math.PI * R;
                        return (
                          <svg
                            viewBox="0 0 240 240"
                            preserveAspectRatio="xMidYMid meet"
                            className="w-full h-auto transform -rotate-90"
                            aria-hidden="true"
                          >
                            <circle
                              cx="120"
                              cy="120"
                              r={R}
                              stroke={isDark ? "#2a2d35" : "#e5e7eb"}
                              strokeWidth={stroke}
                              fill="none"
                            />
                            <circle
                              cx="120"
                              cy="120"
                              r={R}
                              stroke="url(#gradient2)"
                              strokeWidth={stroke}
                              fill="none"
                              strokeDasharray={`${C * progress} ${C}`}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dasharray .8s cubic-bezier(0.4, 0, 0.2, 1)" }}
                            />
                            <defs>
                              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>
                        );
                      })()}

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className={`${theme.text} font-extrabold tracking-tight`}
                          style={{
                            lineHeight: 1,
                            fontSize: "clamp(18px, 3.5vw, 32px)",
                          }}
                        >
                          {capacityStats?.mainEvent?.percentage || 0}%
                        </span>
                        <span
                          className={`${theme.subText} font-medium`}
                          style={{
                            marginTop: 4,
                            fontSize: "clamp(9px, 1.2vw, 11px)",
                            maxWidth: "80%",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title="Total Tickets Sold"
                        >
                          Tickets Sold
                        </span>
                      </div>
                    </div>
                    <p className={`text-center text-xs md:text-sm font-semibold mt-3 w-full ${theme.subText}`}>
                      Total earnings: ₹{eventData.total_earnings || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        <div className="md:hidden">
          <BottomNavigation
            theme={theme}
            user={user}
          />
        </div>
      </div>
      {/* Add Image Modal */}
      {showImageModal && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          images={allImages}
          currentIndex={currentImageIndex}
          setCurrentIndex={setCurrentImageIndex}
          theme={{ ...theme, isDark, shadowInset: theme.insetShadow }}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
    </>
  );
};
export default PreviousEventView;
