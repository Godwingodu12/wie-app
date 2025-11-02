import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, X, Phone, Play } from "lucide-react";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import LogoIcon from "../../assets/WieLogo.svg";
import Event_Days from "../../assets/ViewSingleEvent/Event_Days.svg";
import Globe from "../../assets/ViewSingleEvent/Globe.svg";
import Private from "../../assets/ViewSingleEvent/Private.svg";
import Bank_Details from "../../assets/ViewSingleEvent/Bank_Details.svg";
import Language from "../../assets/ViewSingleEvent/Language.svg";
import Map_Loc from "../../assets/ViewSingleEvent/Map_Loc.svg";
import Map_No_Loc from "../../assets/ViewSingleEvent/Map_No_Loc.svg";
import Max_People from "../../assets/ViewSingleEvent/Max_People.svg";
import Offline from "../../assets/ViewSingleEvent/Offline.svg";
import Online from "../../assets/ViewSingleEvent/Online.svg";
import Preference from "../../assets/ViewSingleEvent/Preference.svg";
import Prohibit from "../../assets/ViewSingleEvent/Prohibit.svg";
import Seat from "../../assets/ViewSingleEvent/Seat.svg";
import Ticket from "../../assets/ViewSingleEvent/Ticket.svg";
import NoGuide from "../../assets/ViewSingleEvent/NoGuide.svg";
import GuideVector from "../../assets/ViewSingleEvent/GuideVector.svg";
import Rules from "../../assets/ViewSingleEvent/Rules.svg";

import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMyPreviousEventView, getGroupView } from "../../services/ticketService";
import Card from "../../components/ViewSingleEvent/Card";
import getFullBankingDetails from "../../components/ViewSingleEvent/getFullBankingDetails";
import getCarouselEvents from "../../components/ViewSingleEvent/getCarouselEvents";
import getPreferences from "../../components/ViewSingleEvent/getPreferences";
import formatImagePath from "../../components/ViewSingleEvent/formatImagePath";
import formatCapacity from "../../components/ViewSingleEvent/formatCapacity";
import FeatureButton from "../../components/ViewSingleEvent/FeatureButton";
import LanguagePopover from "../../components/ViewSingleEvent/LanguagePopover";
import ProhibitPopover from "../../components/ViewSingleEvent/ProhibitPopover";
import PreferenceModal from "../../components/ViewSingleEvent/PreferenceModal";
import ImageModal from "../../components/ViewSingleEvent/ImageModal";
import GuideModal from "../../components/ViewSingleEvent/GuideModal";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const darkTheme = {
  isDark: true,
  text: "text-white",
  mainBg: "#212426",
  cardBg: "rgba(33, 36, 38, 0.9)",
  insetBg: "rgba(30, 33, 35, 0.9)",
  shadowOutset: "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
  shadowInset: "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b",
  textColor: "text-gray-300",
};

const lightTheme = {
  isDark: false,
  text: "text-gray-900",
  mainBg: "#e0e0e0",
  cardBg: "rgba(255, 255, 255, 0.9)",
  insetBg: "rgba(230, 230, 230, 0.9)",
  shadowOutset: "5px 5px 10px #c5c5c5, -5px -5px 10px #fbfbfb",
  shadowInset: "inset 5px 5px 10px #c5c5c5, inset -5px -5px 10px #fbfbfb",
  textColor: "text-gray-700",
};

const PreviousEventDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const initialThemeIsDark = location.state?.initialThemeIsDark ?? true;

  const [theme, setTheme] = useState(
    initialThemeIsDark ? darkTheme : lightTheme
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isApiReady, setIsApiReady] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [groupData, setGroupData] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [currentStatsEventIndex, setCurrentStatsEventIndex] = useState(0);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const handleCarouselPrev = () => {
    setActiveCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleCarouselNext = () => {
    const maxIndex = carouselEvents.length - 1;
    setActiveCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handlePlayClick = () => {
    console.log("Play clicked, event_images:", eventData?.event_images);
    if (eventData?.event_images?.length > 0) {
      setCurrentImageIndex(0);
      setShowImageModal(true);
      console.log("showImageModal set to true");
    } else {
      toast.error("No images or video available for preview.");
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const d = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(d ? darkTheme : lightTheme);
    document.documentElement.classList.toggle("dark", d);
  }, []);

  const handleThemeToggle = () => {
    const newDark = !theme.isDark;
    setTheme(newDark ? darkTheme : lightTheme);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  useEffect(() => {
    const callbackName = "initViewMapCallback";
    const scriptId = "google-maps-view-script";

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
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = scriptId;
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (
      !isApiReady ||
      !mapRef.current ||
      !eventData ||
      eventData.location_type !== "offline"
    )
      return;

    const coords = eventData.exact_map_location;
    const initialCenter = {
      lat: parseFloat(coords?.latitude) || 10.5276,
      lng: parseFloat(coords?.longitude) || 76.2144,
    };

    const initializeMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "none",
      });

      markerRef.current = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: false,
        title: eventData.venue || "Event Location",
      });

      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, "resize");
        mapInstance.setCenter(initialCenter);
      }, 300);
    };

    initializeMap();
  }, [isApiReady, eventData]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!ticketId) {
        setError("Ticket ID not found in URL parameters.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching previous event data for ticketId:", ticketId);

        // Fetch ticket data
        const ticketResponse = await getMyPreviousEventView(ticketId);
        console.log("Ticket Response:", ticketResponse);

        // Extract event data - API returns { message, ticket }
        const data = ticketResponse?.ticket;

        if (!data) {
          throw new Error("No ticket data received from server");
        }

        if (!data.event_name) {
          throw new Error("Invalid ticket data structure");
        }

        console.log("Event Data:", data);
        setEventData(data);

        // Fetch group data if groupId exists
        if (data.groupId) {
          try {
            const groupResponse = await getGroupView(data.groupId);
            console.log("Group Response:", groupResponse);
            
            const fetchedGroupData = groupResponse?.data?.group || groupResponse?.group || groupResponse?.data || groupResponse;
            setGroupData(fetchedGroupData);
          } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
            // Continue without group data
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

  const [showPreferenceModal, setShowPreferenceModal] = useState(false);

  useEffect(() => {
    if (eventData?.banking_details?.length > 0) {
      setCurrentBankIndex(0);
    }
  }, [eventData]);

  const allBankingDetails = useMemo(
    () => getFullBankingDetails(eventData, groupData),
    [eventData, groupData]
  );

  const currentBankInfo = useMemo(() => {
    return allBankingDetails[currentBankIndex] || {};
  }, [allBankingDetails, currentBankIndex]);

  const eventPreferences = useMemo(() => {
    return getPreferences(eventData);
  }, [eventData]);

  const carouselEvents = useMemo(
    () => getCarouselEvents(eventData, formatImagePath),
    [eventData]
  );

  const handleClosePreferenceModal = () => setShowPreferenceModal(false);

  const rulesContent = useMemo(() => {
    const rules = eventData?.event_rules;
    if (rules && rules.type === "text" && rules.content) {
      return rules.content;
    }
    return "Please maintain silence during the show. Mobile phones must be switched off. Photography, video recording, and outside food are strictly prohibited. Follow seat numbers and avoid blocking aisles. Respect performers and fellow audience members. Entry is not allowed after the show begins. Keep the theater clean and tidy.";
  }, [eventData]);

  const eventStats = useMemo(() => {
    if (!eventData)
      return { likeCount: 0, totalCapacity: 0, shareCount: 0, ticketTypes: [] };
    
    // Calculate total capacity from ticket_types or use total_capacity field
    let totalCap = 0;
    if (eventData.ticket_types && eventData.ticket_types.length > 0) {
      totalCap = eventData.ticket_types.reduce((sum, ticket) => sum + (ticket.max_capacity || 0), 0);
    } else if (eventData.total_capacity) {
      totalCap = parseInt(eventData.total_capacity) || 0;
    }

    return {
      likeCount: eventData.like || 0,
      totalCapacity: totalCap,
      shareCount: eventData.share_count || 0,
      ticketTypes: eventData.ticket_types || [],
    };
  }, [eventData]);

  const hashtags = useMemo(() => {
    return eventData?.hashtag || [];
  }, [eventData]);

  const formattedDateRange = useMemo(() => {
    if (!eventData?.event_dates?.length)
      return { dateText: "Date TBA", timeText: "N/A" };

    const eventDates = eventData.event_dates[0];
    const firstDate = new Date(eventDates.start_date);

    const startTime = eventDates.start_time
      ? new Date(`1970-01-01T${eventDates.start_time}`).toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "numeric", hour12: true }
        )
      : "N/A";

    const dateString = firstDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return { dateText: dateString, timeText: startTime };
  }, [eventData]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-xl"
        style={{
          backgroundColor: theme.mainBg,
          color: theme.textColor,
        }}
      >
        Loading Previous Event Data...
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8"
        style={{ backgroundColor: theme.mainBg }}
      >
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Error Loading Event</p>
          <p className="text-lg">{error || `Event with ID "${ticketId}" not found.`}</p>
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTuneClick = () => {
    toast("Filter functionality coming soon!");
  };

  const handleNavigateHome = () => {
    navigate("/home", {
      state: {
        initialThemeIsDark: theme.isDark,
      },
    });
  };

  const handleGuestClick = (guest) => {
    console.log("Guest Clicked! Modal should open for:", guest.guest_name);
    setSelectedGuest(guest);
    setShowGuideModal(true);
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuest(null);
  };

  const guidesToShow = 3;
  const ticketsToShow = 3;

  const insetBoxStyle = {
    boxShadow: theme.shadowInset,
    backgroundColor: theme.insetBg,
    borderRadius: "12px",
  };

  const handlePrevGuide = () => {
    setCurrentGuideIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextGuide = () => {
    setCurrentGuideIndex((prevIndex) =>
      Math.min((eventData.guests?.length || 0) - guidesToShow, prevIndex + 1)
    );
  };

  const handlePrevBank = () => {
    const len = allBankingDetails.length || 0;
    if (len <= 1) return;
    setCurrentBankIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const handleNextBank = () => {
    const len = allBankingDetails.length || 0;
    if (len <= 1) return;
    setCurrentBankIndex((prevIndex) =>
      prevIndex === len - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevTicket = () => {
    setCurrentTicketIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextTicket = () => {
    setCurrentTicketIndex((prevIndex) =>
      Math.min(eventStats.ticketTypes.length - ticketsToShow, prevIndex + 1)
    );
  };

  const handleNextImage = () => {
    const len = eventData?.event_images?.length || 0;
    if (len === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % len);
  };

  const handlePrevImage = () => {
    const len = eventData?.event_images?.length || 0;
    if (len === 0) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const bannerImageUrl = formatImagePath(eventData.event_banner);
  const TypeIcon = eventData.event_type === "private" ? Private : Globe;
  const TypeLabel = eventData.event_type === "private" ? "Private" : "Public";

  let LocationIcon;
  let LocationLabel;

  switch (eventData.location_type) {
    case "online":
      LocationIcon = Online;
      LocationLabel = "Online";
      break;
    case "recorded":
      LocationIcon = Offline;
      LocationLabel = "Recorded";
      break;
    case "offline":
    default:
      LocationIcon = Offline;
      LocationLabel = "Offline";
      break;
  }

  return (
    <div
      className={`min-h-screen md:p-8 p-2 ${theme.text}`}
      style={{ backgroundColor: theme.mainBg }}
    >
      <header className="flex justify-between w-full items-center mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={LogoIcon}
            alt="Logo"
            className={`w-12 h-12 object-contain cursor-pointer ${
              theme.isDark ? "" : "filter invert"
            }`}
            onClick={handleNavigateHome}
          />
          <div className="hidden md:block">
            <SearchBar
              theme={theme}
              value={searchTerm}
              onChange={handleSearchChange}
              onTuneClick={handleTuneClick}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle isDark={theme.isDark} onToggle={handleThemeToggle} />
        </div>
      </header>
      
      <div className="mb-4 md:hidden">
        <SearchBar
          theme={theme}
          value={searchTerm}
          onChange={handleSearchChange}
          onTuneClick={handleTuneClick}
        />
      </div>

      <div className="flex justify-center md:mb-10 mb-4">
        <Card
          theme={theme}
          className="inline-block px-12 py-2"
          customStyle={{ borderRadius: "20px" }}
        >
          <h1
            className={`text-4xl font-bold text-center tracking-widest ${
              theme.isDark ? "text-gray-300" : "text-gray-800"
            }`}
          >
            {eventData.event_name?.toUpperCase() || "EVENT NAME"}
          </h1>
          <p className="text-center text-sm text-orange-400 mt-2">Previous Event</p>
        </Card>
      </div>

      <div className="md:relative">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1 - Event Details */}
          <Card
            theme={theme}
            className="p-6 relative overflow-hidden"
            customStyle={{ borderTopLeftRadius: "50px" }}
          >
            {/* SVG Corner */}
            <svg
              className="absolute -bottom-1 -right-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 200 200"
              preserveAspectRatio="none"
            >
              <path
                d="M 200,200 L 200,0 Q 200,200 0,200 Z"
                fill={theme.mainBg}
              />
            </svg>

            <div className="flex space-x-6 mb-4">
              <h2 className={`text-xl font-semibold pb-1 ${theme.textColor}`}>
                {eventData.event_category}
              </h2>
              <h2 className="text-xl font-semibold text-gray-400">
                {eventData.event_subcategory}
              </h2>
            </div>

            <div className="md:flex space-y-4 md:space-y-0 md:space-x-6 mb-4">
              <div
                style={insetBoxStyle}
                className={`p-4 ${theme.textColor} leading-relaxed text-sm flex-grow rounded-lg`}
              >
                {eventData.event_description}
              </div>
              <div className="flex justify-between">
                <Card
                  theme={theme}
                  className="md:p-4 gap-x-4 flex md:flex-col justify-around items-center flex-shrink-0"
                  style={{ minWidth: "80px" }}
                >
                  <div className="text-center md:py-2">
                    <img
                      src={TypeIcon}
                      alt=""
                      size={20}
                      className={`mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>{TypeLabel}</p>
                  </div>
                  <div
                    className={`md:w-full h-full w-[1px] md:h-[1px] rounded-full my-1 ${
                      theme.isDark ? "bg-gray-700" : "bg-gray-400"
                    }`}
                  ></div>
                  <div className="text-center md:py-2">
                    <img
                      src={LocationIcon}
                      alt=""
                      className={`h-6 w-6 mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>
                      {LocationLabel}
                    </p>
                  </div>
                </Card>
                <div className="flex md:hidden pt-8">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0"
                    style={{ boxShadow: theme.shadowOutset }}
                  >
                    <img
                      src={
                        formatImagePath(eventData.event_logo) ||
                        "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo.svg/1200px-Starbucks_Corporation_Logo.svg.png"
                      }
                      alt="Event Logo"
                      className="w-full h-full rounded-full object-cover opacity-70 p-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:flex items-start space-x-4">
              <div className="md:w-3/5 space-y-4">
                <h3 className={`text-md font-semibold pt-2 ${theme.textColor}`}>
                  Status: {eventData.event_status}{" "}
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      eventData.event_status === "live"
                        ? "bg-green-400"
                        : eventData.event_status === "completed"
                        ? "bg-gray-400"
                        : "bg-blue-400"
                    } ml-2`}
                  ></span>
                </h3>
                <div style={insetBoxStyle} className="p-2 rounded-xl">
                  <div className="flex space-x-3 justify-around">
                    <Card
                      theme={theme}
                      className={`p-2 py-6 my-2 flex flex-col items-center justify-center w-2/5 rounded-lg border ${theme.isDark ? 'border-gray-700' : 'border-gray-400'}`}
                    >
                      <img
                        src={Event_Days}
                        alt="Event Days Icon"
                        className={`mb-1 h-5 w-5 ${
                          theme.isDark ? "" : "filter invert"
                        }`}
                      />
                      <p className={`text-3xl font-bold ${theme.textColor}`}>
                        {eventData.event_dates?.length || 0}
                      </p>
                      <p className={`text-sm mt-1 ${theme.textColor}`}>
                        Event Days
                      </p>
                    </Card>

                    <Card
                      theme={theme}
                      className={`p-2 py-6 my-2 flex flex-col border ${theme.isDark ? 'border-gray-700' : 'border-gray-400'} items-center justify-center w-2/5 rounded-lg`}
                    >
                      <img
                        src={Max_People}
                        alt="Max People Icon"
                        className={`mb-1 h-5 w-5 ${
                          theme.isDark ? "" : "filter invert"
                        }`}
                      />
                      <p className={`text-3xl font-bold ${theme.textColor}`}>
                        {formatCapacity(eventStats.totalCapacity)}
                      </p>
                      <p className={`text-sm mt-1 ${theme.textColor}`}>
                        Total Capacity
                      </p>
                    </Card>
                  </div>
                </div>
              </div>
              <div className="hidden w-2/5 md:flex px-10 pt-10">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0"
                  style={{ boxShadow: theme.shadowOutset }}
                >
                  <img
                    src={
                      formatImagePath(eventData.event_logo) ||
                      "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo.svg/1200px-Starbucks_Corporation_Logo.svg.png"
                    }
                    alt="Event Logo"
                    className="w-full h-full rounded-full object-cover opacity-70 p-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2 - Event Banner */}
          <Card
            theme={theme}
            className="relative overflow-hidden"
            customStyle={{ borderTopRightRadius: "50px" }}
          >
            {bannerImageUrl ? (
              <img
                src={bannerImageUrl}
                alt="Event Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">No Banner Available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Card 3 - Date & Time */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card theme={theme} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Event Schedule
              </h3>
            </div>
            <div style={insetBoxStyle} className="p-4">
              <div className="space-y-3">
                <div>
                  <p className={`text-sm ${theme.textColor} opacity-70`}>Date</p>
                  <p className={`text-lg font-semibold ${theme.textColor}`}>
                    {formattedDateRange.dateText}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textColor} opacity-70`}>Time</p>
                  <p className={`text-lg font-semibold ${theme.textColor}`}>
                    {formattedDateRange.timeText}
                  </p>
                </div>
                {eventData.gate_open_time && (
                  <div>
                    <p className={`text-sm ${theme.textColor} opacity-70`}>Gate Opens</p>
                    <p className={`text-lg font-semibold ${theme.textColor}`}>
                      {eventData.gate_open_time}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Card 4 - Location */}
          <Card theme={theme} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Location
              </h3>
            </div>
            {eventData.location_type === "offline" ? (
              <div style={insetBoxStyle} className="p-4">
                <div className="space-y-2">
                  <p className={`text-sm ${theme.textColor} opacity-70`}>Venue</p>
                  <p className={`text-base font-semibold ${theme.textColor}`}>
                    {eventData.venue || "Venue TBA"}
                  </p>
                  <p className={`text-sm ${theme.textColor}`}>
                    {eventData.location || "Address TBA"}
                  </p>
                </div>
                {eventData.exact_map_location && (
                  <div 
                    ref={mapRef} 
                    className="w-full h-40 mt-4 rounded-lg"
                    style={{ boxShadow: theme.shadowInset }}
                  />
                )}
              </div>
            ) : eventData.location_type === "online" ? (
              <div style={insetBoxStyle} className="p-4 text-center">
                <img
                  src={Online}
                  alt="Online Event"
                  className={`mx-auto mb-3 h-12 w-12 ${theme.isDark ? "" : "filter invert"}`}
                />
                <p className={`text-lg font-semibold ${theme.textColor}`}>
                  Online Event
                </p>
                <p className={`text-sm ${theme.textColor} opacity-70 mt-2`}>
                  Link will be provided before the event
                </p>
              </div>
            ) : (
              <div style={insetBoxStyle} className="p-4 text-center">
                <img
                  src={Offline}
                  alt="Recorded Event"
                  className={`mx-auto mb-3 h-12 w-12 ${theme.isDark ? "" : "filter invert"}`}
                />
                <p className={`text-lg font-semibold ${theme.textColor}`}>
                  Recorded Event
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Card 5 - Event Rules & Features */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card theme={theme} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Event Features
              </h3>
            </div>
            <div style={insetBoxStyle} className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <FeatureButton
                  theme={theme}
                  icon={Seat}
                  label="Seating"
                  value={eventData.seating_arrangement || "N/A"}
                />
                <FeatureButton
                  theme={theme}
                  icon={Language}
                  label="Languages"
                  value={eventData.event_language?.length || 0}
                  onClick={() => {}}
                  renderPopover={() => (
                    <LanguagePopover
                      languages={eventData.event_language || []}
                      theme={theme}
                    />
                  )}
                />
                <FeatureButton
                  theme={theme}
                  icon={Preference}
                  label="Preferences"
                  value={eventPreferences.length}
                  onClick={() => setShowPreferenceModal(true)}
                />
                <FeatureButton
                  theme={theme}
                  icon={Prohibit}
                  label="Prohibited"
                  value={eventData.prohibited_items?.length || 0}
                  renderPopover={() => (
                    <ProhibitPopover
                      items={eventData.prohibited_items || []}
                      theme={theme}
                    />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card theme={theme} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Event Rules
              </h3>
              <img
                src={Rules}
                alt="Rules"
                className={`h-6 w-6 ${theme.isDark ? "" : "filter invert"}`}
              />
            </div>
            <div style={insetBoxStyle} className="p-4">
              <p className={`text-sm ${theme.textColor} leading-relaxed`}>
                {rulesContent}
              </p>
            </div>
          </Card>
        </div>

        {/* Card 6 - Guests/Guides */}
        {eventData.guests && eventData.guests.length > 0 && (
          <Card theme={theme} className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Featured Guests
              </h3>
              {eventData.guests.length > guidesToShow && (
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevGuide}
                    disabled={currentGuideIndex === 0}
                    className={`p-2 rounded-full ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} disabled:opacity-30`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextGuide}
                    disabled={currentGuideIndex >= eventData.guests.length - guidesToShow}
                    className={`p-2 rounded-full ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} disabled:opacity-30`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {eventData.guests
                .slice(currentGuideIndex, currentGuideIndex + guidesToShow)
                .map((guest, index) => (
                  <div
                    key={index}
                    style={insetBoxStyle}
                    className="p-4 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleGuestClick(guest)}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className="w-24 h-24 rounded-full overflow-hidden mb-3"
                        style={{ boxShadow: theme.shadowOutset }}
                      >
                        <img
                          src={formatImagePath(guest.guest_profile) || GuideVector}
                          alt={guest.guest_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className={`text-base font-semibold ${theme.textColor} text-center`}>
                        {guest.guest_name}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Card 7 - Banking Details */}
        {allBankingDetails.length > 0 && (
          <Card theme={theme} className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Banking Details
              </h3>
              {allBankingDetails.length > 1 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevBank}
                    className={`p-2 rounded-full ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextBank}
                    className={`p-2 rounded-full ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
            <div style={insetBoxStyle} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textColor} opacity-70`}>Account Type</span>
                  <span className={`text-sm font-semibold ${theme.textColor}`}>
                    {currentBankInfo.bank_acc_type?.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textColor} opacity-70`}>Account Number</span>
                  <span className={`text-sm font-semibold ${theme.textColor}`}>
                    {currentBankInfo.bank_acc_no || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textColor} opacity-70`}>IFSC Code</span>
                  <span className={`text-sm font-semibold ${theme.textColor}`}>
                    {currentBankInfo.bank_ifsc || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textColor} opacity-70`}>Account Holder</span>
                  <span className={`text-sm font-semibold ${theme.textColor}`}>
                    {currentBankInfo.bank_acc_holder || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Card 8 - Hashtags */}
        {hashtags.length > 0 && (
          <Card theme={theme} className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Hashtags
              </h3>
            </div>
            <div style={insetBoxStyle} className="p-4">
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${theme.isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Card 9 - POCs */}
        {eventData.POCS && eventData.POCS.length > 0 && (
          <Card theme={theme} className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Points of Contact
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {eventData.POCS.map((poc, index) => (
                <div key={index} style={insetBoxStyle} className="p-4">
                  <p className={`text-base font-semibold ${theme.textColor} mb-2`}>
                    {poc.POC_name}
                  </p>
                  <div className="space-y-1">
                    <p className={`text-sm ${theme.textColor} opacity-70`}>
                      📧 {poc.POC_email}
                    </p>
                    <p className={`text-sm ${theme.textColor} opacity-70`}>
                      📞 {poc.POC_contact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Card 10 - Sub Events */}
        {eventData.sub_events && eventData.sub_events.length > 0 && (
          <Card theme={theme} className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Sub Events
              </h3>
            </div>
            <div className="space-y-4">
              {eventData.sub_events.map((subEvent, index) => (
                <div key={index} style={insetBoxStyle} className="p-4">
                  <h4 className={`text-lg font-semibold ${theme.textColor} mb-2`}>
                    {subEvent.event_name}
                  </h4>
                  <p className={`text-sm ${theme.textColor} mb-2`}>
                    {subEvent.event_description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${theme.isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      {subEvent.event_category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${theme.isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      {subEvent.location_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Card 11 - Social Links */}
        {(eventData.event_instagram_link || eventData.event_youtube_link) && (
          <Card theme={theme} className="p-6 mt-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                Social Media
              </h3>
            </div>
            <div className="flex space-x-4">
              {eventData.event_instagram_link && (
                <a
                  href={eventData.event_instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 p-4 text-center rounded-lg ${theme.isDark ? 'bg-pink-900 hover:bg-pink-800' : 'bg-pink-100 hover:bg-pink-200'} transition-colors`}
                  style={{ boxShadow: theme.shadowOutset }}
                >
                  <p className={`font-semibold ${theme.textColor}`}>Instagram</p>
                </a>
              )}
              {eventData.event_youtube_link && (
                <a
                  href={eventData.event_youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 p-4 text-center rounded-lg ${theme.isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'} transition-colors`}
                  style={{ boxShadow: theme.shadowOutset }}
                >
                  <p className={`font-semibold ${theme.textColor}`}>YouTube</p>
                </a>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showPreferenceModal && (
        <PreferenceModal
          theme={theme}
          preferences={eventPreferences}
          onClose={handleClosePreferenceModal}
        />
      )}

      {showImageModal && (
        <ImageModal
          theme={theme}
          images={eventData.event_images || []}
          currentIndex={currentImageIndex}
          onClose={() => setShowImageModal(false)}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}

      {showGuideModal && selectedGuest && (
        <GuideModal
          theme={theme}
          guest={selectedGuest}
          onClose={handleCloseGuideModal}
        />
      )}
    </div>
  );
};
export default PreviousEventDetails;
